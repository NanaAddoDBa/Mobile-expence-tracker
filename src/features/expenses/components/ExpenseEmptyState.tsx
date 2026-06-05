import React from "react";
import { History } from "lucide-react";

interface ExpenseEmptyStateProps {
  title?: string;
  description?: string;
}

export const ExpenseEmptyState: React.FC<ExpenseEmptyStateProps> = ({
  title = "No expenses yet",
  description = "Add your first expense, scan a receipt, or connect a mock account.",
}) => {
  return (
    <div className="text-center py-16 px-4">
      <History className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
      <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
        {title}
      </h4>
      <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1 leading-normal">
        {description}
      </p>
    </div>
  );
};
