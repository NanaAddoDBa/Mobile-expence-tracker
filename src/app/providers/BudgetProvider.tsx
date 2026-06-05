import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Budget } from "../../domain/budgets/budget.types";
import {
  createSampleBudgets,
  mergeSampleRecords,
} from "../../features/demo/services/sampleDataService";
import { budgetApi } from "../../services/api";

export interface BudgetContextType {
  budgets: Budget[];
  addBudget: (budget: Omit<Budget, "id">) => Promise<void>;
  reloadBudgets: () => Promise<Budget[]>;
  loadSampleBudgets: () => Promise<Budget[]>;
  editBudget: (id: string, budget: Partial<Budget>) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
}

const BudgetContext = createContext<BudgetContextType | undefined>(undefined);

export const BudgetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [budgets, setBudgets] = useState<Budget[]>([]);

  const reloadBudgets = useCallback(async () => {
    const nextBudgets = await budgetApi.listBudgets();
    setBudgets(nextBudgets);
    return nextBudgets;
  }, []);

  useEffect(() => {
    void reloadBudgets();
  }, [reloadBudgets]);

  const value = useMemo<BudgetContextType>(() => {
    return {
      budgets,
      async addBudget(budgetData) {
        const added = await budgetApi.createBudget(budgetData);
        setBudgets((prev) => [...prev, added]);
      },
      reloadBudgets,
      async loadSampleBudgets() {
        const sampleBudgets = createSampleBudgets();
        const nextBudgets = mergeSampleRecords(budgets, sampleBudgets);
        await budgetApi.replaceBudgets(nextBudgets);
        setBudgets(await budgetApi.listBudgets());
        return sampleBudgets;
      },
      async editBudget(id, updatedFields) {
        const nextBudgets = await budgetApi.updateBudget(id, updatedFields);
        setBudgets(nextBudgets);
      },
      async deleteBudget(id) {
        const nextBudgets = await budgetApi.deleteBudget(id);
        setBudgets(nextBudgets);
      },
    };
  }, [budgets, reloadBudgets]);

  return <BudgetContext.Provider value={value}>{children}</BudgetContext.Provider>;
};

export const useBudgets = () => {
  const context = useContext(BudgetContext);
  if (context === undefined) {
    throw new Error("useBudgets must be used within a BudgetProvider");
  }
  return context;
};
