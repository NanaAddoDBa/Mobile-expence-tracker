import { useMemo } from "react";
import { Expense } from "../../../domain/expenses/expense.types";
import { Budget } from "../../../domain/budgets/budget.types";
import { budgetCalculationService } from "../services/budgetCalculationService";
import { budgetRecommendationService } from "../services/budgetRecommendationService";

export function useBudgetDetails(expenses: Expense[], budgets: Budget[], currentMonthKey: string) {
  const usageDetails = useMemo(() => {
    return budgetCalculationService.getUsageDetails(expenses, budgets, currentMonthKey);
  }, [expenses, budgets, currentMonthKey]);

  const summary = useMemo(() => {
    return budgetCalculationService.calculateOverallBudgetSummary(expenses, budgets, currentMonthKey);
  }, [expenses, budgets, currentMonthKey]);

  const recommendations = useMemo(() => {
    return budgetRecommendationService.getRecommendations(expenses, budgets, currentMonthKey);
  }, [expenses, budgets, currentMonthKey]);

  return {
    usageDetails,
    summary,
    recommendations,
  };
}
