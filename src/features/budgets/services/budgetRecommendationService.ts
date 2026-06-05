import { Expense } from "../../../domain/expenses/expense.types";
import { Budget } from "../../../domain/budgets/budget.types";
import { calculateBudgetUsage } from "../../../domain/budgets/budget.rules";

export const budgetRecommendationService = {
  getRecommendations(expenses: Expense[], budgets: Budget[], yearMonth: string): string[] {
    const usage = calculateBudgetUsage(expenses, budgets, yearMonth);
    const recs: string[] = [];

    const dining = usage.find((u) => u.category === "Dining & Cafe");
    if (dining && dining.percentageUsed > 75) {
      recs.push("Your dining out and cafe expenses are pacing higher than usual this month. Consider brewing coffee at home or home-cooking.");
    } else if (dining && dining.percentageUsed === 0 && budgets.length > 0) {
      recs.push("Great work keeping your dining expenses in order this month!");
    }

    const grocery = usage.find((u) => u.category === "Food & Grocery");
    if (grocery && grocery.percentageUsed > 90) {
      recs.push("Your weekly groceries budget is almost exhausted. Shop at local budget grocers or look for item bulk deals next week.");
    }

    const utilities = usage.find((u) => u.category === "Housing & Utilities");
    if (utilities && utilities.percentageUsed > 95) {
      recs.push("Housing services and utilities represent your largest category. Check standard appliance standby drains or compare energy providers.");
    }

    const trackingOverCount = usage.filter((u) => u.percentageUsed >= 100).length;
    if (trackingOverCount > 0) {
      recs.push(`You are over budget in ${trackingOverCount} categories. Review your spending or adjust your limits.`);
    } else {
      if (budgets.length > 0) {
        recs.push("All budgets are currently on track.");
      } else {
        recs.push("Create your first budget to start tracking category spending.");
      }
    }

    return recs;
  },
};
