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
    return new Result<T, E>({ success: false, error: error });
  }

  get result() {
    return this.value;
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

  public type() {
    return this.value as ResultType<T, E>;
  }

  public static async settle<const Vs extends Array<Promise<Result<any, any>>>>(
    results: Vs,
  ): Promise<
    Result<
      { [K in keyof Vs]: Vs[K] extends Result<infer T, any> ? T : never },
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
        [K in keyof Vs]: Vs[K] extends Result<infer T, any> ? T : never;
      },
    );
  }
}
