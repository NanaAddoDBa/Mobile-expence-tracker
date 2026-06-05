import React from "react";
import { RecurringFrequency } from "../../../domain/expenses/expense.types";

interface RecurringExpenseFieldsProps {
  isRecurring: boolean;
  recurringFrequency: RecurringFrequency;
  onRecurringChange: (isRecurring: boolean) => void;
  onFrequencyChange: (frequency: RecurringFrequency) => void;
}

export const RecurringExpenseFields: React.FC<RecurringExpenseFieldsProps> = ({
  isRecurring,
  recurringFrequency,
  onRecurringChange,
  onFrequencyChange,
}) => {
  return (
    <>
      <div className="flex flex-col justify-center">
        <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
          Recurring Expense
        </span>
        <label className="relative inline-flex items-center cursor-pointer select-none py-2">
          <input
            type="checkbox"
            checked={isRecurring}
            onChange={(e) => onRecurringChange(e.target.checked)}
            className="h-4 w-4 rounded-sm border-slate-300 dark:border-slate-700 text-indigo-600 cursor-pointer"
          />
          <span className="ml-2.5 text-xs font-medium text-slate-700 dark:text-slate-300">
            Repeat this expense
          </span>
        </label>
      </div>

      {isRecurring && (
        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800 rounded-xl leading-relaxed">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
            Repeat
          </label>
          <select
            value={recurringFrequency}
            onChange={(e) => onFrequencyChange(e.target.value as RecurringFrequency)}
            className="w-full text-xs font-semibold px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 rounded-lg text-slate-950 dark:text-white"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>
      )}
    </>
  );
};
