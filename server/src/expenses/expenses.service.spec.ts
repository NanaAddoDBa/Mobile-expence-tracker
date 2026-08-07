import { NotFoundException } from "@nestjs/common";
import {
  CurrencyCode,
  EntrySource,
  Expense,
  ExpenseCategory,
  PaymentMethod,
} from "@prisma/client";
import {
  CurrencyCode as ApiCurrencyCode,
  ExpenseCategory as ApiExpenseCategory,
  PaymentMethod as ApiPaymentMethod,
} from "../common/validation/enums.dto";
import { PrismaService } from "../prisma/prisma.service";
import { ExpensesService } from "./expenses.service";

describe("ExpensesService", () => {
  const expense: Expense = {
    id: "expense-1",
    userId: "user-1",
    merchant: "Corner Market",
    description: null,
    amountMinor: 2475,
    currency: CurrencyCode.EUR,
    date: new Date("2026-06-02T00:00:00.000Z"),
    category: ExpenseCategory.GROCERIES,
    paymentMethod: PaymentMethod.DEBIT_CARD,
    entrySource: EntrySource.MANUAL,
    notes: null,
    receiptId: null,
    sourceAccountId: null,
    importBatchId: null,
    externalTransactionId: null,
    isRecurring: false,
    recurringFrequency: null,
    recurringTemplateId: null,
    createdAt: new Date("2026-06-02T10:00:00.000Z"),
    updatedAt: new Date("2026-06-02T10:00:00.000Z"),
  };

  function createService(overrides = {}) {
    const prisma = {
      expense: {
        findMany: jest.fn().mockResolvedValue([expense]),
        count: jest.fn().mockResolvedValue(1),
        create: jest.fn().mockResolvedValue(expense),
        findFirst: jest.fn().mockResolvedValue(expense),
        update: jest.fn().mockResolvedValue({
          ...expense,
          merchant: "Updated Market",
        }),
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
        ...overrides,
      },
    } as unknown as PrismaService;

    return {
      prisma,
      service: new ExpensesService(prisma),
    };
  }

  it("lists only expenses for the authenticated user", async () => {
    const { prisma, service } = createService();

    await expect(
      service.list("user-1", { page: 1, pageSize: 20 }),
    ).resolves.toMatchObject({
      expenses: [expect.objectContaining({ id: "expense-1" })],
      pagination: {
        page: 1,
        pageSize: 20,
        total: 1,
        totalPages: 1,
      },
    });
    expect(prisma.expense.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: "user-1" },
      }),
    );
  });

  it("creates an expense with the authenticated user id", async () => {
    const { prisma, service } = createService();

    await service.create("user-1", {
      merchant: "Corner Market",
      amountMinor: 2475,
      currency: ApiCurrencyCode.EUR,
      date: "2026-06-02",
      category: ApiExpenseCategory.GROCERIES,
      paymentMethod: ApiPaymentMethod.DEBIT_CARD,
    });

    expect(prisma.expense.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ userId: "user-1" }),
    });
  });

  it("throws not found instead of updating another user's expense", async () => {
    const { service } = createService({
      findFirst: jest.fn().mockResolvedValue(null),
    });

    await expect(
      service.update("user-2", "expense-1", { merchant: "Nope" }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it("throws not found when delete affects no owned expense", async () => {
    const { service } = createService({
      deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
    });

    await expect(service.delete("user-2", "expense-1")).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
