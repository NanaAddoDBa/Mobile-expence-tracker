import {
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../prisma/prisma.service";
import { AccountSecurityService } from "./account-security.service";
import { hashPassword, verifyPassword } from "./auth.crypto";

interface PrismaMock {
  user: { findUnique: jest.Mock; update: jest.Mock };
  session: { findMany: jest.Mock; updateMany: jest.Mock };
  auditLog: { create: jest.Mock };
  $transaction: jest.Mock;
}

function createPrismaMock(): PrismaMock {
  const prisma: PrismaMock = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn().mockResolvedValue({}),
    },
    session: {
      findMany: jest.fn().mockResolvedValue([]),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
    auditLog: { create: jest.fn().mockResolvedValue({}) },
    $transaction: jest.fn(),
  };
  prisma.$transaction.mockImplementation((operations: Promise<unknown>[]) =>
    Promise.all(operations),
  );
  return prisma;
}

function createService(prisma: PrismaMock): AccountSecurityService {
  const config = {
    get: jest.fn((key: string) => (key === "BCRYPT_ROUNDS" ? "4" : undefined)),
  } as unknown as ConfigService;
  return new AccountSecurityService(
    prisma as unknown as PrismaService,
    config,
  );
}

describe("AccountSecurityService", () => {
  it("requires the normal sign-out flow for the current session", async () => {
    const prisma = createPrismaMock();
    const service = createService(prisma);

    await expect(
      service.revokeSession("user-1", "session-1", "session-1"),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.session.updateMany).not.toHaveBeenCalled();
  });

  it("cannot revoke a session that is not owned by the user", async () => {
    const prisma = createPrismaMock();
    prisma.session.updateMany.mockResolvedValue({ count: 0 });
    const service = createService(prisma);

    await expect(
      service.revokeSession("user-1", "someone-elses-session", "session-1"),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.session.updateMany).toHaveBeenCalledWith({
      where: {
        id: "someone-elses-session",
        userId: "user-1",
        revokedAt: null,
      },
      data: { revokedAt: expect.any(Date) },
    });
  });

  it("changes the password and keeps only the current session active", async () => {
    const prisma = createPrismaMock();
    prisma.user.findUnique.mockResolvedValue({
      passwordHash: await hashPassword("current-password", 4),
    });
    const service = createService(prisma);

    await service.changePassword(
      "user-1",
      "session-current",
      "current-password",
      "new-password-123",
    );

    expect(prisma.session.updateMany).toHaveBeenCalledWith({
      where: {
        userId: "user-1",
        revokedAt: null,
        id: { not: "session-current" },
      },
      data: { revokedAt: expect.any(Date) },
    });
    const passwordHash = prisma.user.update.mock.calls[0][0].data.passwordHash;
    await expect(
      verifyPassword("new-password-123", passwordHash),
    ).resolves.toBe(true);
  });
});
