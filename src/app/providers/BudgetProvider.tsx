import React, { createContext, useContext, useMemo, useState } from "react";
import { Budget } from "../../domain/budgets/budget.types";
import {
  createSampleBudgets,
  mergeSampleRecords,
} from "../../features/demo/services/sampleDataService";
import { budgetRepository } from "../../services/repositories/budgetRepository.mock";

export interface BudgetContextType {
  budgets: Budget[];
  addBudget: (budget: Omit<Budget, "id">) => void;
  reloadBudgets: () => Budget[];
  loadSampleBudgets: () => Budget[];
  editBudget: (id: string, budget: Partial<Budget>) => void;
  deleteBudget: (id: string) => void;
}

const BudgetContext = createContext<BudgetContextType | undefined>(undefined);

export const BudgetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [budgets, setBudgets] = useState<Budget[]>(() => budgetRepository.getAll());

  const value = useMemo<BudgetContextType>(() => {
    return {
      budgets,
      addBudget(budgetData) {
        const added = budgetRepository.add(budgetData);
        setBudgets((prev) => [...prev, added]);
      },
      reloadBudgets() {
        const nextBudgets = budgetRepository.getAll();
        setBudgets(nextBudgets);
        return nextBudgets;
      },
      loadSampleBudgets() {
        const sampleBudgets = createSampleBudgets();
        const nextBudgets = mergeSampleRecords(budgets, sampleBudgets);
        budgetRepository.saveAll(nextBudgets);
        setBudgets(nextBudgets);
        return sampleBudgets;
      },
      editBudget(id, updatedFields) {
        const nextBudgets = budgetRepository.update(id, updatedFields);
        setBudgets(nextBudgets);
      },
      deleteBudget(id) {
        const nextBudgets = budgetRepository.delete(id);
        setBudgets(nextBudgets);
      },
    };
  }, [budgets]);

  return <BudgetContext.Provider value={value}>{children}</BudgetContext.Provider>;
};

export const useBudgets = () => {
  const context = useContext(BudgetContext);
  if (context === undefined) {
    throw new Error("useBudgets must be used within a BudgetProvider");
  }
  return context;
};
