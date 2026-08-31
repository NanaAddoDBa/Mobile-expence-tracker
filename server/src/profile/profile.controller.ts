import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import { Response } from "express";
import { AuthGuard } from "../auth/auth.guard";
import { AuthService } from "../auth/auth.service";
import { AuthenticatedRequest } from "../auth/auth.types";
import { SESSION_COOKIE_NAME } from "../auth/constants";
import {
  ApiSuccessResponse,
  createApiSuccess,
} from "../common/responses/api-response";
import { DeleteAccountDto } from "./dto/delete-account.dto";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { UpdateSettingsDto } from "./dto/update-settings.dto";
import { ProfileService } from "./profile.service";
import { UserProfileResponse } from "./profile.types";

interface ProfilePayload {
  profile: UserProfileResponse;
}

@Controller("profile")
@UseGuards(AuthGuard)
export class ProfileController {
  constructor(
    private readonly profileService: ProfileService,
    private readonly authService: AuthService,
  ) {}

  @Get()
  async getProfile(
    @Req() request: AuthenticatedRequest,
  ): Promise<ApiSuccessResponse<ProfilePayload>> {
    const profile = await this.profileService.getProfile(request.user!.id);
    return createApiSuccess({ profile });
  }

  @Patch()
  async updateProfile(
    @Req() request: AuthenticatedRequest,
    @Body() input: UpdateProfileDto,
  ): Promise<ApiSuccessResponse<ProfilePayload>> {
    const profile = await this.profileService.updateProfile(
      request.user!.id,
      input,
    );
    return createApiSuccess({ profile });
  }

  @Patch("settings")
  async updateSettings(
    @Req() request: AuthenticatedRequest,
    @Body() input: UpdateSettingsDto,
  ): Promise<ApiSuccessResponse<ProfilePayload>> {
    const profile = await this.profileService.updateSettings(
      request.user!.id,
      input,
    );
    return createApiSuccess({ profile });
  }

  @Get("export")
  async exportData(
    @Req() request: AuthenticatedRequest,
  ): Promise<ApiSuccessResponse<Record<string, unknown>>> {
    return createApiSuccess(
      await this.profileService.exportData(request.user!.id),
    );
  }

  @Delete()
  async deleteAccount(
    @Req() request: AuthenticatedRequest,
    @Body() input: DeleteAccountDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<ApiSuccessResponse<{ success: true }>> {
    await this.profileService.deleteAccount(request.user!.id, input);
    response.clearCookie(
      SESSION_COOKIE_NAME,
      this.authService.getClearCookieOptions(),
    );
    return createApiSuccess({ success: true });
  }
}
