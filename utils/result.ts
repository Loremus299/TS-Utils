export type ResultType<T, E> =
  | { success: true; data: T }
  | { success: false; error: E };

export class Result<T, E> {
  public readonly value: ResultType<T, E>;

  private constructor(value: ResultType<T, E>) {
    this.value = value;
  }

  public static ok<T, E>(data: T): Result<T, E> {
    return new Result<T, E>({ success: true, data });
  }

  public static error<T, E>(error: E): Result<T, E> {
    return new Result<T, E>({ success: false, error });
  }

  public static async fallback<T, E, V>(
    data: V,
    defaultError: E,
    funs: Array<(arg: V) => Promise<Result<T, E>>>,
  ): Promise<Result<T, E>> {
    let lastError: E = defaultError;

    for (const fun of funs) {
      const res: Result<T, E> = await fun(data);
      if (res.value.success) {
        return res;
      }

      lastError = res.value.error;
    }

    return Result.error<T, E>(lastError);
  }

  public static async tryCatch<T, V>(
    data: V,
    fun: (data: V) => Promise<T>,
  ): Promise<Result<T, unknown>> {
    try {
      const res = await fun(data);
      return Result.ok(res);
    } catch (error) {
      return Result.error(error);
    }
  }

  public static async settle<
    const Vs extends Array<Promise<Result<unknown, unknown>>>,
  >(
    results: Vs,
  ): Promise<
    Result<
      { [K in keyof Vs]: Vs[K] extends Result<infer T, unknown> ? T : never },
      null
    >
  > {
    const settled: unknown[] = [];
    for (const result of results) {
      const res = await result;
      if (!res.value.success) {
        return Result.error(null);
      } else {
        settled.push(res.value.data);
      }
    }

    return Result.ok(
      settled as {
        [K in keyof Vs]: Vs[K] extends Result<infer T, unknown> ? T : never;
      },
    );
  }

  public match<R>(onOk: (t: T) => R, onErr: (e: E) => R): R {
    return this.value.success ? onOk(this.value.data) : onErr(this.value.error);
  }

  public mapOk<R>(fun: (arg: T) => R): Result<R, E> {
    return this.value.success
      ? Result.ok<R, E>(fun(this.value.data))
      : Result.error<R, E>(this.value.error);
  }

  public mapError<F>(fun: (arg: E) => F): Result<T, F> {
    return this.value.success
      ? Result.ok<T, F>(this.value.data)
      : Result.error<T, F>(fun(this.value.error));
  }

  public unrelated(fun: () => unknown): Result<T, E> {
    fun();
    return this;
  }

  public onOk(fun: (arg: T) => unknown): Result<T, E> {
    if (this.value.success) {
      fun(this.value.data);
    }
    return this;
  }

  public onError(fun: (arg: E) => unknown): Result<T, E> {
    if (!this.value.success) {
      fun(this.value.error);
    }
    return this;
  }

  public isOk(): this is Result<T, E> & { value: { success: true; data: T } } {
    return this.value.success;
  }

  public isError(): this is Result<T, E> & {
    value: { success: false; error: E };
  } {
    return !this.value.success;
  }

  get data(): this extends { value: { success: true; data: T } }
    ? T
    : this extends { value: { success: false; error: E } }
      ? E
      : Result<T, E> {
    if (this.value.success) {
      return this.value.data as any;
    }
    return this.value.error as any;
  }
}
