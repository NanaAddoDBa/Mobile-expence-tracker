import { requestJson } from "./httpClient";

interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

interface PaginatedApiResponse<TData> {
  data: TData;
  meta?: {
    pagination?: PaginationMeta;
  };
}

const MAX_PAGE_SIZE = 100;

export async function requestAllPages<TData, TItem>(
  path: string,
  selectItems: (data: TData) => TItem[]
): Promise<TItem[]> {
  const items: TItem[] = [];
  let page = 1;

  while (true) {
    const separator = path.includes("?") ? "&" : "?";
    const response = await requestJson<PaginatedApiResponse<TData>>(
      `${path}${separator}page=${page}&pageSize=${MAX_PAGE_SIZE}`
    );
    items.push(...selectItems(response.data));

    const totalPages = response.meta?.pagination?.totalPages;
    if (totalPages === undefined || page >= totalPages) {
      return items;
    }

    if (!Number.isInteger(totalPages) || totalPages < 0) {
      throw new Error("The API returned invalid pagination metadata.");
    }

    page += 1;
  }
}
