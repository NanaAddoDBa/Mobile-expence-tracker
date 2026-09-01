import { BadRequestException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { ProfileService } from "./profile.service";
import { ConnectedAccountsService } from "../connected-accounts/connected-accounts.service";

interface PrismaMock {
  user: {
    findUnique: jest.Mock;
    delete: jest.Mock;
  };
  auditLog: { create: jest.Mock };
  $transaction: jest.Mock;
}

function createPrismaMock(): PrismaMock {
  const prisma: PrismaMock = {
    user: {
      findUnique: jest.fn(),
      delete: jest.fn().mockResolvedValue({}),
    },
    auditLog: { create: jest.fn().mockResolvedValue({}) },
    $transaction: jest.fn(),
  };
  prisma.$transaction.mockImplementation(
    async (callback: (transaction: PrismaMock) => Promise<unknown>) =>
      callback(prisma),
  );
  return prisma;
}

describe("ProfileService", () => {
  const createService = (prisma: PrismaMock) =>
    new ProfileService(
      prisma as unknown as PrismaService,
      {
        revokeAllForUser: jest.fn().mockResolvedValue(undefined),
      } as unknown as ConnectedAccountsService,
    );

  it("exports owned data without password or session token hashes", async () => {
    const prisma = createPrismaMock();
    prisma.user.findUnique.mockResolvedValue({ id: "user-1" });
    const service = createService(prisma);

    await service.exportData("user-1");

    const select = prisma.user.findUnique.mock.calls[0][0].select;
    expect(select.passwordHash).toBeUndefined();
    expect(select.sessions.select.tokenHash).toBeUndefined();
    expect(select.expenses).toBe(true);
    expect(select.incomes).toBe(true);
    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: "user-1",
        action: "ACCOUNT_DATA_EXPORTED",
      }),
    });
  });

  it("rejects an invalid deletion confirmation", async () => {
    const prisma = createPrismaMock();
    const service = createService(prisma);

    await expect(
      service.deleteAccount("user-1", { confirmation: "WRONG" } as never),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("deletes only the authenticated user's account", async () => {
    const prisma = createPrismaMock();
    prisma.user.findUnique.mockResolvedValue({ id: "user-1" });
    const service = createService(prisma);

    await service.deleteAccount("user-1", { confirmation: "DELETE" });

    expect(prisma.user.delete).toHaveBeenCalledWith({
      where: { id: "user-1" },
    });
  });

  it("returns not found instead of reporting a missing account as deleted", async () => {
    const prisma = createPrismaMock();
    prisma.user.findUnique.mockResolvedValue(null);
    const service = createService(prisma);

    await expect(
      service.deleteAccount("missing-user", { confirmation: "DELETE" }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
