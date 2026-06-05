import { useState, useMemo } from "react";
import { Expense } from "../../../domain/expenses/expense.types";
import { expenseFilterService, ExpenseFilterOptions } from "../services/expenseFilterService";

type ExpenseFilterState = Pick<
  ExpenseFilterOptions,
  "category" | "paymentMethod" | "month" | "recurrence"
>;

interface UseExpenseFiltersOptions {
  query: string;
  setQuery: (query: string) => void;
}

export function useExpenseFilters(
  expenses: Expense[],
  { query, setQuery }: UseExpenseFiltersOptions
) {
  const [filters, setFilters] = useState<ExpenseFilterState>({
    category: "All",
    paymentMethod: "All",
    month: "All",
    recurrence: "All",
  });

  const filteredExpenses = useMemo(() => {
    return expenseFilterService.filter(expenses, {
      query,
      category: filters.category,
      paymentMethod: filters.paymentMethod,
      month: filters.month,
      recurrence: filters.recurrence,
    });
  }, [expenses, filters, query]);

  const setCategory = (category: string) => {
    setFilters((f) => ({ ...f, category }));
  };

  const setPaymentMethod = (paymentMethod: string) => {
    setFilters((f) => ({ ...f, paymentMethod }));
  };

  const setMonth = (month: string) => {
    setFilters((f) => ({ ...f, month }));
  };

  const setRecurrence = (recurrence: string) => {
    setFilters((f) => ({ ...f, recurrence }));
  };

  const resetFilters = () => {
    setQuery("");
    setFilters({
      category: "All",
      paymentMethod: "All",
      month: "All",
      recurrence: "All",
    });
  };

  const hasActiveFilters =
    !!query ||
    filters.category !== "All" ||
    filters.paymentMethod !== "All" ||
    filters.month !== "All" ||
    filters.recurrence !== "All";

  return {
    filters,
    filteredExpenses,
    setQuery,
    setCategory,
    setPaymentMethod,
    setMonth,
    setRecurrence,
    resetFilters,
    hasActiveFilters,
  };
}
