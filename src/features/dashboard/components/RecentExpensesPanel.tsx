import React from "react";
import { Card } from "../../../components/ui/Card";
import { Expense } from "../../../domain/expenses/expense.types";
import { formatCurrency } from "../../../lib/formatCurrency";
import { formatDate } from "../../../lib/formatDate";

interface RecentExpensesPanelProps {
  recentExpenses: Expense[];
  onViewExpenses: () => void;
}

export const RecentExpensesPanel: React.FC<RecentExpensesPanelProps> = ({
  recentExpenses,
  onViewExpenses,
}) => {
  return (
    <div className="col-span-12 md:col-span-6 lg:col-span-4 self-stretch">
      <Card className="p-5 h-full">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-50 dark:border-slate-800">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest leading-none">
            Recent Expenses
          </span>
          <button
            onClick={onViewExpenses}
            className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
          >
            Expenses
          </button>
        </div>

        <div className="space-y-3">
          {recentExpenses.length === 0 ? (
            <p className="text-xs text-slate-400 dark:text-slate-500 py-10 text-center">
              No expenses yet.
            </p>
          ) : (
            recentExpenses.map((expense) => (
              <div key={expense.id} className="flex items-center justify-between py-1.5 border-b border-slate-50/50 dark:border-slate-800/20 last:border-0">
                <div className="overflow-hidden pr-2">
                  <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                    {expense.merchant}
                  </h4>
                  <span className="text-[9px] text-slate-400 dark:text-slate-500 block leading-none mt-1">
                    {expense.category} {"\u2022"} {formatDate(expense.date)}
                  </span>
                </div>
                <span className="text-xs font-bold text-slate-900 dark:text-white flex-shrink-0 font-mono">
                  {formatCurrency(expense.amount)}
                </span>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
};
