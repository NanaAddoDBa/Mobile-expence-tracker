import { useCallback } from "react";
import { useBudgets } from "../../../app/providers/BudgetProvider";
import { useConnectedAccounts } from "../../../app/providers/AccountConnectionProvider";
import { useExpenses } from "../../../app/providers/ExpenseProvider";
import { useGoals } from "../../../app/providers/GoalProvider";
import { useIncomes } from "../../../app/providers/IncomeProvider";
import { useNotifications } from "../../../app/providers/NotificationProvider";
import { demoApi } from "../../../services/api";

export interface DemoDataLoadResult {
  expenses: number;
  incomes: number;
  budgets: number;
  goals: number;
  accounts: number;
}

export function useDemoDataActions() {
  const { reloadExpenses } = useExpenses();
  const { reloadIncomes } = useIncomes();
  const { reloadBudgets } = useBudgets();
  const { reloadGoals } = useGoals();
  const { reloadAccounts } = useConnectedAccounts();
  const { reloadNotifications } = useNotifications();

  const refreshProductData = useCallback(async () => {
    await Promise.all([
      reloadExpenses(),
      reloadIncomes(),
      reloadBudgets(),
      reloadGoals(),
      reloadAccounts(),
      reloadNotifications(),
    ]);
  }, [reloadAccounts, reloadBudgets, reloadExpenses, reloadGoals, reloadIncomes, reloadNotifications]);

  const loadSampleData = useCallback(async (): Promise<DemoDataLoadResult> => {
    const result = await demoApi.loadStarterDemoData();
    await refreshProductData();
    return result;
  }, [refreshProductData]);

  const resetSampleData = useCallback(async (): Promise<DemoDataLoadResult> => {
    const result = await demoApi.resetDemoData();
    await refreshProductData();
    return result;
  }, [refreshProductData]);

  const clearSampleData = useCallback(async () => {
    await demoApi.clearDemoData();
    await refreshProductData();
  }, [refreshProductData]);

  return { loadSampleData, resetSampleData, clearSampleData };
}
