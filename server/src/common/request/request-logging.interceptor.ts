import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Injectable,
  Logger,
  NestInterceptor,
} from "@nestjs/common";
import { Response } from "express";
import { Observable, tap } from "rxjs";
import { RequestWithContext } from "./request-context.middleware";

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger("HttpRequest");

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== "http") return next.handle();

    const request = context.switchToHttp().getRequest<RequestWithContext>();
    const response = context.switchToHttp().getResponse<Response>();
    const startedAt = process.hrtime.bigint();
    const log = (status: number) => {
      const durationMs =
        Number(process.hrtime.bigint() - startedAt) / 1_000_000;
      this.logger.log(
        JSON.stringify({
          event: "http_request",
          requestId: request.requestId,
          method: request.method,
          path: request.originalUrl.split("?")[0],
          status,
          durationMs: Math.round(durationMs * 100) / 100,
        }),
      );
    };

    return next.handle().pipe(
      tap({
        next: () => log(response.statusCode),
        error: (error: unknown) =>
          log(error instanceof HttpException ? error.getStatus() : 500),
      }),
    );
  }
}
