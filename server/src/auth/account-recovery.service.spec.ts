import { BadRequestException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { UserStatus } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { AccountRecoveryService } from "./account-recovery.service";
import { hashAccountToken, verifyPassword } from "./auth.crypto";
import { EmailService } from "./email.service";

interface PrismaMock {
  emailVerificationToken: {
    findUnique: jest.Mock;
    updateMany: jest.Mock;
    deleteMany: jest.Mock;
    create: jest.Mock;
  };
  passwordResetToken: {
    findUnique: jest.Mock;
    updateMany: jest.Mock;
    deleteMany: jest.Mock;
    create: jest.Mock;
  };
  user: {
    findUnique: jest.Mock;
    update: jest.Mock;
  };
  session: { updateMany: jest.Mock };
  auditLog: { create: jest.Mock };
  $transaction: jest.Mock;
}

function createPrismaMock(): PrismaMock {
  const prisma: PrismaMock = {
    emailVerificationToken: {
      findUnique: jest.fn(),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
      create: jest.fn().mockResolvedValue({}),
    },
    passwordResetToken: {
      findUnique: jest.fn(),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
      create: jest.fn().mockResolvedValue({}),
    },
    user: {
      findUnique: jest.fn(),
      update: jest.fn().mockResolvedValue({}),
    },
    session: { updateMany: jest.fn().mockResolvedValue({ count: 2 }) },
    auditLog: { create: jest.fn().mockResolvedValue({}) },
    $transaction: jest.fn(),
  };

  prisma.$transaction.mockImplementation(
    async (input: unknown) =>
      typeof input === "function"
        ? (input as (transaction: PrismaMock) => Promise<unknown>)(prisma)
        : Promise.all(input as Promise<unknown>[]),
  );

  return prisma;
}

function createService(prisma: PrismaMock): AccountRecoveryService {
  const email = {
    sendEmailVerification: jest.fn().mockResolvedValue(true),
    sendPasswordReset: jest.fn().mockResolvedValue(true),
  } as unknown as EmailService;
  const config = {
    get: jest.fn((key: string) => (key === "BCRYPT_ROUNDS" ? "4" : undefined)),
  } as unknown as ConfigService;

  return new AccountRecoveryService(
    prisma as unknown as PrismaService,
    email,
    config,
  );
}

describe("AccountRecoveryService", () => {
  it("rejects an expired password reset token before changing data", async () => {
    const prisma = createPrismaMock();
    prisma.passwordResetToken.findUnique.mockResolvedValue({
      id: "reset-1",
      userId: "user-1",
      usedAt: null,
      expiresAt: new Date(Date.now() - 1_000),
    });
    const service = createService(prisma);

    await expect(
      service.confirmPasswordReset("expired-token", "new-password-123"),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it("atomically consumes a reset token and revokes every active session", async () => {
    const prisma = createPrismaMock();
    const token = "valid-password-reset-token";
    prisma.passwordResetToken.findUnique.mockResolvedValue({
      id: "reset-1",
      userId: "user-1",
      usedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
    });
    const service = createService(prisma);

    await service.confirmPasswordReset(token, "new-password-123");

    expect(prisma.passwordResetToken.findUnique).toHaveBeenCalledWith({
      where: { tokenHash: hashAccountToken(token) },
      select: { id: true, userId: true, usedAt: true, expiresAt: true },
    });
    expect(prisma.passwordResetToken.updateMany).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        where: expect.objectContaining({ id: "reset-1", usedAt: null }),
      }),
    );
    expect(prisma.session.updateMany).toHaveBeenCalledWith({
      where: { userId: "user-1", revokedAt: null },
      data: { revokedAt: expect.any(Date) },
    });

    const passwordHash = prisma.user.update.mock.calls[0][0].data.passwordHash;
    await expect(
      verifyPassword("new-password-123", passwordHash),
    ).resolves.toBe(true);
  });

  it("does not reveal whether a password account exists", async () => {
    const prisma = createPrismaMock();
    prisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      email: "user@example.com",
      passwordHash: null,
      status: UserStatus.ACTIVE,
    });
    const service = createService(prisma);

    await expect(
      service.requestPasswordReset("USER@example.com"),
    ).resolves.toBeUndefined();

    expect(prisma.passwordResetToken.create).not.toHaveBeenCalled();
  });
});
