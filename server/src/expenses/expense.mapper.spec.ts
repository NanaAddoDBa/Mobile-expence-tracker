import {
  CurrencyCode,
  EntrySource,
  Expense,
  ExpenseCategory,
  PaymentMethod,
  RecurringFrequency,
} from "@prisma/client";
import {
  CurrencyCode as ApiCurrencyCode,
  ExpenseCategory as ApiExpenseCategory,
  PaymentMethod as ApiPaymentMethod,
  RecurringFrequency as ApiRecurringFrequency,
} from "../common/validation/enums.dto";
import {
  toExpenseCreateInput,
  toExpenseResponse,
  toExpenseUpdateInput,
} from "./expense.mapper";

describe("expense mapper", () => {
  const storedExpense: Expense = {
    id: "expense-1",
    userId: "user-1",
    merchant: "Corner Market",
    description: "Groceries",
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
    isRecurring: true,
    recurringFrequency: RecurringFrequency.WEEKLY,
    recurringTemplateId: null,
    createdAt: new Date("2026-06-02T10:00:00.000Z"),
    updatedAt: new Date("2026-06-02T10:00:00.000Z"),
  };

  it("maps stored Prisma values to API values", () => {
    expect(toExpenseResponse(storedExpense)).toMatchObject({
      id: "expense-1",
      amountMinor: 2475,
      date: "2026-06-02",
      category: "groceries",
      paymentMethod: "debit_card",
      entrySource: "manual",
      isRecurring: true,
      recurringFrequency: "weekly",
    });
  });

  it("maps create input to user-owned Prisma data", () => {
    expect(
      toExpenseCreateInput("user-1", {
        merchant: " Corner Market ",
        description: " Groceries ",
        amountMinor: 2475,
        currency: ApiCurrencyCode.EUR,
        date: "2026-06-02",
        category: ApiExpenseCategory.GROCERIES,
        paymentMethod: ApiPaymentMethod.DEBIT_CARD,
        isRecurring: true,
        recurringFrequency: ApiRecurringFrequency.WEEKLY,
      }),
    ).toMatchObject({
      userId: "user-1",
      merchant: "Corner Market",
      description: "Groceries",
      amountMinor: 2475,
      category: ExpenseCategory.GROCERIES,
      paymentMethod: PaymentMethod.DEBIT_CARD,
      recurringFrequency: RecurringFrequency.WEEKLY,
    });
  });

  it("clears recurring frequency when recurrence is disabled", () => {
    expect(
      toExpenseUpdateInput({
        isRecurring: false,
      }),
    ).toEqual({
      isRecurring: false,
      recurringFrequency: null,
    });
  });
});
