export type Result<T, E> =
  | { success: true; data: T }
  | { success: false; error: E };

export function makeData<T, E>(data: T): Result<T, E> {
  return { success: true, data };
}

export function makeError<T, E>(error: E): Result<T, E> {
  return { success: false, error };
}

export function unwrap<T, E>(output: Result<T, E>, fun: (arg: E) => never): T {
  return output.success ? output.data : fun(output.error);
}

export function mapData<T, E, R>(
  output: Result<T, E>,
  fun: (arg: T) => R,
): Result<R, E> {
  return output.success ? makeData(fun(output.data)) : makeError(output.error);
}

export async function mapDataAsync<T, E, R>(
  output: Result<T, E>,
  fun: (arg: T) => Promise<R>,
): Promise<Result<R, E>> {
  return output.success
    ? makeData(await fun(output.data))
    : makeError(output.error);
}

export function mapError<T, E, F>(
  output: Result<T, E>,
  fun: (arg: E) => F,
): Result<T, F> {
  return output.success ? makeData(output.data) : makeError(fun(output.error));
}

export async function mapErrorAsync<T, E, F>(
  output: Result<T, E>,
  fun: (arg: E) => Promise<F>,
): Promise<Result<T, F>> {
  return output.success
    ? makeData(output.data)
    : makeError(await fun(output.error));
}

export function fallback<T, E, V>(
  data: V,
  defaultError: E,
  funs: Array<(arg: V) => Result<T, E>>,
): Result<T, E> {
  let lastError = defaultError;
  for (const fun of funs) {
    const res = fun(data);
    if (res.success) {
      return res;
    }

    lastError = res.error;
  }
  return makeError<T, E>(lastError);
}

export async function fallbackAsync<T, E, V>(
  data: V,
  defaultError: E,
  funs: Array<(arg: V) => Promise<Result<T, E>>>,
): Promise<Result<T, E>> {
  let lastError = defaultError;
  for (const fun of funs) {
    const res = await fun(data);
    if (res.success) {
      return res;
    }

    lastError = res.error;
  }
  return makeError(lastError);
}

export async function tryCatch<T, V, E>(
  data: V,
  fun: (data: V) => Promise<T>,
  fallbackError: (error: unknown) => E,
): Promise<Result<T, E>> {
  try {
    const res = await fun(data);
    return makeData(res);
  } catch (error) {
    return makeError(fallbackError(error));
  }
}
