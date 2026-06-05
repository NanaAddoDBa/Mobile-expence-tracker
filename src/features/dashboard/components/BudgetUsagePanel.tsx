import React from "react";
import { Sparkles } from "lucide-react";

interface BudgetUsagePanelProps {
  budgetRecommendations: string[];
}

export const BudgetUsagePanel: React.FC<BudgetUsagePanelProps> = ({ budgetRecommendations }) => {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex-1">
      <div className="flex items-center gap-2 mb-4">
        <span className="p-1.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg">
          <Sparkles className="w-4.5 h-4.5" />
        </span>
        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
          Spending Insights
        </h4>
      </div>

      <div className="space-y-3">
        {budgetRecommendations.map((recommendation, index) => (
          <div
            key={index}
            className="p-3.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-100/50 dark:border-slate-800/40 rounded-xl text-xs text-slate-600 dark:text-slate-300 leading-relaxed"
          >
            {recommendation}
          </div>
        ))}
      </div>
    </div>
  );
};
