import { describe, expect, test } from "vitest";
import { Expense } from "../domain/expenses/expense.types";
import { expenseSummaryService } from "../features/expenses/services/expenseSummaryService";

const expenses: Expense[] = [
  {
    id: "expense-1",
    merchant: "Aldi",
    description: "Groceries",
    amount: 24.5,
    date: "2026-06-02",
    category: "Food & Grocery",
    accountSource: "acct-1",
    paymentMethod: "debit_card",
    isRecurring: false,
  },
  {
    id: "expense-2",
    merchant: "Train Pass",
    description: "Commute",
    amount: 49,
    date: "2026-06-03",
    category: "Transport & Auto",
    accountSource: "acct-1",
    paymentMethod: "debit_card",
    isRecurring: true,
    recurringFrequency: "monthly",
  },
  {
    id: "expense-3",
    merchant: "Cafe",
    description: "Coffee",
    amount: 4.5,
    date: "2026-05-30",
    category: "Dining & Cafe",
    accountSource: "acct-2",
    paymentMethod: "digital_wallet",
    isRecurring: false,
  },
];

describe("expenseSummaryService", () => {
  test("calculates total spent", () => {
    expect(expenseSummaryService.calculateTotalSpent(expenses)).toBe(78);
  });

  test("calculates total spent in a month", () => {
    expect(expenseSummaryService.calculateTotalSpentInMonth(expenses, "2026-06")).toBe(73.5);
  });

  test("calculates category totals in a month", () => {
    expect(expenseSummaryService.calculateCategoryTotalsInMonth(expenses, "2026-06")).toEqual({
      "Food & Grocery": 24.5,
      "Transport & Auto": 49,
    });
  });
});
