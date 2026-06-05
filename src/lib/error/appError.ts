export type AppErrorCode =
  | "STORAGE_ERROR"
  | "VALIDATION_ERROR"
  | "IMPORT_ERROR"
  | "RECEIPT_SCAN_ERROR"
  | "UNKNOWN_ERROR";

export interface AppError {
  code: AppErrorCode;
  message: string;
  cause?: unknown;
}

export function createAppError(code: AppErrorCode, message: string, cause?: unknown): AppError {
  return { code, message, cause };
}

export function getUserFriendlyErrorMessage(error: AppError | unknown): string {
  if (isAppError(error)) {
    switch (error.code) {
      case "STORAGE_ERROR":
        return "We could not load your saved data.";
      case "VALIDATION_ERROR":
        return "Please check the details and try again.";
      case "IMPORT_ERROR":
        return "Import failed. Please try again.";
      case "RECEIPT_SCAN_ERROR":
        return "Receipt scanning failed. Please try again.";
      case "UNKNOWN_ERROR":
        return "Something went wrong. Please try again.";
    }
  }

  return "Something went wrong. Please try again.";
}

function isAppError(error: unknown): error is AppError {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    "message" in error
  );
}
