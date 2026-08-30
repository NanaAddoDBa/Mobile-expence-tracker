import { Expense } from "../expenses/expense.types";
import {
  Budget,
  BudgetPeriod,
  BudgetStatusDetail,
  BudgetStatus,
} from "./budget.types";
import {
  getCurrentMonthKey,
  getCurrentYearKey,
  getIsoWeekKey,
  getTodayDateString,
  isSameIsoWeek,
  isSameMonth,
} from "../../lib/dateUtils";

export function getBudgetsForPeriod(
  budgets: Budget[],
  period: BudgetPeriod,
  periodKey: string,
): Budget[] {
  return budgets.filter(
    (budget) => budget.period === period && budget.periodKey === periodKey,
  );
}

/**
 * Pure function to calculate spending per budget category based on a set of expenses.
 * Defaults to the current calendar month if no customized year-month key is passed.
 */
export function calculateBudgetUsage(
  expenses: Expense[],
  budgets: Budget[],
  periodKey?: string,
  period: BudgetPeriod = "monthly",
): BudgetStatusDetail[] {
  const defaultPeriodKeys: Record<BudgetPeriod, () => string> = {
    daily: getTodayDateString,
    weekly: getIsoWeekKey,
    monthly: getCurrentMonthKey,
    annual: getCurrentYearKey,
  };
  const activePeriodKey = periodKey ?? defaultPeriodKeys[period]();

  const periodExpenses = expenses.filter((e) => {
    if (!e.date) return false;
    if (period === "daily") return e.date === activePeriodKey;
    if (period === "weekly") return isSameIsoWeek(e.date, activePeriodKey);
    if (period === "annual") return e.date.slice(0, 4) === activePeriodKey;
    return isSameMonth(e.date, activePeriodKey);
  });
  const activeBudgets = getBudgetsForPeriod(budgets, period, activePeriodKey);

  return activeBudgets.map((budget) => {
    const spentAmount = periodExpenses
      .filter((e) => e.category.toLowerCase() === budget.category.toLowerCase())
      .reduce((sum, e) => sum + e.amount, 0);

    const remainingAmount = budget.limitAmount - spentAmount;
    const percentageUsed = budget.limitAmount > 0 ? (spentAmount / budget.limitAmount) * 100 : 0;

    let status: BudgetStatus = "Safe";
    if (percentageUsed >= 100) {
      status = "Over Budget";
    } else if (percentageUsed >= 80) {
      status = "Warning";
    }

    return {
      category: budget.category,
      limitAmount: budget.limitAmount,
      spentAmount: +spentAmount.toFixed(2),
      remainingAmount: +remainingAmount.toFixed(2),
      percentageUsed,
      status,
      period,
      periodKey: activePeriodKey,
    };
  });
}
