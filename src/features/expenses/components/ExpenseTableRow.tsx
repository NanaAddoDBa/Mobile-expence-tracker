import React from "react";
import { Edit2, Trash2 } from "lucide-react";
import { Badge } from "../../../components/ui/Badge";
import { getPaymentMethodLabel, normalizePaymentMethod } from "../../../domain/expenses/expense.constants";
import { Expense } from "../../../domain/expenses/expense.types";
import { formatCurrency } from "../../../lib/formatCurrency";
import { formatDate } from "../../../lib/formatDate";
import { getExpenseSourceSummary } from "../services/expenseSourceService";

interface ExpenseTableRowProps {
  expense: Expense;
  onEditClick: (expense: Expense) => void;
  onDeleteClick: (expense: Expense) => void;
}

export const ExpenseTableRow: React.FC<ExpenseTableRowProps> = ({
  expense,
  onEditClick,
  onDeleteClick,
}) => {
  const sourceLabel = getExpenseSourceSummary(expense).label;

  return (
    <div className="flex flex-col md:flex-row md:items-center px-6 py-4 border-b border-slate-100/40 dark:border-slate-800/20 last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors">
      <div className="flex-[2] flex items-center gap-3 overflow-hidden pr-2">
        <div className="hidden lg:flex p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg shrink-0 text-xs font-semibold tracking-wider w-8 h-8 items-center justify-center">
          {expense.merchant ? expense.merchant[0].toUpperCase() : "M"}
        </div>
        <div className="overflow-hidden leading-tight">
          <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate flex items-center gap-1.5">
            {expense.merchant}
            {expense.isRecurring && (
              <Badge tone="brand" className="scale-90">
                {expense.recurringFrequency || "monthly"}
              </Badge>
            )}
            <Badge tone="neutral" className="scale-90">
              {sourceLabel}
            </Badge>
          </h4>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 truncate block mt-0.5">
            {expense.description || "Manual expense"}
          </span>
        </div>
      </div>

      <div className="flex-[1.2] mt-2 md:mt-0 flex shrink-0 text-left">
        <span className="md:hidden text-[10px] font-bold uppercase text-slate-400 mr-2 self-center block">Category:</span>
        <Badge tone={expense.category === "Others" ? "neutral" : "brand"}>{expense.category}</Badge>
      </div>

      <div className="flex-[1.2] mt-1.5 md:mt-0 flex text-left text-xs font-medium text-slate-500 dark:text-slate-400 shrink-0">
        <span className="md:hidden text-[10px] font-bold uppercase text-slate-400 mr-2 self-center block">Date:</span>
        {formatDate(expense.date)}
      </div>

      <div className="flex-[1.2] mt-1 md:mt-0 flex md:text-left text-xs text-slate-500 dark:text-slate-400 shrink-0">
        <span className="md:hidden text-[10px] font-bold uppercase text-slate-400 mr-2 self-center block">Source:</span>
        <span className="truncate">
          {getPaymentMethodLabel(normalizePaymentMethod(expense.paymentMethod))}
        </span>
      </div>

      <div className="flex-[1] mt-2 md:mt-0 flex justify-between md:block shrink-0 text-right">
        <span className="md:hidden text-[10px] font-bold uppercase text-slate-400 self-center block">Amount:</span>
        <span className="text-sm font-bold text-slate-900 dark:text-white block font-mono">
          {formatCurrency(expense.amount)}
        </span>
      </div>

      <div className="flex-[1] flex items-center justify-end gap-2.5 mt-3 md:mt-0 select-none">
        <button
          onClick={() => onEditClick(expense)}
          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          title="Edit expense"
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => onDeleteClick(expense)}
          className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition-colors cursor-pointer"
          title="Delete expense"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
