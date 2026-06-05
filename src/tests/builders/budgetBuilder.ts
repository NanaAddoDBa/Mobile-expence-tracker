import { Budget } from "../../domain/budgets/budget.types";

export function buildBudget(overrides: Partial<Budget> = {}): Budget {
  return {
    id: "budget-1",
    category: "Food & Grocery",
    limitAmount: 400,
    ...overrides,
  };
}

export function buildBudgetPayload(overrides: Partial<Omit<Budget, "id">> = {}): Omit<Budget, "id"> {
  return {
    category: "Food & Grocery",
    limitAmount: 400,
    ...overrides,
  };
}
