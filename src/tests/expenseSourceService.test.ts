import { describe, expect, test } from "vitest";
import { Expense } from "../domain/expenses/expense.types";
import {
  getExpenseSourceSummary,
  normalizeExpenseSource,
} from "../features/expenses/services/expenseSourceService";

const baseExpense: Expense = {
  id: "expense-1",
  merchant: "Corner Shop",
  description: "Snacks",
  amount: 12,
  date: "2026-06-02",
  category: "Food & Grocery",
  accountSource: "wallet",
  paymentMethod: "digital_wallet",
  isRecurring: false,
};

describe("expenseSourceService", () => {
  test("marks expenses without source metadata as manual", () => {
    expect(normalizeExpenseSource(baseExpense)).toMatchObject({
      entrySource: "manual",
    });
    expect(getExpenseSourceSummary(baseExpense)).toEqual({
      entrySource: "manual",
      label: "Manual",
    });
  });

  test("maps receipt metadata to a receipt source summary", () => {
    const receiptExpense: Expense = {
      ...baseExpense,
      receiptId: "receipt-1",
    };

    expect(getExpenseSourceSummary(receiptExpense)).toEqual({
      entrySource: "receipt_scan",
      label: "Receipt",
    });
  });

  test("maps connected account metadata to an imported source summary", () => {
    const importedExpense: Expense = {
      ...baseExpense,
      externalTransactionId: "tx-1",
      sourceAccountId: "account-1",
    };

    expect(normalizeExpenseSource(importedExpense)).toMatchObject({
      entrySource: "connected_account",
      sourceAccountId: "account-1",
    });
    expect(getExpenseSourceSummary(importedExpense)).toEqual({
      entrySource: "connected_account",
      label: "Imported",
    });
  });
});
