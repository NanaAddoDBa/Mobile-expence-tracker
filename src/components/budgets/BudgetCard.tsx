import React from "react";
import { Edit2, Trash2 } from "lucide-react";
import { BudgetStatusDetail } from "../../domain/budgets/budget.types";
import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { formatCurrency } from "../../lib/formatCurrency";
import { useFeedback } from "../../app/providers/FeedbackProvider";

interface BudgetCardProps {
  budgetDetail: BudgetStatusDetail;
  budgetId: string;
  onEditClick: (id: string, cat: string, limit: number) => void;
  onDeleteClick: (id: string) => void;
}

export const BudgetCard: React.FC<BudgetCardProps> = ({
  budgetDetail,
  budgetId,
  onEditClick,
  onDeleteClick,
}) => {
  const { confirmAction } = useFeedback();
  const isOver = budgetDetail.status === "Over Budget";
  const isWarning = budgetDetail.status === "Warning";

  const handleDelete = async () => {
    const confirmed = await confirmAction({
      title: "Delete budget?",
      description: `This will remove the ${budgetDetail.category} budget.`,
      confirmLabel: "Delete",
      variant: "danger",
    });

    if (confirmed) {
      onDeleteClick(budgetId);
    }
  };

  return (
    <Card
      className={`relative p-5 flex flex-col justify-between border ${
        isOver
          ? "border-rose-100 dark:border-rose-950/40 bg-white dark:bg-slate-900"
          : isWarning
          ? "border-amber-100 dark:border-amber-950/20 bg-white dark:bg-slate-900"
          : "border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900"
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-none">
            {budgetDetail.category}
          </h4>
          <span className="text-[10px] text-slate-400 mt-1 block">
            {budgetDetail.period.charAt(0).toUpperCase() + budgetDetail.period.slice(1)} category budget
          </span>
        </div>

        <div className="flex gap-1.5 items-center select-none">
          <button
            onClick={() => onEditClick(budgetId, budgetDetail.category, budgetDetail.limitAmount)}
            className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
            title="Edit limit"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              void handleDelete();
            }}
            className="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/25 rounded-md transition-colors cursor-pointer"
            title="Delete budget"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Progress slider bar section */}
      <div className="mt-4 space-y-2">
        <div className="flex justify-between text-[11px] font-semibold text-slate-500">
          <span>{formatCurrency(budgetDetail.spentAmount)} spent</span>
          <span>{formatCurrency(budgetDetail.limitAmount)} limit</span>
        </div>

        <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              isOver ? "bg-rose-500" : isWarning ? "bg-amber-500" : "bg-emerald-500"
            }`}
            style={{ width: `${Math.min(budgetDetail.percentageUsed, 100)}%` }}
          />
        </div>

        <div className="flex justify-between items-center pt-1.5">
          <span className="text-[10px] font-bold font-mono">
            {budgetDetail.percentageUsed.toFixed(0)}% used
          </span>
          {isOver ? (
            <Badge tone="error">Exceeded</Badge>
          ) : isWarning ? (
            <Badge tone="warning">Critical</Badge>
          ) : (
            <Badge tone="success">In target</Badge>
          )}
        </div>
      </div>
    </Card>
  );
};
