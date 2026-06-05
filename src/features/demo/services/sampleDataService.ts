import { INITIAL_ACCOUNTS } from "../../../data/mockAccounts";
import { INITIAL_BUDGETS } from "../../../data/mockBudgets";
import { INITIAL_EXPENSES } from "../../../data/mockExpenses";
import { INITIAL_GOALS } from "../../../data/mockGoals";
import { ConnectedAccount } from "../../../domain/accounts/account.types";
import { Budget } from "../../../domain/budgets/budget.types";
import { Expense } from "../../../domain/expenses/expense.types";
import { Goal } from "../../../domain/goals/goal.types";
import {
  addMonths,
  getCurrentIsoTimestamp,
  getCurrentMonthKey,
  getTodayDateString,
} from "../../../lib/dateUtils";
import { normalizeExpenseSource } from "../../expenses/services/expenseSourceService";

const SAMPLE_PREVIOUS_MONTH = "2026-05";
const SAMPLE_CURRENT_MONTH = "2026-06";

export interface SampleDataSet {
  expenses: Expense[];
  budgets: Budget[];
  goals: Goal[];
  accounts: ConnectedAccount[];
}

export function createSampleData(referenceDate: Date = new Date()): SampleDataSet {
  return {
    expenses: createSampleExpenses(referenceDate),
    budgets: createSampleBudgets(),
    goals: createSampleGoals(referenceDate),
    accounts: createSampleAccounts(referenceDate),
  };
}

export function createSampleExpenses(referenceDate: Date = new Date()): Expense[] {
  const currentMonthKey = getCurrentMonthKey(referenceDate);
  const previousMonthKey = getCurrentMonthKey(addMonths(referenceDate, -1));

  return INITIAL_EXPENSES.map((expense) =>
    normalizeExpenseSource({
      ...expense,
      date: remapSampleDate(expense.date, currentMonthKey, previousMonthKey),
    })
  );
}

export function createSampleBudgets(): Budget[] {
  return INITIAL_BUDGETS.map((budget) => ({ ...budget }));
}

export function createSampleAccounts(referenceDate: Date = new Date()): ConnectedAccount[] {
  const timestamp = getCurrentIsoTimestamp(referenceDate);

  return INITIAL_ACCOUNTS.map((account) => ({
    ...account,
    lastImportedAt: timestamp,
    consentGrantedAt: timestamp,
    lastConnectionCheckAt: timestamp,
  }));
}

export function createSampleGoals(referenceDate: Date = new Date()): Goal[] {
  return INITIAL_GOALS.map((goal, index) => ({
    ...goal,
    targetDate: getTargetDate(referenceDate, [2, 6, 4][index] ?? 3, index === 0 ? 15 : 28),
  }));
}

export function mergeSampleRecords<T extends { id: string }>(existing: T[], sample: T[]): T[] {
  const sampleIds = new Set(sample.map((record) => record.id));
  return [...sample, ...existing.filter((record) => !sampleIds.has(record.id))];
}

function remapSampleDate(dateString: string, currentMonthKey: string, previousMonthKey: string): string {
  if (dateString.startsWith(SAMPLE_CURRENT_MONTH)) {
    return `${currentMonthKey}-${dateString.slice(8, 10)}`;
  }

  if (dateString.startsWith(SAMPLE_PREVIOUS_MONTH)) {
    return `${previousMonthKey}-${dateString.slice(8, 10)}`;
  }

  return dateString;
}

function getTargetDate(referenceDate: Date, monthsAhead: number, preferredDay: number): string {
  const targetDate = addMonths(referenceDate, monthsAhead);
  const daysInTargetMonth = new Date(
    targetDate.getFullYear(),
    targetDate.getMonth() + 1,
    0
  ).getDate();

  targetDate.setDate(Math.min(preferredDay, daysInTargetMonth));
  return getTodayDateString(targetDate);
}
