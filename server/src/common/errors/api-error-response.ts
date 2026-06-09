import { ApiErrorCode } from "./api-error-code";

export interface ApiErrorResponse {
  error: {
    code: ApiErrorCode | string;
    message: string;
    details?: unknown;
    requestId?: string;
    timestamp: string;
  };
}
