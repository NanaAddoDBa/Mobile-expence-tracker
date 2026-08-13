import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import { Request, Response } from "express";
import {
  ApiSuccessResponse,
  createApiSuccess,
} from "../common/responses/api-response";
import { AuthGuard, getSessionTokenFromRequest } from "./auth.guard";
import { AuthService } from "./auth.service";
import {
  AuthRequestContext,
  AuthenticatedRequest,
  SafeUserResponse,
} from "./auth.types";
import { SESSION_COOKIE_NAME } from "./constants";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";

interface UserPayload {
  user: SafeUserResponse;
}

interface LogoutPayload {
  success: true;
}

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  async register(
    @Body() input: RegisterDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<ApiSuccessResponse<UserPayload>> {
    const result = await this.authService.register(
      input,
      this.getRequestContext(request),
    );

    response.cookie(
      SESSION_COOKIE_NAME,
      result.sessionToken,
      this.authService.getSessionCookieOptions(result.expiresAt),
    );

    return createApiSuccess({ user: result.user });
  }

  @Post("login")
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() input: LoginDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<ApiSuccessResponse<UserPayload>> {
    const result = await this.authService.login(
      input,
      this.getRequestContext(request),
    );

    response.cookie(
      SESSION_COOKIE_NAME,
      result.sessionToken,
      this.authService.getSessionCookieOptions(result.expiresAt),
    );

    return createApiSuccess({ user: result.user });
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

  private getRequestContext(request: Request): AuthRequestContext {
    const userAgent = request.get("user-agent");

    return {
      ...(request.ip ? { ipAddress: request.ip } : {}),
      ...(userAgent ? { userAgent } : {}),
    };
  }
}
