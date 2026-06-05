import { useMemo } from "react";
import { useBudgets } from "../../../app/providers/BudgetProvider";
import { useConnectedAccounts } from "../../../app/providers/AccountConnectionProvider";
import { useExpenses } from "../../../app/providers/ExpenseProvider";
import { useGoals } from "../../../app/providers/GoalProvider";
import { budgetRecommendationService } from "../../budgets/services/budgetRecommendationService";
import { getCurrentMonthKey, getMonthLabel, getTodayDateString } from "../../../lib/dateUtils";
import {
  getDashboardSummary,
  getDashboardSetupGuidance,
  isDashboardEmpty,
} from "../services/dashboardSummaryService";

export function useDashboardSummary() {
  const { expenses } = useExpenses();
  const { budgets } = useBudgets();
  const { goals } = useGoals();
  const { accounts } = useConnectedAccounts();

  const currentYearMonth = getCurrentMonthKey();
  const today = getTodayDateString();

  const summary = useMemo(() => {
    return getDashboardSummary(expenses, budgets, goals, currentYearMonth, today);
  }, [expenses, budgets, goals, currentYearMonth, today]);

  const budgetRecommendations = useMemo(() => {
    return budgetRecommendationService.getRecommendations(expenses, budgets, currentYearMonth);
  }, [expenses, budgets, currentYearMonth]);

  const currentMonthLabelFull = getMonthLabel(currentYearMonth);
  const dashboardIsEmpty = isDashboardEmpty({
    expenses,
    budgets,
    goals,
    connectedAccounts: accounts,
  });
  const setupGuidance = getDashboardSetupGuidance({
    expenses,
    budgets,
    goals,
    connectedAccounts: accounts,
  });

  return {
    ...summary,
    budgetRecommendations,
    setupGuidance,
    currentYearMonth,
    currentMonthLabelFull,
    currentMonthName: currentMonthLabelFull.split(" ")[0],
    isEmpty: dashboardIsEmpty,
  };
}
