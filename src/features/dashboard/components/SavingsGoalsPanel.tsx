import React from "react";
import { Card } from "../../../components/ui/Card";
import { Goal } from "../../../domain/goals/goal.types";
import { formatCurrency } from "../../../lib/formatCurrency";

interface SavingsGoalsPanelProps {
  goals: Goal[];
  onViewGoals: () => void;
}

export const SavingsGoalsPanel: React.FC<SavingsGoalsPanelProps> = ({
  goals,
  onViewGoals,
}) => {
  return (
    <div className="col-span-12 lg:col-span-4 self-stretch">
      <Card className="p-5 h-full">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 mb-4">
          <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider leading-none">
            Savings Goals
          </h4>
          <button
            onClick={onViewGoals}
            className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
          >
            Goals
          </button>
        </div>

        <div className="space-y-4">
          {goals.length === 0 ? (
            <div className="text-center py-6 text-xs text-slate-400">
              No savings goals yet.
            </div>
          ) : (
            goals.map((goal) => {
              const percent = Math.min(100, goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0);
              return (
                <div key={goal.id} className="space-y-1.5 p-3.5 bg-slate-50 dark:bg-slate-800/20 border border-slate-50 dark:border-slate-800 rounded-xl">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {goal.name}
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white font-mono">
                      {percent.toFixed(0)}%
                    </span>
                  </div>

                  <div className="w-full bg-slate-100 dark:bg-slate-800/60 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${percent}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>{formatCurrency(goal.currentAmount)} saved</span>
                    <span>{formatCurrency(goal.targetAmount)} target</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>
    </div>
  );
};
