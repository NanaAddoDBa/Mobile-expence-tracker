import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../prisma/prisma.service";
import { DataRetentionService } from "./data-retention.service";

describe("DataRetentionService", () => {
  it("removes expired authentication records and retention-expired audit logs", async () => {
    const operations = {
      session: { deleteMany: jest.fn().mockResolvedValue({ count: 2 }) },
      emailVerificationToken: {
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      passwordResetToken: {
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      auditLog: { deleteMany: jest.fn().mockResolvedValue({ count: 3 }) },
      $transaction: jest.fn((promises: Promise<unknown>[]) =>
        Promise.all(promises),
      ),
    };
    const config = {
      get: jest.fn(),
    } as unknown as ConfigService;
    const service = new DataRetentionService(
      operations as unknown as PrismaService,
      config,
    );

    await service.runRetentionCleanup();

    expect(operations.session.deleteMany).toHaveBeenCalledWith({
      where: {
        OR: [
          { expiresAt: { lt: expect.any(Date) } },
          { revokedAt: { lt: expect.any(Date) } },
        ],
      },
    });
    expect(operations.auditLog.deleteMany).toHaveBeenCalledWith({
      where: { createdAt: { lt: expect.any(Date) } },
    });
  });
});
