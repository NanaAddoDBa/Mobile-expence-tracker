import { NotFoundException } from "@nestjs/common";
import {
  CurrencyCode,
  EntrySource,
  Income,
  IncomeCategory,
  PaymentMethod,
} from "@prisma/client";
import {
  CurrencyCode as ApiCurrencyCode,
  IncomeCategory as ApiIncomeCategory,
  PaymentMethod as ApiPaymentMethod,
} from "../common/validation/enums.dto";
import { PrismaService } from "../prisma/prisma.service";
import { IncomesService } from "./incomes.service";

describe("IncomesService", () => {
  const income: Income = {
    id: "income-1",
    userId: "user-1",
    source: "Example Employer",
    description: "Monthly salary",
    amountMinor: 250000,
    currency: CurrencyCode.EUR,
    date: new Date("2026-08-01T00:00:00.000Z"),
    category: IncomeCategory.SALARY,
    paymentMethod: PaymentMethod.BANK_TRANSFER,
    entrySource: EntrySource.MANUAL,
    notes: null,
    sourceAccountId: null,
    importBatchId: null,
    externalTransactionId: null,
    isRecurring: true,
    recurringFrequency: null,
    recurringTemplateId: null,
    createdAt: new Date("2026-08-01T10:00:00.000Z"),
    updatedAt: new Date("2026-08-01T10:00:00.000Z"),
  };

  function createService(overrides = {}) {
    const prisma = {
      income: {
        findMany: jest.fn().mockResolvedValue([income]),
        count: jest.fn().mockResolvedValue(1),
        create: jest.fn().mockResolvedValue(income),
        findFirst: jest.fn().mockResolvedValue(income),
        update: jest.fn().mockResolvedValue(income),
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
        ...overrides,
      },
    } as unknown as PrismaService;

    return { prisma, service: new IncomesService(prisma) };
  }

  it("lists only income belonging to the authenticated user", async () => {
    const { prisma, service } = createService();

    await service.list("user-1", { page: 1, pageSize: 20 });

    expect(prisma.income.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: "user-1", currency: CurrencyCode.EUR },
      }),
    );
  });

  it("creates income with the authenticated user id", async () => {
    const { prisma, service } = createService();

    await service.create("user-1", {
      source: "Example Employer",
      amountMinor: 250000,
      currency: ApiCurrencyCode.EUR,
      date: "2026-08-01",
      category: ApiIncomeCategory.SALARY,
      paymentMethod: ApiPaymentMethod.BANK_TRANSFER,
    });

    expect(prisma.income.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ userId: "user-1" }),
    });
  });

  it("does not update another user's income", async () => {
    const { service } = createService({
      findFirst: jest.fn().mockResolvedValue(null),
    });

    await expect(
      service.update("user-2", "income-1", { amountMinor: 1 }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it("does not delete another user's income", async () => {
    const { service } = createService({
      deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
    });

    await expect(service.delete("user-2", "income-1")).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
