import { Goal } from "../../domain/goals/goal.types";
import { createAppError } from "../../lib/error/appError";
import { logger } from "../../lib/logger";
import { localStorageAdapter } from "../storage/localStorageAdapter";
import { StorageAdapter } from "../storage/storage.types";

const STORAGE_KEY = "exp_goals";

export function createGoalRepository(storage: StorageAdapter = localStorageAdapter) {
  return {
    getAll(): Goal[] {
      const saved = storage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          logger.error("Failed to parse goals from storage. Falling back to an empty goals list.", {
            error: createAppError("STORAGE_ERROR", "Could not parse saved goals.", e),
            storageKey: STORAGE_KEY,
          });
        }
      }
      return [];
    },

    saveAll(goals: Goal[]): void {
      storage.setItem(STORAGE_KEY, JSON.stringify(goals));
    },

    add(goalData: Omit<Goal, "id">): Goal {
      const goals = this.getAll();
      const newGoal: Goal = {
        ...goalData,
        id: `g-${Math.random().toString(36).substring(2, 7)}`,
      };
      goals.push(newGoal);
      this.saveAll(goals);
      return newGoal;
    },

    update(id: string, updates: Partial<Goal>): Goal[] {
      const goals = this.getAll();
      const updated = goals.map((g) => (g.id === id ? { ...g, ...updates } : g));
      this.saveAll(updated);
      return updated;
    },

    delete(id: string): Goal[] {
      const goals = this.getAll();
      const updated = goals.filter((g) => g.id !== id);
      this.saveAll(updated);
      return updated;
    },
  };
}

export const goalRepository = createGoalRepository();
