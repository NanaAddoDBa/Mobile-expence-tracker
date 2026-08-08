import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Goal } from "../../domain/goals/goal.types";
import {
  createSampleGoals,
  mergeSampleRecords,
} from "../../features/demo/services/sampleDataService";
import { goalApi } from "../../services/api";
import { USES_HTTP_API } from "../../services/api/apiMode";
import { useMockAuth } from "./MockAuthProvider";

export interface GoalContextType {
  goals: Goal[];
  isLoading: boolean;
  errorMessage: string | null;
  addGoal: (goal: Omit<Goal, "id">) => Promise<void>;
  reloadGoals: () => Promise<Goal[]>;
  loadSampleGoals: () => Promise<Goal[]>;
  editGoal: (id: string, goal: Partial<Goal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
}

const GoalContext = createContext<GoalContextType | undefined>(undefined);

export const GoalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { currentUser, isAuthenticated } = useMockAuth();

  const reloadGoals = useCallback(async () => {
    if (USES_HTTP_API && !isAuthenticated) {
      setGoals([]);
      return [];
    }

    if (USES_HTTP_API) {
      setIsLoading(true);
    }
    setErrorMessage(null);

    try {
      const nextGoals = await goalApi.listGoals();
      setGoals(nextGoals);
      return nextGoals;
    } catch {
      setErrorMessage("Could not load goals from the backend.");
      setGoals([]);
      return [];
    } finally {
      if (USES_HTTP_API) {
        setIsLoading(false);
      }
    }
  }, [isAuthenticated]);

  useEffect(() => {
    void reloadGoals();
  }, [reloadGoals, currentUser?.id]);

  const value = useMemo<GoalContextType>(() => {
    return {
      goals,
      isLoading,
      errorMessage,
      async addGoal(goalData) {
        try {
          const added = await goalApi.createGoal(goalData);
          setGoals((prev) => [...prev, added]);
          setErrorMessage(null);
        } catch {
          setErrorMessage("Could not save that goal.");
        }
      },
      reloadGoals,
      async loadSampleGoals() {
        const sampleGoals = createSampleGoals();
        const nextGoals = mergeSampleRecords(goals, sampleGoals);
        try {
          await goalApi.replaceGoals(nextGoals);
          setGoals(await goalApi.listGoals());
          setErrorMessage(null);
        } catch {
          setErrorMessage("Could not load sample goals.");
        }
        return sampleGoals;
      },
      async editGoal(id, updatedFields) {
        try {
          const nextGoals = await goalApi.updateGoal(id, updatedFields);
          setGoals(nextGoals);
          setErrorMessage(null);
        } catch {
          setErrorMessage("Could not update that goal.");
        }
      },
      async deleteGoal(id) {
        try {
          const nextGoals = await goalApi.deleteGoal(id);
          setGoals(nextGoals);
          setErrorMessage(null);
        } catch {
          setErrorMessage("Could not delete that goal.");
        }
      },
    };
  }, [goals, isLoading, errorMessage, reloadGoals]);

  return <GoalContext.Provider value={value}>{children}</GoalContext.Provider>;
};

export const useGoals = () => {
  const context = useContext(GoalContext);
  if (context === undefined) {
    throw new Error("useGoals must be used within a GoalProvider");
  }
  return context;
};
