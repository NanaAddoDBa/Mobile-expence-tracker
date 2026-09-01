import React from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  CirclePercent,
  Scale,
} from "lucide-react";
import { Card } from "../../../components/ui/Card";
import type { CashFlowSummary } from "../../../domain/cash-flow/cashFlow.types";
import { formatCurrency } from "../../../lib/formatCurrency";

interface CashFlowSummaryCardsProps {
  summary: CashFlowSummary | null;
  isLoading?: boolean;
  errorMessage?: string | null;
  onViewIncome?: () => void;
}

export const CashFlowSummaryCards: React.FC<CashFlowSummaryCardsProps> = ({
  summary,
  isLoading = false,
  errorMessage,
  onViewIncome,
}) => {
  const netIsPositive = (summary?.netCashFlow ?? 0) >= 0;
  const values = [
    {
      label: "Income",
      value: summary ? formatCurrency(summary.inflow) : "--",
      detail: summary ? `${summary.incomeCount} inflow entries` : "Current period",
      icon: ArrowUpRight,
      iconClass: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400",
    },
    {
      label: "Expenses",
      value: summary ? formatCurrency(summary.outflow) : "--",
      detail: summary ? `${summary.expenseCount} outflow entries` : "Current period",
      icon: ArrowDownRight,
      iconClass: "bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400",
    },
    {
      label: "Net cash flow",
      value: summary ? formatCurrency(summary.netCashFlow) : "--",
      detail: summary
        ? netIsPositive
          ? "Income exceeds expenses"
          : "Expenses exceed income"
        : "Income minus expenses",
      icon: Scale,
      iconClass: netIsPositive
        ? "bg-sky-50 text-sky-600 dark:bg-sky-950/30 dark:text-sky-400"
        : "bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400",
    },
    {
      label: "Savings rate",
      value:
        summary?.savingsRatePercentage === null || !summary
          ? "--"
          : `${summary.savingsRatePercentage.toFixed(1)}%`,
      detail:
        summary?.savingsRatePercentage === null
          ? "Add income to calculate"
          : "Net cash flow as a share of income",
      icon: CirclePercent,
      iconClass: "bg-violet-50 text-violet-600 dark:bg-violet-950/30 dark:text-violet-400",
    },
  ];

  return (
    <div className="col-span-12 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-live="polite">
      {values.map((item) => {
        const Icon = item.icon;
        return (
          <Card key={item.label} className="min-h-36 p-5">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                {item.label}
              </span>
              <span className={`rounded-lg p-1.5 ${item.iconClass}`}>
                <Icon className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-4 font-mono text-2xl font-bold leading-none text-slate-950 dark:text-white">
              {isLoading ? "..." : item.value}
            </p>
            <p className="mt-2 text-[10px] text-slate-400 dark:text-slate-500">
              {errorMessage ?? item.detail}
            </p>
            {item.label === "Income" && onViewIncome && (
              <button
                type="button"
                onClick={onViewIncome}
                className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
              >
                View income <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
            )}
          </Card>
        );
      })}
    </div>
  );
};
