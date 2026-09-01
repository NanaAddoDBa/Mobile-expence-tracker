import { API_BASE_URL } from "./apiMode";

interface ApiErrorBody {
  error?: {
    message?: string;
    code?: string;
  };
}

interface CsrfResponse {
  data: {
    csrfToken: string;
  };
}

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
const SESSION_MUTATION_PATHS = new Set([
  "/auth/register",
  "/auth/login",
  "/auth/google",
  "/auth/logout",
  "/auth/logout-all",
]);
let csrfTokenPromise: Promise<string> | undefined;

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
  const method = (init.method || "GET").toUpperCase();
  const headers = new Headers(init.headers);

  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (!SAFE_METHODS.has(method)) {
    headers.set("X-CSRF-Token", await getCsrfToken());
  }

  const response = await fetch(createApiUrl(path), {
    ...init,
    credentials: "include",
    headers,
  });

  if (!response.ok) {
    if (response.status === 403) {
      csrfTokenPromise = undefined;
    }
    throw await createApiRequestError(response);
  }

  if (SESSION_MUTATION_PATHS.has(path)) {
    csrfTokenPromise = undefined;
  }

  return (await response.json()) as T;
}

async function getCsrfToken(): Promise<string> {
  if (!csrfTokenPromise) {
    csrfTokenPromise = fetch(createApiUrl("/auth/csrf"), {
      credentials: "include",
    })
      .then(async (response) => {
        if (!response.ok) {
          throw await createApiRequestError(response);
        }

        const body = (await response.json()) as CsrfResponse;
        if (!body.data.csrfToken) {
          throw new Error("The API did not return a CSRF token.");
        }

        return body.data.csrfToken;
      })
      .catch((error: unknown) => {
        csrfTokenPromise = undefined;
        throw error;
      });
  }

  return csrfTokenPromise;
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
