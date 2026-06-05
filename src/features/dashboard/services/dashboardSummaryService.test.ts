import { describe, expect, test } from "vitest";
import { Budget } from "../../../domain/budgets/budget.types";
import { Expense } from "../../../domain/expenses/expense.types";
import {
  getBudgetUsageDetails,
  getBudgetUsagePercentage,
  getDashboardSearchResults,
  getDashboardSetupGuidance,
  getOverspendingAlerts,
  getRecentExpenses,
  getThisMonthExpenseTotal,
  getTopSpendingCategories,
  isDashboardEmpty,
} from "./dashboardSummaryService";

const expenses: Expense[] = [
  {
    id: "exp-1",
    merchant: "Aldi",
    description: "Groceries",
    amount: 120,
    date: "2025-05-03",
    category: "Food & Grocery",
    accountSource: "acct-1",
    paymentMethod: "debit_card",
    isRecurring: false,
  },
  {
    id: "exp-2",
    merchant: "Trainline",
    description: "Weekly commute",
    amount: 80,
    date: "2025-05-04",
    category: "Transport & Auto",
    accountSource: "acct-1",
    paymentMethod: "debit_card",
    isRecurring: false,
  },
  {
    id: "exp-3",
    merchant: "Cafe Nero",
    description: "Coffee",
    amount: 30,
    date: "2025-05-05",
    category: "Dining & Cafe",
    accountSource: "acct-1",
    paymentMethod: "digital_wallet",
    isRecurring: false,
    notes: "Morning coffee",
  },
  {
    id: "exp-4",
    merchant: "April Shop",
    description: "Previous month",
    amount: 500,
    date: "2025-04-29",
    category: "Shopping",
    accountSource: "acct-1",
    paymentMethod: "credit_card",
    isRecurring: false,
  },
];

const budgets: Budget[] = [
  {
    id: "budget-1",
    category: "Food & Grocery",
    limitAmount: 100,
  },
  {
    id: "budget-2",
    category: "Transport & Auto",
    limitAmount: 100,
  },
  {
    id: "budget-3",
    category: "Dining & Cafe",
    limitAmount: 50,
  },
];

describe("dashboardSummaryService", () => {
  test("calculates this month's expense total", () => {
    expect(getThisMonthExpenseTotal(expenses, "2025-05")).toBe(230);
  });

  test("calculates budget usage percentage", () => {
    const usage = getBudgetUsageDetails(expenses, budgets, "2025-05");

    expect(getBudgetUsagePercentage(budgets, usage)).toBe(92);
  });

  test("ranks top spending categories by spent amount", () => {
    const usage = getBudgetUsageDetails(expenses, budgets, "2025-05");
    const categories = getTopSpendingCategories(usage);

    expect(categories.map((category) => category.category)).toEqual([
      "Food & Grocery",
      "Transport & Auto",
      "Dining & Cafe",
    ]);
  });

  test("returns recent expenses in the existing list order", () => {
    expect(getRecentExpenses(expenses, 2).map((expense) => expense.id)).toEqual(["exp-1", "exp-2"]);
  });

  test("filters dashboard search results by merchant, description, category, or notes", () => {
    expect(getDashboardSearchResults(expenses, "coffee").map((expense) => expense.id)).toEqual(["exp-3"]);
    expect(getDashboardSearchResults(expenses, "transport").map((expense) => expense.id)).toEqual(["exp-2"]);
    expect(getDashboardSearchResults(expenses, "previous").map((expense) => expense.id)).toEqual(["exp-4"]);
  });

  test("selects overspending and near-limit alerts", () => {
    const usage = getBudgetUsageDetails(expenses, budgets, "2025-05");
    const alerts = getOverspendingAlerts(usage);

    expect(alerts.overspendingCategories.map((category) => category.category)).toEqual(["Food & Grocery"]);
    expect(alerts.nearLimitCategories.map((category) => category.category)).toEqual([
      "Transport & Auto",
    ]);
  });

  test("detects whether the dashboard has meaningful user data", () => {
    expect(
      isDashboardEmpty({
        expenses: [],
        budgets: [],
        goals: [],
        receipts: [],
        connectedAccounts: [],
      })
    ).toBe(true);

    expect(
      isDashboardEmpty({
        expenses,
        budgets: [],
        goals: [],
        receipts: [],
        connectedAccounts: [],
      })
    ).toBe(false);
  });

  test("returns setup guidance for partial setup states", () => {
    expect(
      getDashboardSetupGuidance({
        expenses: [],
        budgets,
        goals: [],
        receipts: [],
        connectedAccounts: [],
      }).map((item) => item.id)
    ).toContain("budget-without-expenses");

    expect(
      getDashboardSetupGuidance({
        expenses,
        budgets: [],
        goals: [],
        receipts: [],
        connectedAccounts: [],
      }).map((item) => item.id)
    ).toContain("expenses-without-budgets");

    expect(
      getDashboardSetupGuidance({
        expenses: [],
        budgets: [],
        goals: [],
        receipts: [],
        connectedAccounts: [
          {
            id: "acct-1",
            name: "Everyday Checking",
            institutionName: "Mock Bank",
            type: "checking",
            balance: 100,
            currency: "EUR",
            isConnected: true,
            status: "connected",
            accessType: "read_only",
            connectionMode: "mock",
            importedExpenseCount: 0,
          },
        ],
      }).map((item) => item.id)
    ).toContain("connected-without-import");
  });
});
