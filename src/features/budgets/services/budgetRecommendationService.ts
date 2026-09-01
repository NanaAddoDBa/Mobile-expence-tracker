import { Expense } from "../../../domain/expenses/expense.types";
import { Budget, BudgetPeriod } from "../../../domain/budgets/budget.types";
import {
  calculateBudgetUsage,
  getBudgetsForPeriod,
} from "../../../domain/budgets/budget.rules";

export const budgetRecommendationService = {
  getRecommendations(
    expenses: Expense[],
    budgets: Budget[],
    periodKey: string,
    period: BudgetPeriod = "monthly",
  ): string[] {
    const usage = calculateBudgetUsage(expenses, budgets, periodKey, period);
    const activeBudgets = getBudgetsForPeriod(budgets, period, periodKey);
    const timeLabels: Record<BudgetPeriod, string> = {
      daily: "today",
      weekly: "this week",
      monthly: "this month",
      annual: "this year",
    };
    const timeLabel = timeLabels[period];
    const recs: string[] = [];

    const dining = usage.find((u) => u.category === "Dining & Cafe");
    if (dining && dining.percentageUsed > 75) {
      recs.push(`Your dining and cafe expenses are running high ${timeLabel}. Consider cooking at home or skipping an extra cafe stop.`);
    } else if (dining && dining.percentageUsed === 0 && activeBudgets.length > 0) {
      recs.push(`Your dining expenses are still within plan ${timeLabel}.`);
    }

    const grocery = usage.find((u) => u.category === "Food & Grocery");
    if (grocery && grocery.percentageUsed > 90) {
      recs.push(`Your grocery budget is almost exhausted ${timeLabel}. Review what remains before the next purchase.`);
    }

    const utilities = usage.find((u) => u.category === "Housing & Utilities");
    if (utilities && utilities.percentageUsed > 95) {
      recs.push("Housing services and utilities represent your largest category. Check standard appliance standby drains or compare energy providers.");
    }

    const trackingOverCount = usage.filter((u) => u.percentageUsed >= 100).length;
    if (trackingOverCount > 0) {
      recs.push(`You are over budget in ${trackingOverCount} categories. Review your spending or adjust your limits.`);
    } else {
      if (activeBudgets.length > 0) {
        recs.push("All budgets are currently on track.");
      } else {
        recs.push("Create your first budget to start tracking category spending.");
      }
    }

    return recs;
  },
};
