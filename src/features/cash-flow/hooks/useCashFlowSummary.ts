import { useCallback, useEffect, useState } from "react";
import { useExpenses } from "../../../app/providers/ExpenseProvider";
import { useIncomes } from "../../../app/providers/IncomeProvider";
import type {
  CashFlowQuery,
  CashFlowSummary,
} from "../../../domain/cash-flow/cashFlow.types";
import { cashFlowApi } from "../../../services/api";

export function useCashFlowSummary(query: CashFlowQuery = {}) {
  const { expenses } = useExpenses();
  const { incomes } = useIncomes();
  const [summary, setSummary] = useState<CashFlowSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const from = query.from;
  const to = query.to;

  const reload = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const nextSummary = await cashFlowApi.getSummary({ from, to });
      setSummary(nextSummary);
      return nextSummary;
    } catch {
      setSummary(null);
      setErrorMessage("Could not load cash-flow totals.");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [from, to]);

  useEffect(() => {
    void reload();
  }, [expenses, incomes, reload]);

  return { summary, isLoading, errorMessage, reload };
}
