import React from "react";
import { Search } from "lucide-react";
import { getPaymentMethodLabel } from "../../../domain/expenses/expense.constants";
import { PaymentMethod } from "../../../domain/expenses/expense.types";
import { addMonths, getCurrentMonthKey, getMonthLabel } from "../../../lib/dateUtils";

interface ExpenseFilterToolbarProps {
  expenseQuery: string;
  setExpenseQuery: (q: string) => void;
  selectedCategory: string;
  setSelectedCategory: (c: string) => void;
  selectedPaymentMethod: string;
  setSelectedPaymentMethod: (p: string) => void;
  selectedMonth: string;
  setSelectedMonth: (m: string) => void;
  selectedRecurrence: string;
  setSelectedRecurrence: (r: string) => void;
  handleClearFilters: () => void;
  hasActiveFilters: boolean;
  categoryOptions: readonly string[];
  paymentMethods: readonly PaymentMethod[];
}

export const ExpenseFilterToolbar: React.FC<ExpenseFilterToolbarProps> = ({
  expenseQuery,
  setExpenseQuery,
  selectedCategory,
  setSelectedCategory,
  selectedPaymentMethod,
  setSelectedPaymentMethod,
  selectedMonth,
  setSelectedMonth,
  selectedRecurrence,
  setSelectedRecurrence,
  handleClearFilters,
  hasActiveFilters,
  categoryOptions,
  paymentMethods,
}) => {
  const today = new Date();
  const currentMonthKey = getCurrentMonthKey(today);
  const prevMonthKey = getCurrentMonthKey(addMonths(today, -1));

  const currentMonthLabel = getMonthLabel(currentMonthKey);
  const prevMonthLabel = getMonthLabel(prevMonthKey);

  return (
    <div className="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <Search className="w-3.5 h-3.5" />
          </span>
          <input
            type="text"
            placeholder="Filter expenses..."
            value={expenseQuery}
            onChange={(e) => setExpenseQuery(e.target.value)}
            className="w-full text-xs font-semibold pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-950 dark:text-white placeholder-slate-400 focus:outline-hidden"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="text-xs font-semibold px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-200"
        >
          <option value="All">All Categories</option>
          {categoryOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>

        <select
          value={selectedPaymentMethod}
          onChange={(e) => setSelectedPaymentMethod(e.target.value)}
          className="text-xs font-semibold px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-200"
        >
          <option value="All">All Payment Types</option>
          {paymentMethods.map((paymentMethod) => (
            <option key={paymentMethod} value={paymentMethod}>
              {getPaymentMethodLabel(paymentMethod)}
            </option>
          ))}
        </select>

        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="text-xs font-semibold px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-200"
        >
          <option value="All">All Dates</option>
          <option value={currentMonthKey}>{currentMonthLabel}</option>
          <option value={prevMonthKey}>{prevMonthLabel}</option>
        </select>

        <select
          value={selectedRecurrence}
          onChange={(e) => setSelectedRecurrence(e.target.value)}
          className="text-xs font-semibold px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-200"
        >
          <option value="All">All Expenses</option>
          <option value="Recurring">Recurring Only</option>
          <option value="Non-recurring">One-time Only</option>
        </select>
      </div>

      {hasActiveFilters && (
        <div className="flex justify-end mt-3">
          <button
            onClick={handleClearFilters}
            className="text-[10px] font-bold text-red-500 hover:text-red-600 transition-colors uppercase tracking-wider"
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
};
