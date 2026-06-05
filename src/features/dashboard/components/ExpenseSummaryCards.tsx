import React from "react";
import { ArrowUpRight, Compass, TrendingDown } from "lucide-react";
import { Badge } from "../../../components/ui/Badge";
import { Card } from "../../../components/ui/Card";
import { formatCurrency } from "../../../lib/formatCurrency";

interface ExpenseSummaryCardsProps {
  currentMonthName: string;
  currentMonthTotal: number;
  currentMonthExpensesCount: number;
  overallRemaining: number;
  totalBudgetLimit: number;
  totalBudgetSpent: number;
  overallPercentage: number;
  onViewExpenses: () => void;
  onViewBudgets: () => void;
}

export const ExpenseSummaryCards: React.FC<ExpenseSummaryCardsProps> = ({
  currentMonthName,
  currentMonthTotal,
  currentMonthExpensesCount,
  overallRemaining,
  totalBudgetLimit,
  totalBudgetSpent,
  overallPercentage,
  onViewExpenses,
  onViewBudgets,
}) => {
  return (
    <>
      <div className="col-span-12 md:col-span-6 lg:col-span-4">
        <Card className="flex flex-col justify-between h-full min-h-[170px] p-5">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 tracking-wider uppercase">
                Expenses ({currentMonthName})
              </span>
              <span className="p-1.5 bg-rose-50 dark:bg-rose-950/20 text-rose-500 dark:text-rose-400 rounded-lg">
                <TrendingDown className="w-4 h-4" />
              </span>
            </div>
            <h3 className="text-2xl font-bold text-slate-950 dark:text-white mt-4 tracking-tight leading-none font-mono">
              {formatCurrency(currentMonthTotal)}
            </h3>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2">
              Based on {currentMonthExpensesCount} expenses
            </p>
          </div>
          <div className="pt-4 border-t border-slate-50 dark:border-slate-800/80 mt-4 flex items-center justify-between text-xs font-medium text-indigo-600 dark:text-indigo-400">
            <button onClick={onViewExpenses} className="hover:underline flex items-center gap-1 cursor-pointer">
              View expenses <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </Card>
      </div>

      <div className="col-span-12 md:col-span-6 lg:col-span-4">
        <Card className="flex flex-col justify-between h-full min-h-[170px] p-5">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 tracking-wider uppercase">
                Budget Left
              </span>
              <span className="p-1.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 dark:text-emerald-400 rounded-lg">
                <Compass className="w-4 h-4" />
              </span>
            </div>
            <h3 className="text-2xl font-bold text-slate-950 dark:text-white mt-4 tracking-tight leading-none font-mono">
              {formatCurrency(overallRemaining)}
            </h3>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2">
              Of {formatCurrency(totalBudgetLimit)} monthly budget
            </p>
          </div>
          <div className="pt-4 border-t border-slate-50 dark:border-slate-800/80 mt-4 flex items-center justify-between text-xs font-medium text-indigo-600 dark:text-indigo-400">
            <button onClick={onViewBudgets} className="hover:underline flex items-center gap-1 cursor-pointer">
              View budgets <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </Card>
      </div>

      <div className="col-span-12 md:col-span-12 lg:col-span-4">
        <Card className="flex flex-col justify-between h-full min-h-[170px] p-5">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 tracking-wider uppercase">
                Budget Progress
              </span>
              <Badge tone={overallPercentage >= 100 ? "error" : overallPercentage >= 80 ? "warning" : "success"}>
                {overallPercentage >= 100 ? "Over Budget" : overallPercentage >= 80 ? "Near Limit" : "On Track"}
              </Badge>
            </div>

            <div className="mt-4">
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-2xl font-bold text-slate-950 dark:text-white tracking-tight leading-none font-mono">
                  {overallPercentage.toFixed(0)}%
                </span>
                <span className="text-[10px] text-slate-400 font-semibold uppercase">
                  {formatCurrency(totalBudgetSpent)} Spent
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden mt-2">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    overallPercentage >= 100
                      ? "bg-rose-500"
                      : overallPercentage >= 80
                      ? "bg-amber-500"
                      : "bg-indigo-600 dark:bg-indigo-500"
                  }`}
                  style={{ width: `${Math.min(100, overallPercentage)}%` }}
                />
              </div>
            </div>
          </div>
          <div className="pt-2" />
        </Card>
      </div>
    </>
  );
};
