import { Expense } from "../../domain/expenses/expense.types";

export function buildExpense(overrides: Partial<Expense> = {}): Expense {
  return {
    id: "expense-1",
    merchant: "Aldi",
    description: "Groceries",
    amount: 42.5,
    date: "2026-06-02",
    category: "Food & Grocery",
    accountSource: "wallet",
    paymentMethod: "debit_card",
    isRecurring: false,
    entrySource: "manual",
    ...overrides,
  };
}

export function buildExpensePayload(overrides: Partial<Omit<Expense, "id">> = {}): Omit<Expense, "id"> {
  return {
    merchant: "Aldi",
    description: "Groceries",
    amount: 42.5,
    date: "2026-06-02",
    category: "Food & Grocery",
    accountSource: "wallet",
    paymentMethod: "debit_card",
    isRecurring: false,
    entrySource: "manual",
    ...overrides,
  };
}
