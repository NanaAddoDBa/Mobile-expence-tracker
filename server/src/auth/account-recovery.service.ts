import { BadRequestException, Injectable } from "@nestjs/common";
import { UserStatus } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import {
  generateAccountToken,
  hashAccountToken,
  hashPassword,
} from "./auth.crypto";
import {
  DEFAULT_BCRYPT_ROUNDS,
  EMAIL_VERIFICATION_TTL_HOURS,
  PASSWORD_RESET_TTL_MINUTES,
} from "./constants";
import { EmailService } from "./email.service";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class AccountRecoveryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
    private readonly config: ConfigService,
  ) {}

  async requestEmailVerification(userId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        emailVerifiedAt: true,
        status: true,
      },
    });

    if (!user || user.status === UserStatus.DISABLED || user.emailVerifiedAt) {
      return false;
    }

    const token = generateAccountToken();
    await this.prisma.$transaction([
      this.prisma.emailVerificationToken.deleteMany({ where: { userId } }),
      this.prisma.emailVerificationToken.create({
        data: {
          userId,
          tokenHash: hashAccountToken(token),
          expiresAt: addHours(new Date(), EMAIL_VERIFICATION_TTL_HOURS),
        },
      }),
      this.prisma.auditLog.create({
        data: {
          userId,
          action: "EMAIL_VERIFICATION_REQUESTED",
          entityType: "User",
          entityId: userId,
        },
      }),
    ]);

    return this.email.sendEmailVerification(user.email, token);
  }

  async confirmEmailVerification(token: string): Promise<void> {
    const tokenHash = hashAccountToken(token);
    const storedToken = await this.prisma.emailVerificationToken.findUnique({
      where: { tokenHash },
      select: { id: true, userId: true, usedAt: true, expiresAt: true },
    });

    if (
      !storedToken ||
      storedToken.usedAt ||
      storedToken.expiresAt.getTime() <= Date.now()
    ) {
      throw new BadRequestException("Verification link is invalid or expired");
    }

    const now = new Date();
    await this.prisma.$transaction(async (transaction) => {
      const claimed = await transaction.emailVerificationToken.updateMany({
        where: {
          id: storedToken.id,
          usedAt: null,
          expiresAt: { gt: now },
        },
        data: { usedAt: now },
      });

      if (claimed.count !== 1) {
        throw new BadRequestException("Verification link is invalid or expired");
      }

      await transaction.user.update({
        where: { id: storedToken.userId },
        data: { emailVerifiedAt: now },
      });
      await transaction.emailVerificationToken.updateMany({
        where: { userId: storedToken.userId, usedAt: null },
        data: { usedAt: now },
      });
      await transaction.auditLog.create({
        data: {
          userId: storedToken.userId,
          action: "EMAIL_VERIFIED",
          entityType: "User",
          entityId: storedToken.userId,
        },
      });
    });
  }

  async requestPasswordReset(email: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        status: true,
      },
    });

    if (!user?.passwordHash || user.status === UserStatus.DISABLED) {
      return;
    }

    const token = generateAccountToken();
    await this.prisma.$transaction([
      this.prisma.passwordResetToken.deleteMany({
        where: { userId: user.id },
      }),
      this.prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash: hashAccountToken(token),
          expiresAt: addMinutes(new Date(), PASSWORD_RESET_TTL_MINUTES),
        },
      }),
      this.prisma.auditLog.create({
        data: {
          userId: user.id,
          action: "PASSWORD_RESET_REQUESTED",
          entityType: "User",
          entityId: user.id,
        },
      }),
    ]);

    await this.email.sendPasswordReset(user.email, token);
  }

  async confirmPasswordReset(token: string, newPassword: string): Promise<void> {
    const tokenHash = hashAccountToken(token);
    const storedToken = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      select: { id: true, userId: true, usedAt: true, expiresAt: true },
    });

    if (
      !storedToken ||
      storedToken.usedAt ||
      storedToken.expiresAt.getTime() <= Date.now()
    ) {
      throw new BadRequestException("Password reset link is invalid or expired");
    }

    const passwordHash = await hashPassword(
      newPassword,
      this.getBcryptRounds(),
    );
    const now = new Date();

    await this.prisma.$transaction(async (transaction) => {
      const claimed = await transaction.passwordResetToken.updateMany({
        where: {
          id: storedToken.id,
          usedAt: null,
          expiresAt: { gt: now },
        },
        data: { usedAt: now },
      });

      if (claimed.count !== 1) {
        throw new BadRequestException("Password reset link is invalid or expired");
      }

      await transaction.user.update({
        where: { id: storedToken.userId },
        data: { passwordHash },
      });
      await transaction.session.updateMany({
        where: { userId: storedToken.userId, revokedAt: null },
        data: { revokedAt: now },
      });
      await transaction.passwordResetToken.updateMany({
        where: { userId: storedToken.userId, usedAt: null },
        data: { usedAt: now },
      });
      await transaction.auditLog.create({
        data: {
          userId: storedToken.userId,
          action: "PASSWORD_RESET_COMPLETED",
          entityType: "User",
          entityId: storedToken.userId,
        },
      });
    });
  }

  private getBcryptRounds(): number {
    const configured = Number(this.config.get<string>("BCRYPT_ROUNDS"));
    return Number.isInteger(configured) && configured >= 1 && configured <= 15
      ? configured
      : DEFAULT_BCRYPT_ROUNDS;
  }
}

function addHours(value: Date, hours: number): Date {
  return new Date(value.getTime() + hours * 60 * 60 * 1000);
}

function addMinutes(value: Date, minutes: number): Date {
  return new Date(value.getTime() + minutes * 60 * 1000);
}
