export interface CashFlowQuery {
  from?: string;
  to?: string;
}

export interface CashFlowSummary {
  currency: "EUR";
  periodStart: string;
  periodEnd: string;
  inflow: number;
  outflow: number;
  netCashFlow: number;
  transferIn: number;
  transferOut: number;
  savingsRatePercentage: number | null;
  incomeCount: number;
  expenseCount: number;
}

export function getMonthDateRange(monthKey: string): {
  from: string;
  to: string;
} {
  const [year, month] = monthKey.split("-").map(Number);
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();

  return {
    from: `${monthKey}-01`,
    to: `${monthKey}-${String(lastDay).padStart(2, "0")}`,
  };
}
