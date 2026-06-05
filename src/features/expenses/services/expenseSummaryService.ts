import { Expense } from "../../../domain/expenses/expense.types";
import { generateForecastedExpenses, ForecastedExpense } from "../../../lib/recurringExpenseEngine";
import { isSameMonth } from "../../../lib/dateUtils";

export const expenseSummaryService = {
  calculateTotalSpent(expenses: Expense[]): number {
    return expenses.reduce((sum, e) => sum + e.amount, 0);
  },

  calculateTotalSpentInMonth(expenses: Expense[], yearMonth: string): number {
    return expenses
      .filter((e) => e.date && isSameMonth(e.date, yearMonth))
      .reduce((sum, e) => sum + e.amount, 0);
  },

  calculateCategoryTotalsInMonth(expenses: Expense[], yearMonth: string): Record<string, number> {
    const monthExpenses = expenses.filter((e) => e.date && isSameMonth(e.date, yearMonth));
    const totals: Record<string, number> = {};

    monthExpenses.forEach((e) => {
      totals[e.category] = (totals[e.category] || 0) + e.amount;
    });

    return totals;
  },

  calculateBudgetOverviews(
    expenses: Expense[],
    budgets: { category: string; limitAmount: number }[],
    yearMonth: string
  ) {
    const monthExpenses = expenses.filter((e) => e.date && isSameMonth(e.date, yearMonth));

    return budgets.map((b) => {
      const spent = monthExpenses
        .filter((e) => e.category.toLowerCase() === b.category.toLowerCase())
        .reduce((sum, e) => sum + e.amount, 0);

      return {
        category: b.category,
        limitAmount: b.limitAmount,
        spentAmount: +spent.toFixed(2),
        remainingAmount: +(b.limitAmount - spent).toFixed(2),
        percentageUsed: b.limitAmount > 0 ? (spent / b.limitAmount) * 100 : 0,
      };
    });
  },

  getRecurringForecast(expenses: Expense[], referenceDate: string, days = 30): ForecastedExpense[] {
    return generateForecastedExpenses(expenses, days, referenceDate);
  },
};
export type { ForecastedExpense };
