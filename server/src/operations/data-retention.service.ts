import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Cron } from "@nestjs/schedule";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class DataRetentionService {
  private readonly logger = new Logger(DataRetentionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  @Cron("0 30 2 * * *")
  async runRetentionCleanup(): Promise<void> {
    const now = new Date();
    const tokenCutoff = subtractDays(
      now,
      this.getDays("AUTH_TOKEN_RETENTION_DAYS", 7),
    );
    const sessionCutoff = subtractDays(
      now,
      this.getDays("SESSION_RETENTION_DAYS", 30),
    );
    const auditCutoff = subtractDays(
      now,
      this.getDays("AUDIT_LOG_RETENTION_DAYS", 365),
    );

    const [sessions, verificationTokens, resetTokens, auditLogs] =
      await this.prisma.$transaction([
        this.prisma.session.deleteMany({
          where: {
            OR: [
              { expiresAt: { lt: sessionCutoff } },
              { revokedAt: { lt: sessionCutoff } },
            ],
          },
        }),
        this.prisma.emailVerificationToken.deleteMany({
          where: {
            OR: [
              { expiresAt: { lt: now } },
              { usedAt: { not: null }, createdAt: { lt: tokenCutoff } },
            ],
          },
        }),
        this.prisma.passwordResetToken.deleteMany({
          where: {
            OR: [
              { expiresAt: { lt: now } },
              { usedAt: { not: null }, createdAt: { lt: tokenCutoff } },
            ],
          },
        }),
        this.prisma.auditLog.deleteMany({
          where: { createdAt: { lt: auditCutoff } },
        }),
      ]);

    this.logger.log(
      JSON.stringify({
        event: "data_retention_cleanup",
        deleted: {
          sessions: sessions.count,
          emailVerificationTokens: verificationTokens.count,
          passwordResetTokens: resetTokens.count,
          auditLogs: auditLogs.count,
        },
      }),
    );
  }

  private getDays(key: string, fallback: number): number {
    const value = Number(this.config.get<string>(key));
    return Number.isInteger(value) && value >= 1 && value <= 3_650
      ? value
      : fallback;
  }
}

function subtractDays(value: Date, days: number): Date {
  return new Date(value.getTime() - days * 24 * 60 * 60_000);
}
