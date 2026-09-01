export type ApiMode = "http" | "mock";

const configuredMode = import.meta.env.VITE_API_MODE as ApiMode | undefined;

export const API_MODE: ApiMode =
  import.meta.env.MODE === "test" ? "mock" : configuredMode ?? "http";

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";
export const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim() || "";

export const USES_HTTP_API = API_MODE === "http";
