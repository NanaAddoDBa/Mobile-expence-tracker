import { ApiSuccessResponse, createApiSuccess } from "./api-response";

export interface PaginationInput {
  page: number;
  pageSize: number;
  total: number;
}

export interface PaginationMeta extends PaginationInput {
  totalPages: number;
}

export function createPaginatedResponse<T>(
  items: T[],
  pagination: PaginationInput,
): ApiSuccessResponse<T[]> {
  const totalPages =
    pagination.total === 0
      ? 0
      : Math.ceil(pagination.total / pagination.pageSize);

  return createApiSuccess(items, {
    pagination: {
      ...pagination,
      totalPages,
    } satisfies PaginationMeta,
  });
}
