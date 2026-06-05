import { Budget } from "../../../domain/budgets/budget.types";
import { calculateBudgetUsage } from "../../../domain/budgets/budget.rules";
import { Expense } from "../../../domain/expenses/expense.types";

export interface OverallBudgetSummary {
  totalLimitAmount: number;
  totalSpentAmount: number;
  totalRemainingAmount: number;
  percentageUsed: number;
  overBudgetCount: number;
  warningCount: number;
}

export function getBudgetUsageForMonth(
  expenses: Expense[],
  budgets: Budget[],
  monthKey: string
) {
  return calculateBudgetUsage(expenses, budgets, monthKey);
}

export function calculateOverallBudgetSummary(
  expenses: Expense[],
  budgets: Budget[],
  monthKey: string
): OverallBudgetSummary {
  const usage = getBudgetUsageForMonth(expenses, budgets, monthKey);
  const totalLimitAmount = budgets.reduce((sum, budget) => sum + budget.limitAmount, 0);
  const totalSpentAmount = usage.reduce((sum, detail) => sum + detail.spentAmount, 0);
  const totalRemainingAmount = Math.max(0, totalLimitAmount - totalSpentAmount);

  return {
    totalLimitAmount,
    totalSpentAmount,
    totalRemainingAmount,
    percentageUsed:
      totalLimitAmount > 0 ? +((totalSpentAmount / totalLimitAmount) * 100).toFixed(1) : 0,
    overBudgetCount: usage.filter((detail) => detail.status === "Over Budget").length,
    warningCount: usage.filter((detail) => detail.status === "Warning").length,
  };
}

export const budgetCalculationService = {
  calculateOverallBudgetSummary,
  getUsageDetails: getBudgetUsageForMonth,
  getBudgetUsageForMonth,
};
