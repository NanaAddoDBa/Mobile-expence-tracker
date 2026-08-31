import { Income } from "../../domain/incomes/income.types";
import { createAppError } from "../../lib/error/appError";
import { logger } from "../../lib/logger";
import { localStorageAdapter } from "../storage/localStorageAdapter";
import { StorageAdapter } from "../storage/storage.types";

const STORAGE_KEY = "income_ledger";

export function createIncomeRepository(storage: StorageAdapter = localStorageAdapter) {
  return {
    getAll(): Income[] {
      const saved = storage.getItem(STORAGE_KEY);
      if (!saved) return [];

      try {
        return JSON.parse(saved) as Income[];
      } catch (error) {
        logger.error("Failed to parse incomes from storage.", {
          error: createAppError("STORAGE_ERROR", "Could not parse saved incomes.", error),
          storageKey: STORAGE_KEY,
        });
        return [];
      }
    },

    saveAll(incomes: Income[]): void {
      storage.setItem(STORAGE_KEY, JSON.stringify(incomes));
    },

    add(incomeData: Omit<Income, "id">): Income {
      const income: Income = {
        ...incomeData,
        id: `income-${Math.random().toString(36).substring(2, 9)}`,
      };
      this.saveAll([income, ...this.getAll()]);
      return income;
    },

    update(id: string, updates: Partial<Income>): Income[] {
      const incomes = this.getAll().map((income) =>
        income.id === id ? { ...income, ...updates } : income,
      );
      this.saveAll(incomes);
      return incomes;
    },

    delete(id: string): Income[] {
      const incomes = this.getAll().filter((income) => income.id !== id);
      this.saveAll(incomes);
      return incomes;
    },
  };
}

export const incomeRepository = createIncomeRepository();
