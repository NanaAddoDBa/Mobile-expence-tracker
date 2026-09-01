import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { AuthenticatedRequest } from "./auth.types";

@Injectable()
export class EmailVerifiedGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!request.user?.emailVerified) {
      throw new ForbiddenException(
        "Verify your email address before connecting or syncing a bank account",
      );
    }
    return true;
  }
}
