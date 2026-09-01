import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Param,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { Request, Response } from "express";
import { CsrfService } from "../common/security/csrf.service";
import {
  ApiSuccessResponse,
  createApiSuccess,
} from "../common/responses/api-response";
import { AuthGuard, getSessionTokenFromRequest } from "./auth.guard";
import { AuthService } from "./auth.service";
import {
  AuthRequestContext,
  AuthenticatedRequest,
  AuthSessionResult,
  SafeUserResponse,
} from "./auth.types";
import { SESSION_COOKIE_NAME } from "./constants";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import { GoogleAuthDto } from "./dto/google-auth.dto";
import { GoogleIdentityService } from "./google-identity.service";
import { AccountRecoveryService } from "./account-recovery.service";
import {
  AccountSecurityService,
  SessionResponse,
} from "./account-security.service";
import { ChangePasswordDto } from "./dto/change-password.dto";
import { ConfirmEmailVerificationDto } from "./dto/confirm-email-verification.dto";
import { ConfirmPasswordResetDto } from "./dto/confirm-password-reset.dto";
import { RequestPasswordResetDto } from "./dto/request-password-reset.dto";

interface UserPayload {
  user: SafeUserResponse;
}

interface LogoutPayload {
  success: true;
}

interface GoogleUserPayload extends UserPayload {
  isNewUser: boolean;
}

interface CsrfPayload {
  csrfToken: string;
}

interface SuccessPayload {
  success: true;
}

@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly googleIdentity: GoogleIdentityService,
    private readonly csrf: CsrfService,
    private readonly recovery: AccountRecoveryService,
    private readonly accountSecurity: AccountSecurityService,
  ) {}

  @Get("csrf")
  csrfToken(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): ApiSuccessResponse<CsrfPayload> {
    return createApiSuccess({
      csrfToken: this.csrf.generateToken(request, response),
    });
  }

  @Post("register")
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async register(
    @Body() input: RegisterDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<ApiSuccessResponse<UserPayload>> {
    const result = await this.authService.register(
      input,
      this.getRequestContext(request),
    );

    this.setSessionCookie(response, result);
    await this.recovery.requestEmailVerification(result.user.id);

    return createApiSuccess({ user: result.user });
  }

  @Post("login")
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async login(
    @Body() input: LoginDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<ApiSuccessResponse<UserPayload>> {
    const result = await this.authService.login(
      input,
      this.getRequestContext(request),
    );

    this.setSessionCookie(response, result);

    return createApiSuccess({ user: result.user });
  }

  @Post("google")
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async google(
    @Body() input: GoogleAuthDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<ApiSuccessResponse<GoogleUserPayload>> {
    const identity = await this.googleIdentity.verifyCredential(
      input.credential,
    );
    const result = await this.authService.authenticateWithGoogle(
      identity,
      this.getRequestContext(request),
    );

    this.setSessionCookie(response, result);

    return createApiSuccess({
      user: result.user,
      isNewUser: result.isNewUser,
    });
  }

  @Post("logout")
  @HttpCode(HttpStatus.OK)
  async logout(
    @Req() request: AuthenticatedRequest,
    @Res({ passthrough: true }) response: Response,
  ): Promise<ApiSuccessResponse<LogoutPayload>> {
    await this.authService.logout(
      getSessionTokenFromRequest(request),
      this.getRequestContext(request),
    );

    response.clearCookie(
      SESSION_COOKIE_NAME,
      this.authService.getClearCookieOptions(),
    );

    return createApiSuccess({ success: true });
  }

  @Get("me")
  @UseGuards(AuthGuard)
  async me(
    @Req() request: AuthenticatedRequest,
  ): Promise<ApiSuccessResponse<UserPayload>> {
    if (!request.user) {
      throw new UnauthorizedException("Authentication required");
    }

    const user = await this.authService.getCurrentUser(request.user.id);

    return createApiSuccess({ user });
  }

  @Post("email-verification/request")
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @Throttle({ default: { limit: 3, ttl: 60 * 60_000 } })
  async requestEmailVerification(
    @Req() request: AuthenticatedRequest,
  ): Promise<ApiSuccessResponse<{ delivered: boolean }>> {
    const delivered = await this.recovery.requestEmailVerification(
      request.user!.id,
    );
    return createApiSuccess({ delivered });
  }

  @Post("email-verification/confirm")
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async confirmEmailVerification(
    @Body() input: ConfirmEmailVerificationDto,
  ): Promise<ApiSuccessResponse<SuccessPayload>> {
    await this.recovery.confirmEmailVerification(input.token);
    return createApiSuccess({ success: true });
  }

  @Post("password-reset/request")
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 15 * 60_000 } })
  async requestPasswordReset(
    @Body() input: RequestPasswordResetDto,
  ): Promise<ApiSuccessResponse<SuccessPayload>> {
    await this.recovery.requestPasswordReset(input.email);
    return createApiSuccess({ success: true });
  }

  @Post("password-reset/confirm")
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 15 * 60_000 } })
  async confirmPasswordReset(
    @Body() input: ConfirmPasswordResetDto,
  ): Promise<ApiSuccessResponse<SuccessPayload>> {
    await this.recovery.confirmPasswordReset(input.token, input.newPassword);
    return createApiSuccess({ success: true });
  }

  @Get("sessions")
  @UseGuards(AuthGuard)
  async listSessions(
    @Req() request: AuthenticatedRequest,
  ): Promise<ApiSuccessResponse<{ sessions: SessionResponse[] }>> {
    const sessions = await this.accountSecurity.listSessions(
      request.user!.id,
      request.authSessionId,
    );
    return createApiSuccess({ sessions });
  }

  @Delete("sessions/:sessionId")
  @UseGuards(AuthGuard)
  async revokeSession(
    @Req() request: AuthenticatedRequest,
    @Param("sessionId") sessionId: string,
  ): Promise<ApiSuccessResponse<SuccessPayload>> {
    await this.accountSecurity.revokeSession(
      request.user!.id,
      sessionId,
      request.authSessionId,
    );
    return createApiSuccess({ success: true });
  }

  @Post("change-password")
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  @Throttle({ default: { limit: 5, ttl: 15 * 60_000 } })
  async changePassword(
    @Req() request: AuthenticatedRequest,
    @Body() input: ChangePasswordDto,
  ): Promise<ApiSuccessResponse<SuccessPayload>> {
    await this.accountSecurity.changePassword(
      request.user!.id,
      request.authSessionId,
      input.currentPassword,
      input.newPassword,
    );
    return createApiSuccess({ success: true });
  }

  @Post("logout-all")
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthGuard)
  async logoutAll(
    @Req() request: AuthenticatedRequest,
    @Res({ passthrough: true }) response: Response,
  ): Promise<ApiSuccessResponse<SuccessPayload>> {
    await this.accountSecurity.revokeAllSessions(request.user!.id);
    response.clearCookie(
      SESSION_COOKIE_NAME,
      this.authService.getClearCookieOptions(),
    );
    return createApiSuccess({ success: true });
  }

  private getRequestContext(request: Request): AuthRequestContext {
    const userAgent = request.get("user-agent");

    return {
      ...(request.ip ? { ipAddress: request.ip } : {}),
      ...(userAgent ? { userAgent } : {}),
    };
  }

  private setSessionCookie(
    response: Response,
    result: AuthSessionResult,
  ): void {
    response.cookie(
      SESSION_COOKIE_NAME,
      result.sessionToken,
      this.authService.getSessionCookieOptions(result.expiresAt),
    );
  }
}
