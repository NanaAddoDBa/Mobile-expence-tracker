import React, { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { useIncomes } from "../../app/providers/IncomeProvider";
import { ErrorState } from "../../components/feedback/ErrorState";
import { LoadingState } from "../../components/feedback/LoadingState";
import { Button } from "../../components/ui/Button";
import { getMonthDateRange } from "../../domain/cash-flow/cashFlow.types";
import { INCOME_CATEGORY_OPTIONS } from "../../domain/incomes/income.constants";
import type { Income } from "../../domain/incomes/income.types";
import { getCurrentMonthKey, getMonthLabel } from "../../lib/dateUtils";
import { CashFlowSummaryCards } from "../cash-flow/components/CashFlowSummaryCards";
import { useCashFlowSummary } from "../cash-flow/hooks/useCashFlowSummary";
import { IncomeFormModal } from "./components/IncomeFormModal";
import { IncomeTable } from "./components/IncomeTable";

export const IncomeLedgerView: React.FC = () => {
  const {
    incomes,
    isLoading,
    errorMessage,
    addIncome,
    editIncome,
    deleteIncome,
    reloadIncomes,
  } = useIncomes();
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthKey());
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState<Income | null>(null);
  const range = getMonthDateRange(selectedMonth);
  const cashFlow = useCashFlowSummary(range);

  const visibleIncomes = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return incomes.filter((income) => {
      const matchesMonth = income.date.startsWith(selectedMonth);
      const matchesCategory = category === "all" || income.category === category;
      const matchesQuery =
        !normalizedQuery ||
        income.source.toLowerCase().includes(normalizedQuery) ||
        income.description.toLowerCase().includes(normalizedQuery) ||
        income.notes?.toLowerCase().includes(normalizedQuery);
      return matchesMonth && matchesCategory && matchesQuery;
    });
  }, [category, incomes, query, selectedMonth]);

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingIncome(null);
  };

  const submitIncome = (income: Omit<Income, "id">) => {
    if (editingIncome) {
      void editIncome(editingIncome.id, income);
    } else {
      void addIncome(income);
    }
    closeForm();
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-950 dark:text-white">Income</h2>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Track inflows and review your cash position for {getMonthLabel(selectedMonth)}.
          </p>
        </div>
        <Button onClick={() => setIsFormOpen(true)} className="self-start sm:self-center">
          <Plus className="h-4 w-4" /> Add Income
        </Button>
      </header>

      <CashFlowSummaryCards
        summary={cashFlow.summary}
        isLoading={cashFlow.isLoading}
        errorMessage={cashFlow.errorMessage}
      />

      <div className="grid grid-cols-1 gap-3 rounded-2xl border border-slate-100 bg-white p-4 md:grid-cols-[minmax(0,1fr)_180px_180px] dark:border-slate-800/80 dark:bg-slate-900">
        <label className="relative">
          <span className="sr-only">Search income</span>
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search source or description"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </label>
        <label>
          <span className="sr-only">Income category</span>
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          >
            <option value="all">All categories</option>
            {INCOME_CATEGORY_OPTIONS.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </label>
        <label>
          <span className="sr-only">Cash-flow month</span>
          <input
            type="month"
            value={selectedMonth}
            onChange={(event) => setSelectedMonth(event.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </label>
      </div>

      {isLoading && <LoadingState label="Loading income..." />}
      {errorMessage && !isLoading && (
        <ErrorState message={errorMessage} onRetry={() => void reloadIncomes()} />
      )}
      {!isLoading && !errorMessage && (
        <IncomeTable
          incomes={visibleIncomes}
          onAdd={() => setIsFormOpen(true)}
          onEdit={(income) => {
            setEditingIncome(income);
            setIsFormOpen(true);
          }}
          onDelete={(id) => void deleteIncome(id)}
        />
      )}

      <IncomeFormModal
        isOpen={isFormOpen}
        onClose={closeForm}
        onSubmit={submitIncome}
        initialData={editingIncome}
      />
    </div>
  );
};
