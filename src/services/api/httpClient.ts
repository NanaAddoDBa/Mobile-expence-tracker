import { API_BASE_URL } from "./apiMode";

interface ApiErrorBody {
  error?: {
    message?: string;
    code?: string;
  };
}

export class ApiRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

export async function requestJson<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const response = await fetch(createApiUrl(path), {
    ...init,
    credentials: "include",
    headers: {
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
  });

  if (!response.ok) {
    throw await createApiRequestError(response);
  }

  return (await response.json()) as T;
}

function createApiUrl(path: string): string {
  const normalizedBase = API_BASE_URL.replace(/\/$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  return `${normalizedBase}/api${normalizedPath}`;
}

async function createApiRequestError(response: Response): Promise<ApiRequestError> {
  try {
    const body = (await response.json()) as ApiErrorBody;
    return new ApiRequestError(
      body.error?.message || `Request failed with status ${response.status}`,
      response.status,
      body.error?.code
    );
  } catch {
    return new ApiRequestError(
      `Request failed with status ${response.status}`,
      response.status
    );
  }
}
