import { expenseRepository } from "../repositories/expenseRepository.mock";
import { incomeRepository } from "../repositories/incomeRepository.mock";
import type { CashFlowApi } from "./api.types";
import { USES_HTTP_API } from "./apiMode";
import { requestJson } from "./httpClient";

interface CashFlowSummaryResponse {
  data: {
    summary: {
      currency: "EUR";
      periodStart: string;
      periodEnd: string;
      inflowMinor: number;
      outflowMinor: number;
      netCashFlowMinor: number;
      transferInMinor: number;
      transferOutMinor: number;
      savingsRatePercentage: number | null;
      incomeCount: number;
      expenseCount: number;
    };
  };
}

const mockCashFlowApi: CashFlowApi = {
  async getSummary(query = {}) {
    const periodStart = query.from ?? "0000-01-01";
    const periodEnd = query.to ?? "9999-12-31";
    const incomes = incomeRepository
      .getAll()
      .filter((income) => isWithinPeriod(income.date, periodStart, periodEnd));
    const expenses = expenseRepository
      .getAll()
      .filter((expense) => isWithinPeriod(expense.date, periodStart, periodEnd));
    const transferIn = sumAmounts(
      incomes.filter((income) => income.category === "Transfers"),
    );
    const transferOut = sumAmounts(
      expenses.filter((expense) => expense.category === "Transfers"),
    );
    const includedIncome = incomes.filter((income) => income.category !== "Transfers");
    const includedExpenses = expenses.filter(
      (expense) => expense.category !== "Transfers",
    );
    const inflow = sumAmounts(includedIncome);
    const outflow = sumAmounts(includedExpenses);
    const netCashFlow = roundMoney(inflow - outflow);

    return {
      currency: "EUR",
      periodStart,
      periodEnd,
      inflow,
      outflow,
      netCashFlow,
      transferIn,
      transferOut,
      savingsRatePercentage:
        inflow === 0 ? null : Math.round((netCashFlow / inflow) * 1000) / 10,
      incomeCount: includedIncome.length,
      expenseCount: includedExpenses.length,
    };
  },
};

const httpCashFlowApi: CashFlowApi = {
  async getSummary(query = {}) {
    const search = new URLSearchParams();
    if (query.from) search.set("from", query.from);
    if (query.to) search.set("to", query.to);
    const suffix = search.size > 0 ? `?${search.toString()}` : "";
    const response = await requestJson<CashFlowSummaryResponse>(
      `/cash-flow/summary${suffix}`,
    );
    const summary = response.data.summary;

    return {
      currency: summary.currency,
      periodStart: summary.periodStart,
      periodEnd: summary.periodEnd,
      inflow: summary.inflowMinor / 100,
      outflow: summary.outflowMinor / 100,
      netCashFlow: summary.netCashFlowMinor / 100,
      transferIn: summary.transferInMinor / 100,
      transferOut: summary.transferOutMinor / 100,
      savingsRatePercentage: summary.savingsRatePercentage,
      incomeCount: summary.incomeCount,
      expenseCount: summary.expenseCount,
    };
  },
};

export const cashFlowApi: CashFlowApi = USES_HTTP_API
  ? httpCashFlowApi
  : mockCashFlowApi;

function isWithinPeriod(date: string, from: string, to: string): boolean {
  return date >= from && date <= to;
}

function sumAmounts(items: Array<{ amount: number }>): number {
  return roundMoney(items.reduce((total, item) => total + item.amount, 0));
}

function roundMoney(value: number): number {
  return Number(value.toFixed(2));
}
