import { BadRequestException, NotFoundException } from "@nestjs/common";
import {
  CurrencyCode,
  Goal,
  GoalStatus,
} from "@prisma/client";
import {
  CurrencyCode as ApiCurrencyCode,
} from "../common/validation/enums.dto";
import { PrismaService } from "../prisma/prisma.service";
import { GoalsService } from "./goals.service";

describe("GoalsService", () => {
  const goal: Goal = {
    id: "goal-1",
    userId: "user-1",
    name: "Emergency fund",
    targetAmountMinor: 300000,
    currentAmountMinor: 50000,
    currency: CurrencyCode.EUR,
    targetDate: new Date("2026-12-31T00:00:00.000Z"),
    status: GoalStatus.ACTIVE,
    createdAt: new Date("2026-08-01T10:00:00.000Z"),
    updatedAt: new Date("2026-08-01T10:00:00.000Z"),
  };

  function createService(overrides = {}) {
    const prisma = {
      goal: {
        findMany: jest.fn().mockResolvedValue([goal]),
        create: jest.fn().mockResolvedValue(goal),
        findFirst: jest.fn().mockResolvedValue(goal),
        update: jest.fn().mockResolvedValue({
          ...goal,
          currentAmountMinor: 75000,
        }),
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
        ...overrides,
      },
    } as unknown as PrismaService;

    return {
      prisma,
      service: new GoalsService(prisma),
    };
  }

  it("lists only goals for the authenticated user", async () => {
    const { prisma, service } = createService();

    await expect(service.list("user-1")).resolves.toEqual([
      expect.objectContaining({ id: "goal-1" }),
    ]);
    expect(prisma.goal.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: "user-1" },
      }),
    );
  });

  it("creates a goal with the authenticated user id", async () => {
    const { prisma, service } = createService();

    await service.create("user-1", {
      name: "Emergency fund",
      targetAmountMinor: 300000,
      currentAmountMinor: 50000,
      currency: ApiCurrencyCode.EUR,
      targetDate: "2026-12-31",
    });

    expect(prisma.goal.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: "user-1",
        name: "Emergency fund",
      }),
    });
  });

  it("rejects progress above the target amount", async () => {
    const { service } = createService();

    await expect(
      service.create("user-1", {
        name: "Emergency fund",
        targetAmountMinor: 300000,
        currentAmountMinor: 300001,
        currency: ApiCurrencyCode.EUR,
        targetDate: "2026-12-31",
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("throws not found instead of updating another user's goal", async () => {
    const { service } = createService({
      findFirst: jest.fn().mockResolvedValue(null),
    });

    await expect(
      service.update("user-2", "goal-1", { currentAmountMinor: 1 }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it("throws not found when delete affects no owned goal", async () => {
    const { service } = createService({
      deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
    });

    await expect(service.delete("user-2", "goal-1")).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
