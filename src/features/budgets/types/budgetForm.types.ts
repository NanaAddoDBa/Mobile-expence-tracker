import { Budget } from "../../../domain/budgets/budget.types";

export type BudgetFormValues = {
  category: string;
  limitAmount: number;
};

export type BudgetFormSubmitPayload = BudgetFormValues;

export type BudgetFormInitialData = Partial<Pick<Budget, "category" | "limitAmount">>;
