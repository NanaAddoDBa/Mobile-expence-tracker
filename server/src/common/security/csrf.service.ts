import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { doubleCsrf, DoubleCsrfUtilities } from "csrf-csrf";
import { Request, Response } from "express";
import { SESSION_COOKIE_NAME } from "../../auth/constants";

const DEVELOPMENT_CSRF_SECRET =
  "development-only-csrf-secret-change-before-production";

@Injectable()
export class CsrfService {
  private readonly utilities: DoubleCsrfUtilities;

  constructor(config: ConfigService) {
    const isProduction = config.get<string>("NODE_ENV") === "production";
    const secureCookie =
      isProduction || config.get<string>("COOKIE_SECURE") === "true";
    const configuredSecret = config.get<string>("CSRF_SECRET")?.trim();

    if (isProduction && (!configuredSecret || configuredSecret.length < 32)) {
      throw new Error(
        "CSRF_SECRET must contain at least 32 characters in production",
      );
    }

    const secret = configuredSecret || DEVELOPMENT_CSRF_SECRET;

    this.utilities = doubleCsrf({
      getSecret: () => secret,
      getSessionIdentifier: (request) => {
        const sessionToken = request.cookies?.[SESSION_COOKIE_NAME];
        return typeof sessionToken === "string" && sessionToken
          ? sessionToken
          : "anonymous";
      },
      cookieName: secureCookie
        ? "__Host-exp_tracker_csrf"
        : "exp_tracker_csrf",
      cookieOptions: {
        httpOnly: true,
        sameSite: "lax",
        secure: secureCookie,
        path: "/",
      },
      getCsrfTokenFromRequest: (request) =>
        request.get("x-csrf-token") || undefined,
    });
  }

  generateToken(request: Request, response: Response): string {
    return this.utilities.generateCsrfToken(request, response, {
      overwrite: true,
    });
  }

  validateRequest(request: Request): boolean {
    return this.utilities.validateRequest(request);
  }
}
