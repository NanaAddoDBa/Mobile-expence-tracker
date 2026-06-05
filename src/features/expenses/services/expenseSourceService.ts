import { Expense, ExpenseEntrySource } from "../../../domain/expenses/expense.types";
import { normalizePaymentMethod } from "../../../domain/expenses/expense.constants";

export interface ExpenseSourceSummary {
  label: "Manual" | "Receipt" | "Imported" | "Recurring";
  entrySource: ExpenseEntrySource;
}

export function normalizeExpenseSource(expense: Expense): Expense {
  const paymentMethod = normalizePaymentMethod(expense.paymentMethod);

  if (expense.entrySource) {
    return {
      ...expense,
      paymentMethod,
    };
  }

  if (expense.externalTransactionId || expense.sourceAccountId) {
    return {
      ...expense,
      paymentMethod,
      entrySource: "connected_account",
      sourceAccountId: expense.sourceAccountId || expense.accountSource,
    };
  }

  if (expense.receiptId) {
    return {
      ...expense,
      paymentMethod,
      entrySource: "receipt_scan",
    };
  }

  return {
    ...expense,
    paymentMethod,
    entrySource: "manual",
  };
}

export function getExpenseSourceSummary(expense: Expense): ExpenseSourceSummary {
  const normalized = normalizeExpenseSource(expense);

  if (normalized.entrySource === "connected_account") {
    return { entrySource: "connected_account", label: "Imported" };
  }
  if (normalized.entrySource === "receipt_scan") {
    return { entrySource: "receipt_scan", label: "Receipt" };
  }
  if (normalized.entrySource === "recurring_forecast") {
    return { entrySource: "recurring_forecast", label: "Recurring" };
  }

  return { entrySource: "manual", label: "Manual" };
}

export function createManualExpenseSource<T extends Omit<Expense, "id">>(expense: T): T {
  return {
    entrySource: "manual",
    ...expense,
  };
}
