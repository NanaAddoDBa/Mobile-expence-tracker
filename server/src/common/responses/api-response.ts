export interface ApiSuccessResponse<T> {
  data: T;
  meta?: Record<string, unknown>;
}

export function createApiSuccess<T>(
  data: T,
  meta?: Record<string, unknown>,
): ApiSuccessResponse<T> {
  if (meta === undefined) {
    return { data };
  }

  return { data, meta };
}
