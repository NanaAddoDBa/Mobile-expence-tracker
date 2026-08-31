import "reflect-metadata";
import { Logger, ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import cookieParser from "cookie-parser";
import { json, urlencoded } from "express";
import helmet from "helmet";
import { AppModule } from "./app.module";
import { HttpExceptionFilter } from "./common/errors/http-exception.filter";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  const isProduction = process.env.NODE_ENV === "production";
  const frontendOrigins = (process.env.FRONTEND_ORIGIN || "http://localhost:3000")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  const port = Number(process.env.PORT || 4000);
  const bodyLimit = process.env.REQUEST_BODY_LIMIT || "100kb";

  app.use(
    helmet({
      strictTransportSecurity: isProduction ? undefined : false,
    }),
  );
  app.use(json({ limit: bodyLimit }));
  app.use(urlencoded({ extended: false, limit: bodyLimit }));
  app.use(cookieParser());

  const trustProxy = process.env.TRUST_PROXY?.trim();
  if (trustProxy) {
    const expressApplication = app.getHttpAdapter().getInstance();
    expressApplication.set("trust proxy", parseTrustProxy(trustProxy));
  }

  app.setGlobalPrefix("api");
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: false,
      },
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  app.enableCors({
    origin: frontendOrigins,
    credentials: true,
    allowedHeaders: ["Content-Type", "X-CSRF-Token", "X-Request-ID"],
    methods: ["GET", "HEAD", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
  });
  app.enableShutdownHooks();

  await app.listen(port, "0.0.0.0");
  const httpServer = app.getHttpServer() as {
    requestTimeout: number;
    headersTimeout: number;
    keepAliveTimeout: number;
  };
  httpServer.requestTimeout = readTimeout("HTTP_REQUEST_TIMEOUT_MS", 30_000);
  httpServer.headersTimeout = readTimeout("HTTP_HEADERS_TIMEOUT_MS", 35_000);
  httpServer.keepAliveTimeout = readTimeout("HTTP_KEEP_ALIVE_TIMEOUT_MS", 5_000);
}

function parseTrustProxy(value: string): boolean | number | string {
  if (value === "true") return true;
  if (value === "false") return false;

  const hops = Number(value);
  return Number.isInteger(hops) && hops >= 0 ? hops : value;
}

function readTimeout(key: string, fallback: number): number {
  const value = Number(process.env[key]);
  return Number.isInteger(value) && value >= 1_000 && value <= 120_000
    ? value
    : fallback;
}

void bootstrap().catch((error: unknown) => {
  const logger = new Logger("Bootstrap");
  logger.error(
    "Expense Tracker API failed to start",
    error instanceof Error ? error.stack : undefined,
  );
  process.exitCode = 1;
});
