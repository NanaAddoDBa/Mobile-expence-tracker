import { useCallback } from "react";
import { useBudgets } from "../../../app/providers/BudgetProvider";
import { useConnectedAccounts } from "../../../app/providers/AccountConnectionProvider";
import { useExpenses } from "../../../app/providers/ExpenseProvider";
import { useGoals } from "../../../app/providers/GoalProvider";
import { useNotifications } from "../../../app/providers/NotificationProvider";
import { demoDataService } from "../../../services/demo/demoDataService";

export interface DemoDataLoadResult {
  expenses: number;
  budgets: number;
  goals: number;
  accounts: number;
}

export function useDemoDataActions() {
  const { reloadExpenses } = useExpenses();
  const { reloadBudgets } = useBudgets();
  const { reloadGoals } = useGoals();
  const { reloadAccounts } = useConnectedAccounts();
  const { reloadNotifications } = useNotifications();

  const refreshProductData = useCallback(() => {
    reloadExpenses();
    reloadBudgets();
    reloadGoals();
    reloadAccounts();
    reloadNotifications();
  }, [reloadAccounts, reloadBudgets, reloadExpenses, reloadGoals, reloadNotifications]);

  const loadSampleData = useCallback((): DemoDataLoadResult => {
    const result = demoDataService.loadStarterDemoData();
    refreshProductData();
    return result;
  }, [refreshProductData]);

  const resetSampleData = useCallback((): DemoDataLoadResult => {
    const result = demoDataService.resetDemoData();
    refreshProductData();
    return result;
  }, [refreshProductData]);

  const clearSampleData = useCallback(() => {
    demoDataService.clearDemoData();
    refreshProductData();
  }, [refreshProductData]);

  return { loadSampleData, resetSampleData, clearSampleData };
}
