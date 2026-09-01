import { Budget } from "../../domain/budgets/budget.types";
import { getCurrentMonthKey } from "../../lib/dateUtils";

export function buildBudget(overrides: Partial<Budget> = {}): Budget {
  return {
    id: "budget-1",
    category: "Food & Grocery",
    limitAmount: 400,
    period: "monthly",
    periodKey: getCurrentMonthKey(),
    ...overrides,
  };
}

export function buildBudgetPayload(overrides: Partial<Omit<Budget, "id">> = {}): Omit<Budget, "id"> {
  return {
    category: "Food & Grocery",
    limitAmount: 400,
    period: "monthly",
    periodKey: getCurrentMonthKey(),
    ...overrides,
  };
}
