export type ResultType<T, E> =
  | { success: true; data: T }
  | { success: false; error: E };

export class Result<T, E> {
  private readonly value: ResultType<T, E>;

  private constructor(value: ResultType<T, E>) {
    this.value = value;
  }

  public static ok<T, E>(data: T): Result<T, E> {
    return new Result<T, E>({ success: true, data });
  }

  public static error<T, E>(error: E): Result<T, E> {
    return new Result<T, E>({ success: false, error: error });
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
  ): Promise<Result<T, string>> {
    try {
      const res = await fun(data);
      return Result.ok(res);
    } catch (error) {
      return Result.error(error as string);
    }
  }

  public match<R>(onOk: (t: T) => R, onErr: (e: E) => R): R {
    return this.value.success ? onOk(this.value.data) : onErr(this.value.error);
  }

  public async mapOk<R>(fun: (arg: T) => Promise<R>): Promise<Result<R, E>> {
    return this.value.success
      ? Result.ok<R, E>(await fun(this.value.data))
      : Result.error<R, E>(this.value.error);
  }

  public async mapError<F>(fun: (arg: E) => Promise<F>): Promise<Result<T, F>> {
    return this.value.success
      ? Result.ok<T, F>(this.value.data)
      : Result.error<T, F>(await fun(this.value.error));
  }
}
