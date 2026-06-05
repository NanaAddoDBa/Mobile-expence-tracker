import React from "react";
import { Target, CalendarDays, Coins, Edit2, Trash2 } from "lucide-react";
import { Goal } from "../../domain/goals/goal.types";
import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { formatCurrency } from "../../lib/formatCurrency";
import { formatDate } from "../../lib/formatDate";
import { useFeedback } from "../../app/providers/FeedbackProvider";

interface GoalCardProps {
  goal: Goal;
  metrics: {
    monthsRemaining: number;
    suggestedMonthly: number;
    remainingAmount: number;
  };
  percentage: number;
  onDepositOpen: (id: string) => void;
  onEditOpen: (id: string) => void;
  onDeleteClick: (id: string) => void;
}

export const GoalCard: React.FC<GoalCardProps> = ({
  goal,
  metrics,
  percentage,
  onDepositOpen,
  onEditOpen,
  onDeleteClick,
}) => {
  const { confirmAction } = useFeedback();

  const handleDelete = async () => {
    const confirmed = await confirmAction({
      title: "Delete goal?",
      description: `This will remove ${goal.name} from your savings goals.`,
      confirmLabel: "Delete",
      variant: "danger",
    });

    if (confirmed) {
      onDeleteClick(goal.id);
    }
  };

  return (
    <Card className="p-6 border border-slate-100 dark:border-slate-800">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-xl shrink-0">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
              {goal.name}
            </h4>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1.5 mt-1 leading-none font-medium">
              <CalendarDays className="w-3.5 h-3.5" />
              Target Date: {formatDate(goal.targetDate)} ({metrics.monthsRemaining} months remaining)
            </p>
          </div>
        </div>

        <Badge tone={percentage >= 100 ? "success" : "brand"}>
          {percentage >= 100 ? "Completed milestone!" : `${percentage.toFixed(0)}% Completed`}
        </Badge>
      </div>

      {/* Progress bar info */}
      <div className="space-y-1">
        <div className="flex justify-between items-baseline text-xs font-semibold">
          <span className="text-slate-500">Saved so far</span>
          <span className="text-slate-900 dark:text-white font-mono">
            {formatCurrency(goal.currentAmount)} of {formatCurrency(goal.targetAmount)}
          </span>
        </div>
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-300"
            style={{ width: `${Math.min(100, percentage)}%` }}
          />
        </div>
      </div>

      {/* Contribution projections */}
      <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/25 border border-slate-100 dark:border-slate-800/40 rounded-xl p-4 mt-5 text-xs">
        <div>
          <span className="text-[10px] text-slate-400 font-bold block uppercase leading-none">Suggested Monthly</span>
          <span className="text-sm font-bold text-slate-950 dark:text-white block mt-1.5 font-mono">
            {formatCurrency(metrics.suggestedMonthly)}/mo
          </span>
        </div>
        <div>
          <span className="text-[10px] text-slate-400 font-bold block uppercase leading-none">Remaining Margin</span>
          <span className="text-sm font-bold text-slate-950 dark:text-white block mt-1.5 font-mono">
            {formatCurrency(metrics.remainingAmount)} more
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between mt-5 pt-3 border-t border-slate-50 dark:border-slate-800/80">
        <div className="flex gap-2">
          <button
            onClick={() => onDepositOpen(goal.id)}
            className="flex items-center gap-1.5 py-1.5 px-3 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 hover:text-indigo-800 font-semibold rounded-xl text-[11px] transition-colors shrink-0 cursor-pointer"
          >
            <Coins className="w-3.5 h-3.5" /> Add Savings
          </button>
        </div>

        <div className="flex items-center gap-1 select-none">
          <button
            onClick={() => onEditOpen(goal.id)}
            className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg transition-colors cursor-pointer"
            title="Adjust goal limit"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              void handleDelete();
            }}
            className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg transition-colors cursor-pointer"
            title="Dismiss goal"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </Card>
  );
};
