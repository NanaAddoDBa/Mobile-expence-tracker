import React from "react";
import { AlertTriangle } from "lucide-react";
import { BudgetStatusDetail } from "../../../domain/budgets/budget.types";
import { formatCurrency } from "../../../lib/formatCurrency";

interface OverspendingAlertsPanelProps {
  overspendingCategories: BudgetStatusDetail[];
  nearLimitCategories: BudgetStatusDetail[];
}

export const OverspendingAlertsPanel: React.FC<OverspendingAlertsPanelProps> = ({
  overspendingCategories,
  nearLimitCategories,
}) => {
  if (overspendingCategories.length === 0 && nearLimitCategories.length === 0) {
    return null;
  }

  return (
    <div className="bg-rose-50 dark:bg-rose-950/15 border border-rose-100 dark:border-rose-900/30 rounded-2xl p-5 flex items-start gap-4 shadow-sm animate-fade-in">
      <div className="p-2 bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 rounded-xl flex-shrink-0 animate-pulse">
        <AlertTriangle className="w-5 h-5" />
      </div>
      <div>
        <h4 className="text-xs font-bold text-rose-800 dark:text-rose-400 tracking-tight">
          Overspending Alert
        </h4>
        <ul className="list-disc pl-4 text-[11px] text-rose-700 dark:text-rose-300 mt-2 space-y-1.5 leading-relaxed">
          {overspendingCategories.map((category) => (
            <li key={category.category}>
              Your <span className="font-semibold">{category.category}</span> budget limit is exceeded by{" "}
              <span className="font-semibold">{formatCurrency(Math.abs(category.remainingAmount))}</span> (
              {category.spentAmount.toFixed(0)}{"\u20ac"} used vs {category.limitAmount.toFixed(0)}{"\u20ac"} max).
            </li>
          ))}
          {nearLimitCategories.map((category) => (
            <li key={category.category}>
              Heads up: <span className="font-semibold">{category.category}</span> has used {category.percentageUsed.toFixed(0)}% of its budget ({category.spentAmount.toFixed(0)}{"\u20ac"} spent so far).
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
