import React, { createContext, useContext, useMemo, useState } from "react";
import { Goal } from "../../domain/goals/goal.types";
import {
  createSampleGoals,
  mergeSampleRecords,
} from "../../features/demo/services/sampleDataService";
import { goalRepository } from "../../services/repositories/goalRepository.mock";

export interface GoalContextType {
  goals: Goal[];
  addGoal: (goal: Omit<Goal, "id">) => void;
  reloadGoals: () => Goal[];
  loadSampleGoals: () => Goal[];
  editGoal: (id: string, goal: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
}

const GoalContext = createContext<GoalContextType | undefined>(undefined);

export const GoalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [goals, setGoals] = useState<Goal[]>(() => goalRepository.getAll());

  const value = useMemo<GoalContextType>(() => {
    return {
      goals,
      addGoal(goalData) {
        const added = goalRepository.add(goalData);
        setGoals((prev) => [...prev, added]);
      },
      reloadGoals() {
        const nextGoals = goalRepository.getAll();
        setGoals(nextGoals);
        return nextGoals;
      },
      loadSampleGoals() {
        const sampleGoals = createSampleGoals();
        const nextGoals = mergeSampleRecords(goals, sampleGoals);
        goalRepository.saveAll(nextGoals);
        setGoals(nextGoals);
        return sampleGoals;
      },
      editGoal(id, updatedFields) {
        const nextGoals = goalRepository.update(id, updatedFields);
        setGoals(nextGoals);
      },
      deleteGoal(id) {
        const nextGoals = goalRepository.delete(id);
        setGoals(nextGoals);
      },
    };
  }, [goals]);

  return <GoalContext.Provider value={value}>{children}</GoalContext.Provider>;
};

export const useGoals = () => {
  const context = useContext(GoalContext);
  if (context === undefined) {
    throw new Error("useGoals must be used within a GoalProvider");
  }
  return context;
};
