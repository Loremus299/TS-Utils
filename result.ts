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
  if (!output.success) {
    fun(output.error);
  } else {
    return output.data;
  }
}

export function ifOk<T, E, R>(
  output: Result<T, E>,
  fun: (arg: T) => R,
): Result<R, E> {
  if (output.success) {
    return ok(fun(output.data));
  } else {
    return error(output.error);
  }
}

export async function ifOkAsync<T, E, R>(
  output: Result<T, E>,
  fun: (arg: T) => Promise<R>,
): Promise<Result<R, E>> {
  if (output.success) {
    return ok(await fun(output.data));
  } else {
    return error(output.error);
  }
}

export function ifError<T, E, F>(
  output: Result<T, E>,
  fun: (arg: E) => F,
): Result<T, F> {
  if (!output.success) {
    return error(fun(output.error));
  } else {
    return ok(output.data);
  }
}

export async function ifErrorAsync<T, E, F>(
  output: Result<T, E>,
  fun: (arg: E) => Promise<F>,
): Promise<Result<T, F>> {
  if (!output.success) {
    return error(await fun(output.error));
  } else {
    return ok(output.data);
  }
}
