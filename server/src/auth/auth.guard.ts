import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { AuthenticatedRequest } from "./auth.types";
import { SESSION_COOKIE_NAME } from "./constants";

export function getSessionTokenFromRequest(
  request: AuthenticatedRequest,
): string | undefined {
  const cookies = (request as { cookies?: unknown }).cookies;

  if (!cookies || typeof cookies !== "object") {
    return undefined;
  }

  const token = (cookies as Record<string, unknown>)[SESSION_COOKIE_NAME];

  return typeof token === "string" && token.length > 0 ? token : undefined;
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const validatedSession = await this.authService.validateSession(
      getSessionTokenFromRequest(request),
    );

    if (!validatedSession) {
      throw new UnauthorizedException("Authentication required");
    }

    request.user = validatedSession.user;
    request.authSessionId = validatedSession.sessionId;

    return true;
  }
}
