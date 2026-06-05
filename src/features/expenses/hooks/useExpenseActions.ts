import { useState } from "react";
import { Expense } from "../../../domain/expenses/expense.types";
import { ExpenseFormSubmitPayload } from "../types/expenseForm.types";

interface UseExpenseActionsOptions {
  addExpense: (expense: ExpenseFormSubmitPayload) => void;
  editExpense: (id: string, expense: ExpenseFormSubmitPayload) => void;
}

export function useExpenseActions({ addExpense, editExpense }: UseExpenseActionsOptions) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const openAddExpense = () => {
    setIsAddOpen(true);
  };

  const closeAddExpense = () => {
    setIsAddOpen(false);
  };

  const openEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setIsEditOpen(true);
  };

  const closeEditExpense = () => {
    setIsEditOpen(false);
    setEditingExpense(null);
  };

  const submitNewExpense = (data: ExpenseFormSubmitPayload) => {
    addExpense(data);
    closeAddExpense();
  };

  const submitEditedExpense = (data: ExpenseFormSubmitPayload) => {
    if (editingExpense) {
      editExpense(editingExpense.id, data);
    }
    closeEditExpense();
  };

  return {
    isAddOpen,
    isEditOpen,
    editingExpense,
    openAddExpense,
    closeAddExpense,
    openEditExpense,
    closeEditExpense,
    submitNewExpense,
    submitEditedExpense,
  };
}
