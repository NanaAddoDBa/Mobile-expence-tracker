/** @vitest-environment jsdom */

import { beforeEach, describe, expect, test } from "vitest";
import { ConnectedAccount } from "../../domain/accounts/account.types";
import { Budget } from "../../domain/budgets/budget.types";
import { CreateExpenseModel, Expense } from "../../domain/expenses/expense.types";
import { Goal } from "../../domain/goals/goal.types";
import { SystemNotification } from "../../domain/notifications/notification.types";
import {
  accountApi,
  budgetApi,
  demoApi,
  expenseApi,
  goalApi,
  notificationApi,
  receiptApi,
} from ".";

const expensePayload: CreateExpenseModel = {
  merchant: "Corner Market",
  description: "Groceries",
  amount: 24.75,
  date: "2026-06-02",
  category: "Food & Grocery",
  accountSource: "wallet",
  paymentMethod: "debit_card",
  isRecurring: false,
};

const replacementExpense: Expense = {
  ...expensePayload,
  id: "expense-replacement",
  entrySource: "manual",
};

const budgetPayload: Omit<Budget, "id"> = {
  category: "Food & Grocery",
  limitAmount: 400,
  period: "monthly",
  periodKey: "2026-06",
};

const replacementBudget: Budget = {
  ...budgetPayload,
  id: "budget-replacement",
};

const goalPayload: Omit<Goal, "id"> = {
  name: "Emergency fund",
  targetAmount: 3000,
  currentAmount: 500,
  targetDate: "2026-12-31",
};

const replacementGoal: Goal = {
  ...goalPayload,
  id: "goal-replacement",
};

const connectedAccount: ConnectedAccount = {
  id: "account-1",
  name: "Everyday Checking",
  institutionName: "Mock Bank",
  type: "checking",
  balance: 1200,
  currency: "EUR",
  isConnected: true,
  status: "connected",
};

const notification: SystemNotification = {
  id: "notification-1",
  type: "info",
  message: "Sample notification",
  timestamp: "2026-06-02T10:00:00.000Z",
  isRead: false,
};

describe("mock API clients", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test("expenseApi delegates to mock expense persistence", async () => {
    expect(await expenseApi.listExpenses()).toEqual([]);

    const created = await expenseApi.createExpense(expensePayload);
    expect(created).toMatchObject({
      merchant: "Corner Market",
      entrySource: "manual",
    });

    const updated = await expenseApi.updateExpense(created.id, { amount: 30 });
    expect(updated[0]).toMatchObject({ id: created.id, amount: 30 });

    await expenseApi.replaceExpenses([replacementExpense]);
    expect(await expenseApi.listExpenses()).toEqual([replacementExpense]);

    expect(await expenseApi.deleteExpense(replacementExpense.id)).toEqual([]);
  });

  test("expenseApi creates imported expenses through the same mock persistence", async () => {
    const created = await expenseApi.createImportedExpenses([
      {
        ...expensePayload,
        merchant: "Imported Market",
        entrySource: "connected_account",
        sourceAccountId: "account-1",
        importBatchId: "batch-1",
        externalTransactionId: "external-1",
      },
    ]);

    expect(created).toHaveLength(1);
    expect(created[0]).toMatchObject({
      entrySource: "connected_account",
      sourceAccountId: "account-1",
    });
    expect(await expenseApi.listExpenses()).toHaveLength(1);
  });

  test("budgetApi delegates to mock budget persistence", async () => {
    const created = await budgetApi.createBudget(budgetPayload);
    expect(created).toMatchObject(budgetPayload);

    const updated = await budgetApi.updateBudget(created.id, { limitAmount: 450 });
    expect(updated[0]).toMatchObject({ id: created.id, limitAmount: 450 });

    await budgetApi.replaceBudgets([replacementBudget]);
    expect(await budgetApi.listBudgets()).toEqual([replacementBudget]);

    expect(await budgetApi.deleteBudget(replacementBudget.id)).toEqual([]);
  });

  test("goalApi delegates to mock goal persistence", async () => {
    const created = await goalApi.createGoal(goalPayload);
    expect(created).toMatchObject(goalPayload);

    const updated = await goalApi.updateGoal(created.id, { currentAmount: 750 });
    expect(updated[0]).toMatchObject({ id: created.id, currentAmount: 750 });

    await goalApi.replaceGoals([replacementGoal]);
    expect(await goalApi.listGoals()).toEqual([replacementGoal]);

    expect(await goalApi.deleteGoal(replacementGoal.id)).toEqual([]);
  });

  test("accountApi delegates to mock connected account persistence", async () => {
    expect(await accountApi.listConnectedAccounts()).toEqual([]);

    await accountApi.replaceConnectedAccounts([connectedAccount]);

    expect(await accountApi.listConnectedAccounts()).toEqual([connectedAccount]);
  });

  test("accountApi exposes mock bank institutions for demo account selection", async () => {
    const institutions = await accountApi.listBankInstitutions("DE");

    expect(institutions.length).toBeGreaterThan(0);
    expect(institutions[0]).toMatchObject({
      id: expect.any(String),
      name: expect.any(String),
      countries: ["DE"],
    });
  });

  test("notificationApi delegates to mock notification persistence", async () => {
    await notificationApi.replaceNotifications([notification]);
    expect(await notificationApi.listNotifications()).toEqual([notification]);

    await notificationApi.clearNotifications();

    expect(await notificationApi.listNotifications()).toEqual([]);
  });

  test("receiptApi returns mock receipt templates without scan metadata", async () => {
    const templates = await receiptApi.listReceiptTemplates();

    expect(templates.length).toBeGreaterThan(0);
    expect(templates[0]).toMatchObject({
      merchant: expect.any(String),
      amount: expect.any(Number),
      category: expect.any(String),
    });
    expect(templates[0]).not.toHaveProperty("date");
    expect(templates[0]).not.toHaveProperty("confidence");
  });

  test("demoApi delegates to starter data service behavior", async () => {
    expect(await demoApi.hasUserData()).toBe(false);

    const summary = await demoApi.loadStarterDemoData();
    expect(summary.expenses).toBeGreaterThan(0);
    expect(summary.budgets).toBeGreaterThan(0);
    expect(summary.goals).toBeGreaterThan(0);
    expect(summary.accounts).toBeGreaterThan(0);
    expect(await demoApi.hasUserData()).toBe(true);

    await demoApi.clearDemoData();

    expect(await demoApi.hasUserData()).toBe(false);
  });
});
