import { ConflictException, NotFoundException } from "@nestjs/common";
import {
  Budget,
  CurrencyCode,
  ExpenseCategory,
} from "@prisma/client";
import {
  CurrencyCode as ApiCurrencyCode,
  ExpenseCategory as ApiExpenseCategory,
} from "../common/validation/enums.dto";
import { PrismaService } from "../prisma/prisma.service";
import { BudgetsService } from "./budgets.service";

describe("BudgetsService", () => {
  const budget: Budget = {
    id: "budget-1",
    userId: "user-1",
    category: ExpenseCategory.GROCERIES,
    limitAmountMinor: 35000,
    currency: CurrencyCode.EUR,
    monthKey: "2026-08",
    createdAt: new Date("2026-08-01T10:00:00.000Z"),
    updatedAt: new Date("2026-08-01T10:00:00.000Z"),
  };

  function createService(overrides = {}) {
    const prisma = {
      budget: {
        findMany: jest.fn().mockResolvedValue([budget]),
        create: jest.fn().mockResolvedValue(budget),
        findFirst: jest.fn().mockResolvedValue(null),
        update: jest.fn().mockResolvedValue({
          ...budget,
          limitAmountMinor: 45000,
        }),
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
        ...overrides,
      },
    } as unknown as PrismaService;

    return {
      prisma,
      service: new BudgetsService(prisma),
    };
  }

  it("lists only budgets for the authenticated user", async () => {
    const { prisma, service } = createService();

    await expect(
      service.list("user-1", { monthKey: "2026-08" }),
    ).resolves.toEqual([expect.objectContaining({ id: "budget-1" })]);
    expect(prisma.budget.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: "user-1", monthKey: "2026-08" },
      }),
    );
  });

  it("creates a budget with the authenticated user id", async () => {
    const { prisma, service } = createService();

    await service.create("user-1", {
      category: ApiExpenseCategory.GROCERIES,
      limitAmountMinor: 35000,
      currency: ApiCurrencyCode.EUR,
      monthKey: "2026-08",
    });

    expect(prisma.budget.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: "user-1",
        category: ExpenseCategory.GROCERIES,
        monthKey: "2026-08",
      }),
    });
  });

  it("rejects duplicate budgets for the same category and month", async () => {
    const { service } = createService({
      findFirst: jest.fn().mockResolvedValue({ id: "budget-1" }),
    });

    await expect(
      service.create("user-1", {
        category: ApiExpenseCategory.GROCERIES,
        limitAmountMinor: 35000,
        currency: ApiCurrencyCode.EUR,
        monthKey: "2026-08",
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it("throws not found instead of updating another user's budget", async () => {
    const { service } = createService({
      findFirst: jest.fn().mockResolvedValue(null),
    });

    await expect(
      service.update("user-2", "budget-1", { limitAmountMinor: 1 }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it("throws not found when delete affects no owned budget", async () => {
    const { service } = createService({
      deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
    });

    await expect(service.delete("user-2", "budget-1")).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
