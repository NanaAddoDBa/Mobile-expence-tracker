import React from "react";
import { Edit2, Landmark, Trash2 } from "lucide-react";
import { useFeedback } from "../../../app/providers/FeedbackProvider";
import { Badge } from "../../../components/ui/Badge";
import { EmptyState } from "../../../components/feedback/EmptyState";
import { IconButton } from "../../../components/ui/IconButton";
import {
  getPaymentMethodLabel,
  normalizePaymentMethod,
} from "../../../domain/expenses/expense.constants";
import type { Income } from "../../../domain/incomes/income.types";
import { formatCurrency } from "../../../lib/formatCurrency";
import { formatDate } from "../../../lib/formatDate";

interface IncomeTableProps {
  incomes: Income[];
  onEdit: (income: Income) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
}

export const IncomeTable: React.FC<IncomeTableProps> = ({
  incomes,
  onEdit,
  onDelete,
  onAdd,
}) => {
  const { confirmAction } = useFeedback();

  const requestDelete = async (income: Income) => {
    const confirmed = await confirmAction({
      title: "Delete income entry?",
      description: `This will remove ${income.source} from your income history.`,
      confirmLabel: "Delete",
      variant: "danger",
    });
    if (confirmed) onDelete(income.id);
  };

  if (incomes.length === 0) {
    return (
      <EmptyState
        icon={Landmark}
        title="No income entries found"
        description="Add income manually or import incoming bank transactions."
        actionText="Add Income"
        onAction={onAdd}
      />
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white shadow-xs dark:border-slate-800/80 dark:bg-slate-900">
      <div className="min-w-full divide-y divide-slate-100 dark:divide-slate-800/50">
        <div className="hidden items-center bg-slate-50/50 px-6 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 md:flex dark:bg-slate-800/10">
          <div className="flex-[2]">Source</div>
          <div className="flex-[1.2]">Category</div>
          <div className="flex-[1.2]">Date</div>
          <div className="flex-[1.2]">Payment type</div>
          <div className="flex-1 text-right">Amount</div>
          <div className="flex-1 text-center">Actions</div>
        </div>

        {incomes.map((income) => (
          <div
            key={income.id}
            className="flex flex-col px-6 py-4 transition-colors hover:bg-slate-50/50 md:flex-row md:items-center dark:hover:bg-slate-800/10"
          >
            <div className="flex-[2] overflow-hidden pr-2">
              <div className="flex items-center gap-2">
                <h3 className="truncate text-xs font-semibold text-slate-900 dark:text-slate-100">
                  {income.source}
                </h3>
                {income.isRecurring && <Badge tone="brand">Recurring</Badge>}
                <Badge tone="neutral">
                  {income.entrySource === "connected_account" ? "Bank import" : "Manual"}
                </Badge>
              </div>
              <p className="mt-0.5 truncate text-[10px] text-slate-400 dark:text-slate-500">
                {income.description || "Income entry"}
              </p>
            </div>
            <div className="mt-2 flex-[1.2] md:mt-0">
              <Badge tone={income.category === "Other" ? "neutral" : "success"}>
                {income.category}
              </Badge>
            </div>
            <div className="mt-2 flex-[1.2] text-xs font-medium text-slate-500 md:mt-0 dark:text-slate-400">
              {formatDate(income.date)}
            </div>
            <div className="mt-2 flex-[1.2] text-xs text-slate-500 md:mt-0 dark:text-slate-400">
              {getPaymentMethodLabel(normalizePaymentMethod(income.paymentMethod))}
            </div>
            <div className="mt-2 flex-1 text-left md:mt-0 md:text-right">
              <span className="font-mono text-sm font-bold text-emerald-700 dark:text-emerald-400">
                +{formatCurrency(income.amount)}
              </span>
            </div>
            <div className="mt-3 flex flex-1 items-center justify-end gap-1 md:mt-0">
              <IconButton label={`Edit ${income.source}`} onClick={() => onEdit(income)}>
                <Edit2 className="h-4 w-4" />
              </IconButton>
              <IconButton
                label={`Delete ${income.source}`}
                className="hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/20"
                onClick={() => void requestDelete(income)}
              >
                <Trash2 className="h-4 w-4" />
              </IconButton>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
