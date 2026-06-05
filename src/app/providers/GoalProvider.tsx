import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Goal } from "../../domain/goals/goal.types";
import {
  createSampleGoals,
  mergeSampleRecords,
} from "../../features/demo/services/sampleDataService";
import { goalApi } from "../../services/api";

export interface GoalContextType {
  goals: Goal[];
  addGoal: (goal: Omit<Goal, "id">) => Promise<void>;
  reloadGoals: () => Promise<Goal[]>;
  loadSampleGoals: () => Promise<Goal[]>;
  editGoal: (id: string, goal: Partial<Goal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
}

const GoalContext = createContext<GoalContextType | undefined>(undefined);

export const GoalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [goals, setGoals] = useState<Goal[]>([]);

  const reloadGoals = useCallback(async () => {
    const nextGoals = await goalApi.listGoals();
    setGoals(nextGoals);
    return nextGoals;
  }, []);

  useEffect(() => {
    void reloadGoals();
  }, [reloadGoals]);

  const value = useMemo<GoalContextType>(() => {
    return {
      goals,
      async addGoal(goalData) {
        const added = await goalApi.createGoal(goalData);
        setGoals((prev) => [...prev, added]);
      },
      reloadGoals,
      async loadSampleGoals() {
        const sampleGoals = createSampleGoals();
        const nextGoals = mergeSampleRecords(goals, sampleGoals);
        await goalApi.replaceGoals(nextGoals);
        setGoals(await goalApi.listGoals());
        return sampleGoals;
      },
      async editGoal(id, updatedFields) {
        const nextGoals = await goalApi.updateGoal(id, updatedFields);
        setGoals(nextGoals);
      },
      async deleteGoal(id) {
        const nextGoals = await goalApi.deleteGoal(id);
        setGoals(nextGoals);
      },
    };
  }, [goals, reloadGoals]);

  return <GoalContext.Provider value={value}>{children}</GoalContext.Provider>;
};

export const useGoals = () => {
  const context = useContext(GoalContext);
  if (context === undefined) {
    throw new Error("useGoals must be used within a GoalProvider");
  }
  return context;
};
