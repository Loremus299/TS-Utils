export type Result<T, E> =
  | { success: true; data: T }
  | { success: false; error: E };

export function ok<T, E>(data: T): Result<T, E> {
  return { success: true, data };
}

export function error<T, E>(error: E): Result<T, E> {
  return { success: false, error };
}

export function unwrap<T, E>(output: Result<T, E>, fun: (arg: E) => never): T {
  return output.success ? output.data : fun(output.error);
}

export function ifOk<T, E, R>(
  output: Result<T, E>,
  fun: (arg: T) => R,
): Result<R, E> {
  return output.success ? ok(fun(output.data)) : error(output.error);
}

export async function ifOkAsync<T, E, R>(
  output: Result<T, E>,
  fun: (arg: T) => Promise<R>,
): Promise<Result<R, E>> {
  return output.success ? ok(await fun(output.data)) : error(output.error);
}

export function ifError<T, E, F>(
  output: Result<T, E>,
  fun: (arg: E) => F,
): Result<T, F> {
  return output.success ? ok(output.data) : error(fun(output.error));
}

export async function ifErrorAsync<T, E, F>(
  output: Result<T, E>,
  fun: (arg: E) => Promise<F>,
): Promise<Result<T, F>> {
  return output.success ? ok(output.data) : error(await fun(output.error));
}
