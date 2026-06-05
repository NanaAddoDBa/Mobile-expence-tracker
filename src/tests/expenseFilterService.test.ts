import { describe, expect, test } from "vitest";
import { Expense } from "../domain/expenses/expense.types";
import { expenseFilterService } from "../features/expenses/services/expenseFilterService";

const dummyExpenses: Expense[] = [
  {
    id: "1",
    merchant: "Zara Clo",
    description: "New suit shirts",
    amount: 120,
    date: "2026-06-01",
    category: "Shopping",
    accountSource: "acct-1",
    paymentMethod: "credit_card",
    isRecurring: false,
  },
  {
    id: "2",
    merchant: "Lidl supermarket",
    description: "organic eggs, milk",
    amount: 15.5,
    date: "2026-06-02",
    category: "Food & Grocery",
    accountSource: "acct-2",
    paymentMethod: "debit_card",
    isRecurring: true,
    recurringFrequency: "weekly",
  },
  {
    id: "3",
    merchant: "Train Pass",
    description: "Monthly commute",
    amount: 49,
    date: "2026-05-15",
    category: "Transport & Auto",
    accountSource: "acct-1",
    paymentMethod: "bank_transfer",
    isRecurring: true,
    recurringFrequency: "monthly",
  },
];

describe("expenseFilterService rules", () => {
  test("search matches merchant, description, notes, and category", () => {
    expect(expenseFilterService.filter(dummyExpenses, { query: "zara" })).toHaveLength(1);
    expect(expenseFilterService.filter(dummyExpenses, { query: "eggs" })).toHaveLength(1);
    expect(expenseFilterService.filter(dummyExpenses, { query: "transport" })[0].id).toBe("3");
  });

  test("category filter works", () => {
    const result = expenseFilterService.filter(dummyExpenses, { category: "Food & Grocery" });

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("2");
  });

  test("payment method filter works", () => {
    const result = expenseFilterService.filter(dummyExpenses, { paymentMethod: "bank_transfer" });

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("3");
  });

  test("source account filter works", () => {
    const result = expenseFilterService.filter(dummyExpenses, { accountSource: "acct-1" });

    expect(result.map((expense) => expense.id)).toEqual(["1", "3"]);
  });

  test("recurring filter works", () => {
    const recurring = expenseFilterService.filter(dummyExpenses, { recurrence: "Recurring" });
    const oneTime = expenseFilterService.filter(dummyExpenses, { recurrence: "Non-recurring" });

    expect(recurring.map((expense) => expense.id)).toEqual(["2", "3"]);
    expect(oneTime.map((expense) => expense.id)).toEqual(["1"]);
  });

  test("month filter works", () => {
    const result = expenseFilterService.filter(dummyExpenses, { month: "2026-06" });

    expect(result.map((expense) => expense.id)).toEqual(["1", "2"]);
  });

  test("sorts by amount descending", () => {
    const result = expenseFilterService.filter(dummyExpenses, { sortBy: "amount-desc" });

    expect(result.map((expense) => expense.amount)).toEqual([120, 49, 15.5]);
  });

  test("sorts by date ascending", () => {
    const result = expenseFilterService.filter(dummyExpenses, { sortBy: "date-asc" });

    expect(result.map((expense) => expense.id)).toEqual(["3", "1", "2"]);
  });
});
