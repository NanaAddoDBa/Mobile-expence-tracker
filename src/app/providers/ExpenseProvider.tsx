import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
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
import { expenseRepository } from "../../services/repositories/expenseRepository.mock";

export interface ExpenseContextType {
  expenses: Expense[];
  addExpense: (expense: Omit<Expense, "id">) => void;
  addImportedExpenses: (expenses: Omit<Expense, "id">[]) => Expense[];
  reloadExpenses: () => Expense[];
  loadSampleExpenses: () => Expense[];
  editExpense: (id: string, expense: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;
}

const ExpenseContext = createContext<ExpenseContextType | undefined>(undefined);

export const ExpenseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [expenses, setExpenses] = useState<Expense[]>(() => expenseRepository.getAll());
  const { budgets } = useBudgets();
  const { currentUser } = useMockAuth();
  const { addNotification } = useNotifications();

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
      addExpense(expenseData) {
        const sourceAwareExpense = expenseData.entrySource
          ? expenseData
          : createManualExpenseSource(expenseData);
        const added = expenseRepository.add(sourceAwareExpense);
        const nextExpenses = [added, ...expenses];
        setExpenses(nextExpenses);
        checkBudgetThresholds(nextExpenses, added.category);
      },
      addImportedExpenses(importedExpenseData) {
        const added = importedExpenseData.map((expenseData) => expenseRepository.add(expenseData));
        const nextExpenses = expenseRepository.getAll();
        setExpenses(nextExpenses);
        added.forEach((expense) => checkBudgetThresholds(nextExpenses, expense.category));
        return added;
      },
      reloadExpenses() {
        const nextExpenses = expenseRepository.getAll();
        setExpenses(nextExpenses);
        return nextExpenses;
      },
      loadSampleExpenses() {
        const sampleExpenses = createSampleExpenses();
        const nextExpenses = mergeSampleRecords(expenses, sampleExpenses);
        expenseRepository.saveAll(nextExpenses);
        setExpenses(nextExpenses);
        return sampleExpenses;
      },
      editExpense(id, updatedFields) {
        const nextExpenses = expenseRepository.update(id, updatedFields);
        setExpenses(nextExpenses);

        const edited = nextExpenses.find((expense) => expense.id === id);
        if (edited) {
          checkBudgetThresholds(nextExpenses, edited.category);
        }
      },
      deleteExpense(id) {
        const nextExpenses = expenseRepository.delete(id);
        setExpenses(nextExpenses);
      },
    };
  }, [expenses, checkBudgetThresholds]);

  return <ExpenseContext.Provider value={value}>{children}</ExpenseContext.Provider>;
};

export const useExpenses = () => {
  const context = useContext(ExpenseContext);
  if (context === undefined) {
    throw new Error("useExpenses must be used within an ExpenseProvider");
  }
  return context;
};
