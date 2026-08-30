import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from "@nestjs/common";
import {
  Budget,
  BudgetPeriod,
  CurrencyCode,
  ExpenseCategory,
} from "@prisma/client";
import {
  BudgetPeriod as ApiBudgetPeriod,
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
    period: BudgetPeriod.MONTHLY,
    periodKey: "2026-08",
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
      service.list("user-1", {
        period: ApiBudgetPeriod.MONTHLY,
        periodKey: "2026-08",
      }),
    ).resolves.toEqual([expect.objectContaining({ id: "budget-1" })]);
    expect(prisma.budget.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId: "user-1",
          period: BudgetPeriod.MONTHLY,
          periodKey: "2026-08",
        },
      }),
    );
  });

  it("creates a budget with the authenticated user id", async () => {
    const { prisma, service } = createService();

    await service.create("user-1", {
      category: ApiExpenseCategory.GROCERIES,
      limitAmountMinor: 35000,
      currency: ApiCurrencyCode.EUR,
      period: ApiBudgetPeriod.MONTHLY,
      periodKey: "2026-08",
    });

    expect(prisma.budget.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: "user-1",
        category: ExpenseCategory.GROCERIES,
        period: BudgetPeriod.MONTHLY,
        periodKey: "2026-08",
      }),
    });
  });

  it("rejects duplicate budgets for the same category and period", async () => {
    const { service } = createService({
      findFirst: jest.fn().mockResolvedValue({ id: "budget-1" }),
    });

    await expect(
      service.create("user-1", {
        category: ApiExpenseCategory.GROCERIES,
        limitAmountMinor: 35000,
        currency: ApiCurrencyCode.EUR,
        period: ApiBudgetPeriod.MONTHLY,
        periodKey: "2026-08",
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it("rejects a period key that does not match the budget period", async () => {
    const { service } = createService();

    await expect(
      service.create("user-1", {
        category: ApiExpenseCategory.GROCERIES,
        limitAmountMinor: 35000,
        currency: ApiCurrencyCode.EUR,
        period: ApiBudgetPeriod.DAILY,
        periodKey: "2026-08",
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("rejects an ISO week that does not exist in its week year", async () => {
    const { service } = createService();

    await expect(
      service.create("user-1", {
        category: ApiExpenseCategory.GROCERIES,
        limitAmountMinor: 10000,
        currency: ApiCurrencyCode.EUR,
        period: ApiBudgetPeriod.WEEKLY,
        periodKey: "2025-W53",
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
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
