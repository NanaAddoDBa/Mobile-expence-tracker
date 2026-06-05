import { createSampleData } from "../../features/demo/services/sampleDataService";
import { localStorageAdapter } from "../storage/localStorageAdapter";
import { StorageAdapter } from "../storage/storage.types";

const EXPENSES_KEY = "exp_ledger";
const BUDGETS_KEY = "exp_budgets";
const GOALS_KEY = "exp_goals";
const ACCOUNTS_KEY = "exp_accounts";
const NOTIFICATIONS_KEY = "exp_notifications";

export const DEMO_DATA_STORAGE_KEYS = [
  EXPENSES_KEY,
  BUDGETS_KEY,
  GOALS_KEY,
  ACCOUNTS_KEY,
  NOTIFICATIONS_KEY,
] as const;

export interface DemoDataSummary {
  expenses: number;
  budgets: number;
  goals: number;
  accounts: number;
}

export function loadStarterDemoData(
  storage: StorageAdapter = localStorageAdapter
): DemoDataSummary {
  const sampleData = createSampleData();

  storage.setItem(EXPENSES_KEY, JSON.stringify(sampleData.expenses));
  storage.setItem(BUDGETS_KEY, JSON.stringify(sampleData.budgets));
  storage.setItem(GOALS_KEY, JSON.stringify(sampleData.goals));
  storage.setItem(ACCOUNTS_KEY, JSON.stringify(sampleData.accounts));

  return {
    expenses: sampleData.expenses.length,
    budgets: sampleData.budgets.length,
    goals: sampleData.goals.length,
    accounts: sampleData.accounts.length,
  };
}

export function resetDemoData(storage: StorageAdapter = localStorageAdapter): DemoDataSummary {
  clearDemoData(storage);
  return loadStarterDemoData(storage);
}

export function clearDemoData(storage: StorageAdapter = localStorageAdapter): void {
  DEMO_DATA_STORAGE_KEYS.forEach((key) => storage.removeItem(key));
}

export function hasUserData(storage: StorageAdapter = localStorageAdapter): boolean {
  return [EXPENSES_KEY, BUDGETS_KEY, GOALS_KEY, ACCOUNTS_KEY].some((key) => {
    const storedValue = storage.getItem(key);
    if (!storedValue) return false;

    try {
      const parsed = JSON.parse(storedValue);
      return Array.isArray(parsed) ? parsed.length > 0 : parsed !== null;
    } catch {
      return true;
    }
  });
}

export const demoDataService = {
  loadStarterDemoData,
  resetDemoData,
  clearDemoData,
  hasUserData,
};
