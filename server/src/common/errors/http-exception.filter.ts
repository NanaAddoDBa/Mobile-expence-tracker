import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Request, Response } from "express";
import { ApiErrorCode } from "./api-error-code";
import { ApiErrorResponse } from "./api-error-response";

interface RequestWithContext extends Request {
  requestId?: string;
}

interface HttpExceptionBody {
  message?: string | string[];
  details?: unknown;
}

function getErrorCode(status: number): ApiErrorCode {
  switch (status) {
    case HttpStatus.BAD_REQUEST:
    case HttpStatus.UNPROCESSABLE_ENTITY:
      return ApiErrorCode.VALIDATION_ERROR;
    case HttpStatus.UNAUTHORIZED:
      return ApiErrorCode.UNAUTHORIZED;
    case HttpStatus.FORBIDDEN:
      return ApiErrorCode.FORBIDDEN;
    case HttpStatus.NOT_FOUND:
      return ApiErrorCode.NOT_FOUND;
    case HttpStatus.CONFLICT:
      return ApiErrorCode.CONFLICT;
    case HttpStatus.TOO_MANY_REQUESTS:
      return ApiErrorCode.RATE_LIMITED;
    default:
      return ApiErrorCode.INTERNAL_ERROR;
  }
}

function getRequestId(request: RequestWithContext): string | undefined {
  if (request.requestId) {
    return request.requestId;
  }

  const headerValue = request.headers["x-request-id"];

  if (typeof headerValue === "string" && headerValue.trim()) {
    return headerValue;
  }

  if (Array.isArray(headerValue) && headerValue[0]?.trim()) {
    return headerValue[0];
  }

  return request.requestId;
}

function getExceptionMessage(
  exception: HttpException,
  exceptionResponse: string | HttpExceptionBody,
): { message: string; details?: unknown } {
  if (typeof exceptionResponse === "string") {
    return { message: exceptionResponse };
  }

  if (Array.isArray(exceptionResponse.message)) {
    return {
      message: "Validation failed",
      details: exceptionResponse.message,
    };
  }

  return {
    message: exceptionResponse.message || exception.message,
    ...(exceptionResponse.details === undefined
      ? {}
      : { details: exceptionResponse.details }),
  };
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter<unknown> {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const request = http.getRequest<RequestWithContext>();
    const response = http.getResponse<Response>();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const errorDetails =
      exception instanceof HttpException
        ? getExceptionMessage(
            exception,
            exception.getResponse() as string | HttpExceptionBody,
          )
        : { message: "Internal server error" };
    const requestId = getRequestId(request);

    if (!(exception instanceof HttpException)) {
      this.logger.error(
        JSON.stringify({
          event: "unhandled_http_error",
          requestId,
          method: request.method,
          path: request.originalUrl.split("?")[0],
        }),
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    const body: ApiErrorResponse = {
      error: {
        code: getErrorCode(status),
        message: errorDetails.message,
        ...(errorDetails.details === undefined
          ? {}
          : { details: errorDetails.details }),
        ...(requestId === undefined ? {} : { requestId }),
        timestamp: new Date().toISOString(),
      },
    };

    response.status(status).json(body);
  }
}
