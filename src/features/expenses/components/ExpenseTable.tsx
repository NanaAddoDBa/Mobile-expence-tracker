import React from "react";
import { Expense } from "../../../domain/expenses/expense.types";
import { useFeedback } from "../../../app/providers/FeedbackProvider";
import { ExpenseEmptyState } from "./ExpenseEmptyState";
import { ExpenseTableRow } from "./ExpenseTableRow";

interface ExpenseTableProps {
  filteredExpenses: Expense[];
  emptyStateDescription?: string;
  emptyStateTitle?: string;
  onEditClick: (exp: Expense) => void;
  onDeleteClick: (id: string) => void;
}

export const ExpenseTable: React.FC<ExpenseTableProps> = ({
  filteredExpenses,
  emptyStateDescription,
  emptyStateTitle,
  onEditClick,
  onDeleteClick,
}) => {
  const { confirmAction } = useFeedback();

  const handleDelete = async (expense: Expense) => {
    const confirmed = await confirmAction({
      title: "Delete expense?",
      description: `This will remove ${expense.merchant} from your expense list.`,
      confirmLabel: "Delete",
      variant: "danger",
    });

    if (confirmed) {
      onDeleteClick(expense.id);
    }
  };

  return (
    <div className="overflow-x-auto p-0 border border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900 rounded-2xl shadow-xs">
      {filteredExpenses.length === 0 ? (
        <ExpenseEmptyState
          title={emptyStateTitle}
          description={emptyStateDescription}
        />
      ) : (
        <div className="min-w-full divide-y divide-slate-100 dark:divide-slate-800/50">
          <div className="hidden md:flex bg-slate-50/50 dark:bg-slate-800/10 items-center px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            <div className="flex-[2] text-left">Merchant</div>
            <div className="flex-[1.2] text-left">Category</div>
            <div className="flex-[1.2] text-left">Date</div>
            <div className="flex-[1.2] text-left">Payment Type</div>
            <div className="flex-[1] text-right">Amount</div>
            <div className="flex-[1] text-center">Actions</div>
          </div>

          {filteredExpenses.map((expense) => (
            <ExpenseTableRow
              key={expense.id}
              expense={expense}
              onEditClick={onEditClick}
              onDeleteClick={(selectedExpense) => {
                void handleDelete(selectedExpense);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};
