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

export interface ExpenseContextType {
  expenses: Expense[];
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
  const { budgets } = useBudgets();
  const { currentUser } = useMockAuth();
  const { addNotification } = useNotifications();

  const reloadExpenses = useCallback(async () => {
    const nextExpenses = await expenseApi.listExpenses();
    setExpenses(nextExpenses);
    return nextExpenses;
  }, []);

  useEffect(() => {
    void reloadExpenses();
  }, [reloadExpenses]);

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
      async addExpense(expenseData) {
        const sourceAwareExpense = expenseData.entrySource
          ? expenseData
          : createManualExpenseSource(expenseData);
        const added = await expenseApi.createExpense(sourceAwareExpense);
        const nextExpenses = await expenseApi.listExpenses();
        setExpenses(nextExpenses);
        checkBudgetThresholds(nextExpenses, added.category);
      },
      async addImportedExpenses(importedExpenseData) {
        const added = await expenseApi.createImportedExpenses(importedExpenseData);
        const nextExpenses = await expenseApi.listExpenses();
        setExpenses(nextExpenses);
        added.forEach((expense) => checkBudgetThresholds(nextExpenses, expense.category));
        return added;
      },
      reloadExpenses,
      async loadSampleExpenses() {
        const sampleExpenses = createSampleExpenses();
        const nextExpenses = mergeSampleRecords(expenses, sampleExpenses);
        await expenseApi.replaceExpenses(nextExpenses);
        setExpenses(await expenseApi.listExpenses());
        return sampleExpenses;
      },
      async editExpense(id, updatedFields) {
        const nextExpenses = await expenseApi.updateExpense(id, updatedFields);
        setExpenses(nextExpenses);

        const edited = nextExpenses.find((expense) => expense.id === id);
        if (edited) {
          checkBudgetThresholds(nextExpenses, edited.category);
        }
      },
      async deleteExpense(id) {
        const nextExpenses = await expenseApi.deleteExpense(id);
        setExpenses(nextExpenses);
      },
    };
  }, [expenses, checkBudgetThresholds, reloadExpenses]);

  return <ExpenseContext.Provider value={value}>{children}</ExpenseContext.Provider>;
};

export const useExpenses = () => {
  const context = useContext(ExpenseContext);
  if (context === undefined) {
    throw new Error("useExpenses must be used within an ExpenseProvider");
  }
  return context;
};
