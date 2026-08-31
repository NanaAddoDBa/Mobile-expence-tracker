import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../prisma/prisma.service";
import { hashPassword, verifyPassword } from "./auth.crypto";
import { DEFAULT_BCRYPT_ROUNDS } from "./constants";

export interface SessionResponse {
  id: string;
  userAgent: string | null;
  ipAddress: string | null;
  createdAt: string;
  expiresAt: string;
  current: boolean;
}

@Injectable()
export class AccountSecurityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async listSessions(
    userId: string,
    currentSessionId?: string,
  ): Promise<SessionResponse[]> {
    const sessions = await this.prisma.session.findMany({
      where: {
        userId,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        userAgent: true,
        ipAddress: true,
        createdAt: true,
        expiresAt: true,
      },
    });

    return sessions.map((session) => ({
      ...session,
      createdAt: session.createdAt.toISOString(),
      expiresAt: session.expiresAt.toISOString(),
      current: session.id === currentSessionId,
    }));
  }

  async revokeSession(
    userId: string,
    sessionId: string,
    currentSessionId?: string,
  ): Promise<void> {
    if (sessionId === currentSessionId) {
      throw new BadRequestException("Use sign out to end the current session");
    }

    const result = await this.prisma.session.updateMany({
      where: { id: sessionId, userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    if (result.count === 0) {
      throw new NotFoundException("Session not found");
    }

    await this.writeAudit(userId, "SESSION_REVOKED", sessionId);
  }

  async revokeAllSessions(userId: string): Promise<void> {
    await this.prisma.session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    await this.writeAudit(userId, "ALL_SESSIONS_REVOKED");
  }

  async changePassword(
    userId: string,
    currentSessionId: string | undefined,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    if (currentPassword === newPassword) {
      throw new BadRequestException(
        "The new password must differ from the current password",
      );
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    });

    if (!user) {
      throw new NotFoundException("User profile not found");
    }

    if (!user.passwordHash) {
      throw new BadRequestException(
        "Password sign-in is not enabled for this account",
      );
    }

    if (!(await verifyPassword(currentPassword, user.passwordHash))) {
      throw new UnauthorizedException("Current password is incorrect");
    }

    const passwordHash = await hashPassword(
      newPassword,
      this.getBcryptRounds(),
    );
    const now = new Date();
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { passwordHash },
      }),
      this.prisma.session.updateMany({
        where: {
          userId,
          revokedAt: null,
          ...(currentSessionId ? { id: { not: currentSessionId } } : {}),
        },
        data: { revokedAt: now },
      }),
      this.prisma.auditLog.create({
        data: {
          userId,
          action: "PASSWORD_CHANGED",
          entityType: "User",
          entityId: userId,
        },
      }),
    ]);
  }

  private getBcryptRounds(): number {
    const configured = Number(this.config.get<string>("BCRYPT_ROUNDS"));
    return Number.isInteger(configured) && configured >= 1 && configured <= 15
      ? configured
      : DEFAULT_BCRYPT_ROUNDS;
  }

  private async writeAudit(
    userId: string,
    action: string,
    entityId = userId,
  ): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        userId,
        action,
        entityType: "Session",
        entityId,
      },
    });
  }
}
