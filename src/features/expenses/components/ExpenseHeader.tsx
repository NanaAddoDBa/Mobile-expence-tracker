import React from "react";
import { Plus } from "lucide-react";

interface ExpenseHeaderProps {
  onAddExpense: () => void;
}

export const ExpenseHeader: React.FC<ExpenseHeaderProps> = ({ onAddExpense }) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h2 className="text-xl font-bold text-slate-950 dark:text-white tracking-tight">
          Expenses
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Add, search, and manage your expenses.
        </p>
      </div>

      <button
        onClick={onAddExpense}
        className="flex items-center gap-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 px-4 rounded-xl transition-all shadow-xs self-start sm:self-center cursor-pointer"
      >
        <Plus className="w-4 h-4" /> Add Expense
      </button>
    </div>
  );
};
