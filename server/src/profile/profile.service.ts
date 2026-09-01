import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { ConnectedAccountsService } from "../connected-accounts/connected-accounts.service";
import { DeleteAccountDto } from "./dto/delete-account.dto";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { UpdateSettingsDto } from "./dto/update-settings.dto";
import {
  toProfileSettingsResponse,
  UserProfileResponse,
} from "./profile.types";

@Injectable()
export class ProfileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly connectedAccounts: ConnectedAccountsService,
  ) {}

  async getProfile(userId: string): Promise<UserProfileResponse> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { settings: true },
    });

    if (!user) {
      throw new NotFoundException("User profile not found");
    }

    const settings =
      user.settings ||
      (await this.prisma.userSettings.create({ data: { userId } }));

    return {
      id: user.id,
      email: user.email,
      name: user.name || user.email.split("@")[0],
      status: user.status,
      emailVerifiedAt: user.emailVerifiedAt?.toISOString() ?? null,
      createdAt: user.createdAt.toISOString(),
      ...toProfileSettingsResponse(settings),
    };
  }

  async updateProfile(
    userId: string,
    input: UpdateProfileDto,
  ): Promise<UserProfileResponse> {
    const result = await this.prisma.user.updateMany({
      where: { id: userId },
      data: {
        ...(input.name === undefined ? {} : { name: input.name.trim() }),
      },
    });

    if (result.count === 0) {
      throw new NotFoundException("User profile not found");
    }

    await this.writeAudit(userId, "PROFILE_UPDATED");
    return this.getProfile(userId);
  }

  async updateSettings(
    userId: string,
    input: UpdateSettingsDto,
  ): Promise<UserProfileResponse> {
    await this.ensureUserExists(userId);
    const data = this.toSettingsUpdate(input);

    await this.prisma.userSettings.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    });
    await this.writeAudit(userId, "PROFILE_SETTINGS_UPDATED");

    return this.getProfile(userId);
  }

  async exportData(userId: string): Promise<Record<string, unknown>> {
    await this.writeAudit(userId, "ACCOUNT_DATA_EXPORTED");
    const data = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        emailVerifiedAt: true,
        lastLoginAt: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        settings: true,
        authIdentities: {
          select: {
            provider: true,
            providerSubject: true,
            providerEmail: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        sessions: {
          select: {
            id: true,
            userAgent: true,
            ipAddress: true,
            expiresAt: true,
            revokedAt: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        expenses: true,
        incomes: true,
        budgets: true,
        goals: true,
        notifications: true,
        auditLogs: true,
        connectedAccounts: true,
        receipts: true,
        receiptExtractions: true,
        externalAccounts: true,
        externalTransactions: true,
        importBatches: true,
        consentRecords: true,
        accountSyncRuns: true,
      },
    });

    if (!data) {
      throw new NotFoundException("User profile not found");
    }

    return {
      exportVersion: 1,
      generatedAt: new Date().toISOString(),
      data,
    };
  }

  async deleteAccount(userId: string, input: DeleteAccountDto): Promise<void> {
    if (input.confirmation !== "DELETE") {
      throw new BadRequestException("Account deletion confirmation is invalid");
    }

    await this.connectedAccounts.revokeAllForUser(userId);
    await this.prisma.$transaction(async (transaction) => {
      const user = await transaction.user.findUnique({
        where: { id: userId },
        select: { id: true },
      });

      if (!user) {
        throw new NotFoundException("User profile not found");
      }

      await transaction.auditLog.create({
        data: {
          userId,
          action: "ACCOUNT_DELETED",
          entityType: "User",
          entityId: userId,
        },
      });
      await transaction.user.delete({ where: { id: userId } });
    });
  }

  private toSettingsUpdate(
    input: UpdateSettingsDto,
  ): Prisma.UserSettingsUncheckedCreateWithoutUserInput {
    return {
      ...(input.theme === undefined
        ? {}
        : { themePreference: input.theme }),
      ...(input.currency === undefined
        ? {}
        : { baseCurrency: input.currency }),
      ...(input.language === undefined ? {} : { language: input.language }),
      ...(input.accessibility?.largerText === undefined
        ? {}
        : { largerText: input.accessibility.largerText }),
      ...(input.accessibility?.reduceMotion === undefined
        ? {}
        : { reduceMotion: input.accessibility.reduceMotion }),
      ...(input.accessibility?.highContrast === undefined
        ? {}
        : { highContrast: input.accessibility.highContrast }),
      ...(input.accessibility?.comfortableLayout === undefined
        ? {}
        : { comfortableLayout: input.accessibility.comfortableLayout }),
      ...(input.notifications?.enableAlerts === undefined
        ? {}
        : { budgetAlertsEnabled: input.notifications.enableAlerts }),
      ...(input.notifications?.budgetThreshold === undefined
        ? {}
        : { budgetAlertThreshold: input.notifications.budgetThreshold }),
      ...(input.notifications?.recurringReminders === undefined
        ? {}
        : {
            recurringRemindersEnabled:
              input.notifications.recurringReminders,
          }),
      ...(input.notifications?.weeklySummaries === undefined
        ? {}
        : { weeklySummaryEnabled: input.notifications.weeklySummaries }),
    };
  }

  private async ensureUserExists(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!user) {
      throw new NotFoundException("User profile not found");
    }
  }

  private async writeAudit(userId: string, action: string): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        userId,
        action,
        entityType: "User",
        entityId: userId,
      },
    });
  }
}
