import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Expense } from "../../domain/expenses/expense.types";
import { useBudgets } from "./BudgetProvider";
import { useMockAuth } from "./MockAuthProvider";
import { useNotifications } from "./NotificationProvider";
import { budgetCalculationService } from "../../features/budgets/services/budgetCalculationService";
import {
  createSampleExpenses,
  mergeSampleRecords,
} from "../../features/demo/services/sampleDataService";
import { createManualExpenseSource } from "../../features/expenses/services/expenseSourceService";
import { notificationService } from "../../features/notifications/services/notificationService";
import { getCurrentMonthKey } from "../../lib/dateUtils";
import { expenseApi } from "../../services/api";
import { USES_HTTP_API } from "../../services/api/apiMode";

export interface ExpenseContextType {
  expenses: Expense[];
  isLoading: boolean;
  errorMessage: string | null;
  addExpense: (expense: Omit<Expense, "id">) => Promise<void>;
  addImportedExpenses: (expenses: Omit<Expense, "id">[]) => Promise<Expense[]>;
  reloadExpenses: () => Promise<Expense[]>;
  loadSampleExpenses: () => Promise<Expense[]>;
  editExpense: (id: string, expense: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
}

const ExpenseContext = createContext<ExpenseContextType | undefined>(undefined);

export const ExpenseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { budgets } = useBudgets();
  const { currentUser, isAuthenticated } = useMockAuth();
  const { addNotification } = useNotifications();

  const reloadExpenses = useCallback(async () => {
    if (USES_HTTP_API && !isAuthenticated) {
      setExpenses([]);
      return [];
    }

    if (USES_HTTP_API) {
      setIsLoading(true);
    }
    setErrorMessage(null);

    try {
      const nextExpenses = await expenseApi.listExpenses();
      setExpenses(nextExpenses);
      return nextExpenses;
    } catch {
      setErrorMessage("Could not load expenses from the backend.");
      setExpenses([]);
      return [];
    } finally {
      if (USES_HTTP_API) {
        setIsLoading(false);
      }
    }
  }, [isAuthenticated]);

  useEffect(() => {
    void reloadExpenses();
  }, [reloadExpenses, currentUser?.id]);

  const checkBudgetThresholds = useCallback((updatedExpenses: Expense[], addedCategory: string) => {
    if (!currentUser?.notifications.enableAlerts) return;

    const currentYearMonth = getCurrentMonthKey();
    const usageDetails = budgetCalculationService.getBudgetUsageForMonth(
      updatedExpenses,
      budgets,
      currentYearMonth
    );
    const target = usageDetails.find(
      (usage) => usage.category.toLowerCase() === addedCategory.toLowerCase()
    );
    const notification = notificationService.getBudgetThresholdNotification(
      target,
      currentUser.notifications.budgetThreshold
    );

    if (notification) {
      addNotification(notification);
    }
  }, [addNotification, budgets, currentUser]);

  const value = useMemo<ExpenseContextType>(() => {
    return {
      expenses,
      isLoading,
      errorMessage,
      async addExpense(expenseData) {
        const sourceAwareExpense = expenseData.entrySource
          ? expenseData
          : createManualExpenseSource(expenseData);
        try {
          const added = await expenseApi.createExpense(sourceAwareExpense);
          const nextExpenses = await expenseApi.listExpenses();
          setExpenses(nextExpenses);
          setErrorMessage(null);
          checkBudgetThresholds(nextExpenses, added.category);
        } catch {
          setErrorMessage("Could not save that expense.");
        }
      },
      async addImportedExpenses(importedExpenseData) {
        try {
          const added = await expenseApi.createImportedExpenses(importedExpenseData);
          const nextExpenses = await expenseApi.listExpenses();
          setExpenses(nextExpenses);
          setErrorMessage(null);
          added.forEach((expense) => checkBudgetThresholds(nextExpenses, expense.category));
          return added;
        } catch {
          setErrorMessage("Could not import expenses.");
          return [];
        }
      },
      reloadExpenses,
      async loadSampleExpenses() {
        const sampleExpenses = createSampleExpenses();
        const nextExpenses = mergeSampleRecords(expenses, sampleExpenses);
        try {
          await expenseApi.replaceExpenses(nextExpenses);
          setExpenses(await expenseApi.listExpenses());
          setErrorMessage(null);
        } catch {
          setErrorMessage("Could not load sample expenses.");
        }
        return sampleExpenses;
      },
      async editExpense(id, updatedFields) {
        try {
          const nextExpenses = await expenseApi.updateExpense(id, updatedFields);
          setExpenses(nextExpenses);
          setErrorMessage(null);

          const edited = nextExpenses.find((expense) => expense.id === id);
          if (edited) {
            checkBudgetThresholds(nextExpenses, edited.category);
          }
        } catch {
          setErrorMessage("Could not update that expense.");
        }
      },
      async deleteExpense(id) {
        try {
          const nextExpenses = await expenseApi.deleteExpense(id);
          setExpenses(nextExpenses);
          setErrorMessage(null);
        } catch {
          setErrorMessage("Could not delete that expense.");
        }
      },
    };
  }, [expenses, isLoading, errorMessage, checkBudgetThresholds, reloadExpenses]);

  return <ExpenseContext.Provider value={value}>{children}</ExpenseContext.Provider>;
};

export const useExpenses = () => {
  const context = useContext(ExpenseContext);
  if (context === undefined) {
    throw new Error("useExpenses must be used within an ExpenseProvider");
  }
  return context;
};
