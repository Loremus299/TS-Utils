export type Result<T, E> =
  | { success: true; data: T }
  | { success: false; error: E };

export function isOk<T, E>(data: T): Result<T, E> {
  return { success: true, data };
}

export function isError<T, E>(error: E): Result<T, E> {
  return { success: false, error };
}
