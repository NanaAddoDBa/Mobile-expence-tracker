import { describe, expect, test } from "vitest";
import { ConnectedAccount } from "../domain/accounts/account.types";
import { Budget } from "../domain/budgets/budget.types";
import { Expense } from "../domain/expenses/expense.types";
import { Goal } from "../domain/goals/goal.types";
import { createAccountRepository } from "../services/repositories/accountRepository.mock";
import { createBudgetRepository } from "../services/repositories/budgetRepository.mock";
import { createExpenseRepository } from "../services/repositories/expenseRepository.mock";
import { createGoalRepository } from "../services/repositories/goalRepository.mock";
import { createMemoryStorageAdapter } from "../services/storage/memoryStorageAdapter";

const expense: Expense = {
  id: "expense-1",
  merchant: "Aldi",
  description: "Groceries",
  amount: 42.5,
  date: "2026-06-02",
  category: "Food & Grocery",
  accountSource: "wallet",
  paymentMethod: "digital_wallet",
  isRecurring: false,
};

const budget: Budget = {
  id: "budget-1",
  category: "Food & Grocery",
  limitAmount: 400,
};

const goal: Goal = {
  id: "goal-1",
  name: "Emergency fund",
  targetAmount: 3000,
  currentAmount: 500,
  targetDate: "2026-12-31",
};

const account: ConnectedAccount = {
  id: "account-1",
  name: "Everyday Checking",
  institutionName: "Mock Bank",
  type: "checking",
  balance: 1200,
  currency: "EUR",
  isConnected: true,
  status: "connected",
};

describe("storage adapters and mock repositories", () => {
  test("memory storage adapter stores and removes values", () => {
    const storage = createMemoryStorageAdapter();

    storage.setItem("key", "value");
    expect(storage.getItem("key")).toBe("value");

    storage.removeItem("key");
    expect(storage.getItem("key")).toBeNull();
  });

  test("product data repositories start empty when no local data exists", () => {
    expect(createExpenseRepository(createMemoryStorageAdapter()).getAll()).toEqual([]);
    expect(createBudgetRepository(createMemoryStorageAdapter()).getAll()).toEqual([]);
    expect(createGoalRepository(createMemoryStorageAdapter()).getAll()).toEqual([]);
    expect(createAccountRepository(createMemoryStorageAdapter()).getAll()).toEqual([]);
  });

  test("expense repository persists through an injected storage adapter", () => {
    const repository = createExpenseRepository(createMemoryStorageAdapter());

    repository.saveAll([expense]);

    expect(repository.getAll()).toEqual([{ ...expense, entrySource: "manual" }]);
  });

  test("budget and goal repositories persist through injected storage adapters", () => {
    const budgetRepository = createBudgetRepository(createMemoryStorageAdapter());
    const goalRepository = createGoalRepository(createMemoryStorageAdapter());

    budgetRepository.saveAll([budget]);
    goalRepository.saveAll([goal]);

    expect(budgetRepository.getAll()).toEqual([budget]);
    expect(goalRepository.getAll()).toEqual([goal]);
  });

  test("account repository persists connected accounts through injected storage", () => {
    const repository = createAccountRepository(createMemoryStorageAdapter());

    repository.saveAll([account]);

    expect(repository.getAll()).toEqual([account]);
  });
});
