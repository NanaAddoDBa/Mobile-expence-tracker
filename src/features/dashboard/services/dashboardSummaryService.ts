import { Budget, BudgetStatusDetail } from "../../../domain/budgets/budget.types";
import { ConnectedAccount } from "../../../domain/accounts/account.types";
import { Expense } from "../../../domain/expenses/expense.types";
import { Goal } from "../../../domain/goals/goal.types";
import { Receipt } from "../../../domain/receipts/receipt.types";
import {
  calculateBudgetUsage,
  getBudgetsForPeriod,
} from "../../../domain/budgets/budget.rules";
import { getCurrentMonthKey, getTodayDateString, isSameMonth } from "../../../lib/dateUtils";
import { ForecastedExpense, generateForecastedExpenses } from "../../../lib/recurringExpenseEngine";

export interface SpendingCategorySummary {
  category: string;
  spentAmount: number;
  limitAmount: number;
  remainingAmount: number;
  percentageUsed: number;
  status: string;
}

export interface DashboardSummary {
  currentMonthExpenses: Expense[];
  currentMonthTotal: number;
  currentMonthExpensesCount: number;
  totalBudgetLimit: number;
  totalBudgetSpent: number;
  overallRemaining: number;
  overallPercentage: number;
  categoryRanking: SpendingCategorySummary[];
  forecasts: ForecastedExpense[];
  overspendingCategories: BudgetStatusDetail[];
  nearLimitCategories: BudgetStatusDetail[];
  recentExpenses: Expense[];
  visibleGoals: Goal[];
}

export type DashboardSetupGuidanceAction =
  | "add-expense"
  | "create-budget"
  | "import-expenses";

export interface DashboardSetupGuidance {
  id: string;
  title: string;
  description: string;
  actionLabel: string;
  action: DashboardSetupGuidanceAction;
}

interface DashboardEmptyInput {
  expenses: Expense[];
  budgets: Budget[];
  goals: Goal[];
  receipts?: Receipt[];
  connectedAccounts: ConnectedAccount[];
}

export function isDashboardEmpty({
  expenses,
  budgets,
  goals,
  receipts = [],
  connectedAccounts,
}: DashboardEmptyInput): boolean {
  return (
    expenses.length === 0 &&
    budgets.length === 0 &&
    goals.length === 0 &&
    receipts.length === 0 &&
    connectedAccounts.length === 0
  );
}

export function getDashboardSetupGuidance({
  expenses,
  budgets,
  goals,
  receipts = [],
  connectedAccounts,
}: DashboardEmptyInput): DashboardSetupGuidance[] {
  const guidance: DashboardSetupGuidance[] = [];
  const connectedWithoutImport = connectedAccounts.some(
    (account) => account.isConnected && (account.importedExpenseCount || 0) === 0
  );

  if (budgets.length > 0 && expenses.length === 0) {
    guidance.push({
      id: "budget-without-expenses",
      title: "You have a budget but no expenses yet",
      description: "Add an expense to start tracking progress against your budget.",
      actionLabel: "Add Expense",
      action: "add-expense",
    });
  }

  if (expenses.length > 0 && budgets.length === 0) {
    guidance.push({
      id: "expenses-without-budgets",
      title: "Create a budget to compare spending",
      description: "Budgets are planning limits you create for the expenses saved in this app.",
      actionLabel: "Create Budget",
      action: "create-budget",
    });
  }

  if (connectedWithoutImport) {
    guidance.push({
      id: "connected-without-import",
      title: "Account connected",
      description: "Import expenses from your connected mock account to begin analysis.",
      actionLabel: "Import Expenses",
      action: "import-expenses",
    });
  }

  if (receipts.length > 0 && budgets.length === 0 && expenses.length === 0) {
    guidance.push({
      id: "receipts-without-budgets",
      title: "Create a budget for receipt expenses",
      description: "After saving receipt-created expenses, budgets help compare spending against a plan.",
      actionLabel: "Create Budget",
      action: "create-budget",
    });
  }

  if (goals.length > 0 && expenses.length === 0 && budgets.length === 0) {
    guidance.push({
      id: "goals-without-tracking",
      title: "Goals are ready, now add spending context",
      description: "Add expenses or create a budget so your overview has useful spending context.",
      actionLabel: "Add Expense",
      action: "add-expense",
    });
  }

  return guidance;
}

export function getThisMonthExpenses(expenses: Expense[], monthKey: string): Expense[] {
  return expenses.filter((expense) => expense.date && isSameMonth(expense.date, monthKey));
}

export function getThisMonthExpenseTotal(expenses: Expense[], monthKey: string): number {
  return roundMoney(getThisMonthExpenses(expenses, monthKey).reduce((sum, expense) => sum + expense.amount, 0));
}

export function getBudgetUsageDetails(
  expenses: Expense[],
  budgets: Budget[],
  monthKey: string
): BudgetStatusDetail[] {
  return calculateBudgetUsage(expenses, budgets, monthKey);
}

export function getTotalBudgetLimit(budgets: Budget[]): number {
  return roundMoney(budgets.reduce((sum, budget) => sum + budget.limitAmount, 0));
}

export function getTotalBudgetSpent(budgetUsage: BudgetStatusDetail[]): number {
  return roundMoney(budgetUsage.reduce((sum, budget) => sum + budget.spentAmount, 0));
}

export function getRemainingBudgetTotal(budgets: Budget[], budgetUsage: BudgetStatusDetail[]): number {
  return roundMoney(Math.max(0, getTotalBudgetLimit(budgets) - getTotalBudgetSpent(budgetUsage)));
}

export function getBudgetUsagePercentage(budgets: Budget[], budgetUsage: BudgetStatusDetail[]): number {
  const totalBudgetLimit = getTotalBudgetLimit(budgets);
  if (totalBudgetLimit <= 0) return 0;
  return roundPercentage((getTotalBudgetSpent(budgetUsage) / totalBudgetLimit) * 100);
}

export function getTopSpendingCategories(budgetUsage: BudgetStatusDetail[], limit?: number): SpendingCategorySummary[] {
  const ranked = budgetUsage
    .filter((budget) => budget.spentAmount > 0)
    .map((budget) => ({ ...budget }))
    .sort((a, b) => b.spentAmount - a.spentAmount);

  return typeof limit === "number" ? ranked.slice(0, limit) : ranked;
}

export function getRecentExpenses(expenses: Expense[], limit = 5): Expense[] {
  return expenses.slice(0, limit);
}

export function getRecurringExpensesDueSoon(
  expenses: Expense[],
  referenceDate = getTodayDateString(),
  days = 30,
  limit = 3
): ForecastedExpense[] {
  return generateForecastedExpenses(expenses, days, referenceDate).slice(0, limit);
}

export function getOverspendingAlerts(budgetUsage: BudgetStatusDetail[]) {
  return {
    overspendingCategories: budgetUsage.filter((budget) => budget.status === "Over Budget"),
    nearLimitCategories: budgetUsage.filter((budget) => budget.status === "Warning"),
  };
}

export function getDashboardSearchResults(expenses: Expense[], query: string): Expense[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return expenses;

  return expenses.filter((expense) => {
    return (
      expense.merchant.toLowerCase().includes(normalizedQuery) ||
      expense.description.toLowerCase().includes(normalizedQuery) ||
      expense.category.toLowerCase().includes(normalizedQuery) ||
      expense.notes?.toLowerCase().includes(normalizedQuery)
    );
  });
}

export function getDashboardSummary(
  expenses: Expense[],
  budgets: Budget[],
  goals: Goal[],
  monthKey = getCurrentMonthKey(),
  referenceDate = getTodayDateString()
): DashboardSummary {
  const currentMonthExpenses = getThisMonthExpenses(expenses, monthKey);
  const currentMonthBudgets = getBudgetsForPeriod(budgets, "monthly", monthKey);
  const budgetUsage = getBudgetUsageDetails(expenses, currentMonthBudgets, monthKey);
  const totalBudgetLimit = getTotalBudgetLimit(currentMonthBudgets);
  const totalBudgetSpent = getTotalBudgetSpent(budgetUsage);
  const alerts = getOverspendingAlerts(budgetUsage);

  return {
    currentMonthExpenses,
    currentMonthTotal: roundMoney(currentMonthExpenses.reduce((sum, expense) => sum + expense.amount, 0)),
    currentMonthExpensesCount: currentMonthExpenses.length,
    totalBudgetLimit,
    totalBudgetSpent,
    overallRemaining: roundMoney(Math.max(0, totalBudgetLimit - totalBudgetSpent)),
    overallPercentage: getBudgetUsagePercentage(currentMonthBudgets, budgetUsage),
    categoryRanking: getTopSpendingCategories(budgetUsage),
    forecasts: getRecurringExpensesDueSoon(expenses, referenceDate),
    ...alerts,
    recentExpenses: getRecentExpenses(expenses),
    visibleGoals: goals.slice(0, 2),
  };
}

function roundMoney(value: number): number {
  return +value.toFixed(2);
}

function roundPercentage(value: number): number {
  return +value.toFixed(1);
}

export const dashboardSummaryService = {
  getDashboardSummary,
  getThisMonthExpenseTotal,
  getRemainingBudgetTotal,
  getBudgetUsagePercentage,
  getTopSpendingCategories,
  getRecentExpenses,
  getRecurringExpensesDueSoon,
  getOverspendingAlerts,
  getDashboardSearchResults,
  getDashboardSetupGuidance,
  isDashboardEmpty,
  getSummary: getDashboardSummary,
};
