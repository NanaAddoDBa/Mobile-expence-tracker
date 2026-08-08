import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Budget } from "../../domain/budgets/budget.types";
import {
  createSampleBudgets,
  mergeSampleRecords,
} from "../../features/demo/services/sampleDataService";
import { budgetApi } from "../../services/api";
import { USES_HTTP_API } from "../../services/api/apiMode";
import { useMockAuth } from "./MockAuthProvider";

export interface BudgetContextType {
  budgets: Budget[];
  isLoading: boolean;
  errorMessage: string | null;
  addBudget: (budget: Omit<Budget, "id">) => Promise<void>;
  reloadBudgets: () => Promise<Budget[]>;
  loadSampleBudgets: () => Promise<Budget[]>;
  editBudget: (id: string, budget: Partial<Budget>) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
}

const BudgetContext = createContext<BudgetContextType | undefined>(undefined);

export const BudgetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { currentUser, isAuthenticated } = useMockAuth();

  const reloadBudgets = useCallback(async () => {
    if (USES_HTTP_API && !isAuthenticated) {
      setBudgets([]);
      return [];
    }

    if (USES_HTTP_API) {
      setIsLoading(true);
    }
    setErrorMessage(null);

    try {
      const nextBudgets = await budgetApi.listBudgets();
      setBudgets(nextBudgets);
      return nextBudgets;
    } catch {
      setErrorMessage("Could not load budgets from the backend.");
      setBudgets([]);
      return [];
    } finally {
      if (USES_HTTP_API) {
        setIsLoading(false);
      }
    }
  }, [isAuthenticated]);

  useEffect(() => {
    void reloadBudgets();
  }, [reloadBudgets, currentUser?.id]);

  const value = useMemo<BudgetContextType>(() => {
    return {
      budgets,
      isLoading,
      errorMessage,
      async addBudget(budgetData) {
        try {
          const added = await budgetApi.createBudget(budgetData);
          setBudgets((prev) => [...prev, added]);
          setErrorMessage(null);
        } catch {
          setErrorMessage("Could not save that budget.");
        }
      },
      reloadBudgets,
      async loadSampleBudgets() {
        const sampleBudgets = createSampleBudgets();
        const nextBudgets = mergeSampleRecords(budgets, sampleBudgets);
        try {
          await budgetApi.replaceBudgets(nextBudgets);
          setBudgets(await budgetApi.listBudgets());
          setErrorMessage(null);
        } catch {
          setErrorMessage("Could not load sample budgets.");
        }
        return sampleBudgets;
      },
      async editBudget(id, updatedFields) {
        try {
          const nextBudgets = await budgetApi.updateBudget(id, updatedFields);
          setBudgets(nextBudgets);
          setErrorMessage(null);
        } catch {
          setErrorMessage("Could not update that budget.");
        }
      },
      async deleteBudget(id) {
        try {
          const nextBudgets = await budgetApi.deleteBudget(id);
          setBudgets(nextBudgets);
          setErrorMessage(null);
        } catch {
          setErrorMessage("Could not delete that budget.");
        }
      },
    };
  }, [budgets, isLoading, errorMessage, reloadBudgets]);

  return <BudgetContext.Provider value={value}>{children}</BudgetContext.Provider>;
};

export const useBudgets = () => {
  const context = useContext(BudgetContext);
  if (context === undefined) {
    throw new Error("useBudgets must be used within a BudgetProvider");
  }
  return context;
};
