import { Expense } from "../expenses/expense.types";
import { Budget, BudgetStatusDetail, BudgetStatus } from "./budget.types";
import { getCurrentMonthKey, isSameMonth } from "../../lib/dateUtils";

/**
 * Pure function to calculate spending per budget category based on a set of expenses.
 * Defaults to the current calendar month if no customized year-month key is passed.
 */
export function calculateBudgetUsage(
  expenses: Expense[],
  budgets: Budget[],
  customYearMonth?: string // Format: "YYYY-MM"
): BudgetStatusDetail[] {
  const currentMonthStr = customYearMonth || getCurrentMonthKey();

  const monthExpenses = expenses.filter((e) => {
    if (!e.date) return false;
    return isSameMonth(e.date, currentMonthStr);
  });

  return budgets.map((budget) => {
    const spentAmount = monthExpenses
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
    };
  });
}
