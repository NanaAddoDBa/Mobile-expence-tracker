import { Budget } from "../../domain/budgets/budget.types";
import { createAppError } from "../../lib/error/appError";
import { logger } from "../../lib/logger";
import { localStorageAdapter } from "../storage/localStorageAdapter";
import { StorageAdapter } from "../storage/storage.types";

const STORAGE_KEY = "exp_budgets";

export function createBudgetRepository(storage: StorageAdapter = localStorageAdapter) {
  return {
    getAll(): Budget[] {
      const saved = storage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          logger.error("Failed to parse budgets from storage. Falling back to an empty budget list.", {
            error: createAppError("STORAGE_ERROR", "Could not parse saved budgets.", e),
            storageKey: STORAGE_KEY,
          });
        }
      }
      return [];
    },

    saveAll(budgets: Budget[]): void {
      storage.setItem(STORAGE_KEY, JSON.stringify(budgets));
    },

    add(budgetData: Omit<Budget, "id">): Budget {
      const budgets = this.getAll();
      const newBudget: Budget = {
        ...budgetData,
        id: `b-${Math.random().toString(36).substring(2, 7)}`,
      };
      budgets.push(newBudget);
      this.saveAll(budgets);
      return newBudget;
    },

    update(id: string, updates: Partial<Budget>): Budget[] {
      const budgets = this.getAll();
      const updated = budgets.map((b) => (b.id === id ? { ...b, ...updates } : b));
      this.saveAll(updated);
      return updated;
    },

    delete(id: string): Budget[] {
      const budgets = this.getAll();
      const updated = budgets.filter((b) => b.id !== id);
      this.saveAll(updated);
      return updated;
    },
  };
}

export const budgetRepository = createBudgetRepository();
