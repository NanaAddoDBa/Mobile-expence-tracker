import { Expense } from "../../domain/expenses/expense.types";
import { createAppError } from "../../lib/error/appError";
import { logger } from "../../lib/logger";
import { normalizeExpenseSource } from "../../features/expenses/services/expenseSourceService";
import { localStorageAdapter } from "../storage/localStorageAdapter";
import { StorageAdapter } from "../storage/storage.types";

const STORAGE_KEY = "exp_ledger";

export function createExpenseRepository(storage: StorageAdapter = localStorageAdapter) {
  return {
    getAll(): Expense[] {
      const saved = storage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          return (JSON.parse(saved) as Expense[]).map(normalizeExpenseSource);
        } catch (e) {
          logger.error("Failed to parse expenses from storage. Falling back to an empty expense list.", {
            error: createAppError("STORAGE_ERROR", "Could not parse saved expenses.", e),
            storageKey: STORAGE_KEY,
          });
        }
      }
      return [];
    },

    saveAll(expenses: Expense[]): void {
      storage.setItem(STORAGE_KEY, JSON.stringify(expenses.map(normalizeExpenseSource)));
    },

    add(expenseData: Omit<Expense, "id">): Expense {
      const expenses = this.getAll();
      const newExpense: Expense = {
        ...expenseData,
        id: `exp-${Math.random().toString(36).substring(2, 9)}`,
      };
      const updated = [normalizeExpenseSource(newExpense), ...expenses];
      this.saveAll(updated);
      return normalizeExpenseSource(newExpense);
    },

    update(id: string, updates: Partial<Expense>): Expense[] {
      const expenses = this.getAll();
      const updated = expenses.map((exp) => (exp.id === id ? { ...exp, ...updates } : exp));
      this.saveAll(updated);
      return updated;
    },

    delete(id: string): Expense[] {
      const expenses = this.getAll();
      const updated = expenses.filter((exp) => exp.id !== id);
      this.saveAll(updated);
      return updated;
    },
  };
}

export const expenseRepository = createExpenseRepository();
