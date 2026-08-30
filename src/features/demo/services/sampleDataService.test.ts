import { describe, expect, test } from "vitest";
import {
  createSampleAccounts,
  createSampleBudgets,
  createSampleData,
  createSampleExpenses,
  createSampleGoals,
  mergeSampleRecords,
} from "./sampleDataService";

describe("sampleDataService", () => {
  test("creates current sample expenses with normalized source metadata", () => {
    const expenses = createSampleExpenses(new Date(2027, 2, 10));

    expect(expenses).toHaveLength(14);
    expect(expenses.filter((expense) => expense.date.startsWith("2027-03"))).toHaveLength(3);
    expect(expenses.filter((expense) => expense.date.startsWith("2027-02"))).toHaveLength(11);
    expect(expenses.filter((expense) => expense.entrySource === "manual")).toHaveLength(9);
    expect(expenses.filter((expense) => expense.entrySource === "connected_account")).toHaveLength(3);
    expect(expenses.filter((expense) => expense.entrySource === "receipt_scan")).toHaveLength(2);
    expect(expenses.find((expense) => expense.id === "exp-10")).toMatchObject({
      entrySource: "connected_account",
      sourceAccountId: "mock-bank-checking-4820",
      externalTransactionId: "mock-bank-checking-4820-tx-001",
    });
    expect(expenses.find((expense) => expense.id === "exp-11")).toMatchObject({
      entrySource: "receipt_scan",
      receiptId: "receipt-sample-cafe-2026-06-02",
    });
  });

  test("creates sample connected accounts with import summaries", () => {
    const accounts = createSampleAccounts(new Date(Date.UTC(2027, 2, 10, 12)));

    expect(accounts).toHaveLength(2);
    expect(accounts[0]).toMatchObject({
      id: "mock-bank-checking-4820",
      isConnected: true,
      status: "connected",
      importedExpenseCount: 2,
      lastImportedCount: 2,
      lastSkippedDuplicateCount: 0,
      lastImportFailedCount: 0,
    });
    expect(accounts[1]).toMatchObject({
      id: "mock-card-credit-9312",
      isConnected: false,
      status: "needs_reconnect",
      importedExpenseCount: 1,
      lastImportMessage: "Reconnect before importing expenses.",
    });
    expect(accounts.every((account) => account.connectionMode === "mock")).toBe(true);
    expect(accounts.every((account) => account.accessType === "read_only")).toBe(true);
    expect(accounts.every((account) => account.lastImportedAt === "2027-03-10T12:00:00.000Z")).toBe(true);
  });

  test("creates current sample goals with future target dates", () => {
    const goals = createSampleGoals(new Date(2027, 2, 10));

    expect(goals.map((goal) => goal.name)).toEqual([
      "Summer Vacation",
      "Emergency Savings",
      "Commuter Bike",
    ]);
    expect(goals.map((goal) => goal.targetDate)).toEqual([
      "2027-05-15",
      "2027-09-28",
      "2027-07-28",
    ]);
  });

  test("creates budgets and full sample data without sharing fixture objects", () => {
    const budgets = createSampleBudgets(new Date(2027, 2, 10));
    const sampleData = createSampleData(new Date(2027, 2, 10));

    expect(budgets).toHaveLength(10);
    expect(sampleData.expenses).toHaveLength(14);
    expect(sampleData.budgets).toHaveLength(10);
    expect(sampleData.goals).toHaveLength(3);
    expect(sampleData.accounts).toHaveLength(2);
    expect(budgets.every((budget) => budget.period === "monthly")).toBe(true);
    expect(budgets.every((budget) => budget.periodKey === "2027-03")).toBe(true);
    expect(budgets[0]).not.toBe(createSampleBudgets(new Date(2027, 2, 10))[0]);
  });

  test("merges sample records without duplicating refreshed sample ids", () => {
    const merged = mergeSampleRecords(
      [
        { id: "sample-1", label: "old sample" },
        { id: "custom-1", label: "user item" },
      ],
      [{ id: "sample-1", label: "new sample" }]
    );

    expect(merged).toEqual([
      { id: "sample-1", label: "new sample" },
      { id: "custom-1", label: "user item" },
    ]);
  });
});
