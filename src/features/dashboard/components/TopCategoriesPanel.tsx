import React from "react";
import { Card } from "../../../components/ui/Card";
import { formatCurrency } from "../../../lib/formatCurrency";
import { SpendingCategorySummary } from "../services/dashboardSummaryService";

interface TopCategoriesPanelProps {
  categoryRanking: SpendingCategorySummary[];
  totalBudgetSpent: number;
}

export const TopCategoriesPanel: React.FC<TopCategoriesPanelProps> = ({
  categoryRanking,
  totalBudgetSpent,
}) => {
  return (
    <div className="col-span-12 lg:col-span-4 self-stretch">
      <Card className="p-5 h-full flex flex-col justify-between">
        <div>
          <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-4 pb-2 border-b border-slate-100 dark:border-slate-800 leading-none">
            Spending Breakdown
          </h4>

          {categoryRanking.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 dark:text-slate-500">
              No category spending yet.
            </div>
          ) : (
            <div className="space-y-4">
              {categoryRanking.slice(0, 5).map((category) => {
                const categoryPercent = totalBudgetSpent > 0 ? (category.spentAmount / totalBudgetSpent) * 100 : 0;
                return (
                  <div key={category.category} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-700 dark:text-slate-300">{category.category}</span>
                      <span className="text-slate-900 dark:text-white font-mono">
                        {formatCurrency(category.spentAmount)} ({categoryPercent.toFixed(0)}%)
                      </span>
                    </div>

                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          category.category.toLowerCase().includes("house")
                            ? "bg-slate-500"
                            : category.category.toLowerCase().includes("food")
                            ? "bg-indigo-600"
                            : category.category.toLowerCase().includes("dining")
                            ? "bg-amber-500"
                            : category.category.toLowerCase().includes("transport")
                            ? "bg-sky-500"
                            : "bg-purple-500"
                        }`}
                        style={{ width: `${categoryPercent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
