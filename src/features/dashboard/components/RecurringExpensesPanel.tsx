import React from "react";
import { CalendarDays } from "lucide-react";
import { Badge } from "../../../components/ui/Badge";
import { Card } from "../../../components/ui/Card";
import { formatCurrency } from "../../../lib/formatCurrency";
import { formatDate } from "../../../lib/formatDate";
import { ForecastedExpense } from "../../../lib/recurringExpenseEngine";

interface RecurringExpensesPanelProps {
  forecasts: ForecastedExpense[];
}

export const RecurringExpensesPanel: React.FC<RecurringExpensesPanelProps> = ({ forecasts }) => {
  return (
    <div className="col-span-12 md:col-span-6 lg:col-span-4 self-stretch">
      <Card className="p-5 h-full">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-50 dark:border-slate-800">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest leading-none">
            Upcoming Expenses
          </span>
          <Badge tone="info">Planning only</Badge>
        </div>

        <div className="space-y-3">
          {forecasts.length === 0 ? (
            <p className="text-xs text-slate-400 dark:text-slate-500 py-10 text-center">
              No upcoming recurring expenses.
            </p>
          ) : (
            forecasts.map((forecast) => (
              <div key={forecast.id} className="flex items-start justify-between py-1 border-b border-slate-50/50 dark:border-slate-800/20 last:border-0">
                <div>
                  <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                    {forecast.merchant}
                  </h4>
                  <span className="text-[9px] text-slate-400 dark:text-slate-500 flex items-center gap-1.5 mt-1 leading-none">
                    <CalendarDays className="w-3 h-3 text-slate-400" />
                    On {formatDate(forecast.date)} ({forecast.frequency})
                  </span>
                </div>
                <div className="text-right flex-shrink-0 font-mono">
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 block">
                    {formatCurrency(forecast.amount)}
                  </span>
                  <span className="text-[8px] text-amber-500 dark:text-amber-400 uppercase font-bold tracking-wider leading-none mt-1 inline-block">
                    Forecast
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
};
