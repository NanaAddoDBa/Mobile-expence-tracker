import { CreateBudgetModel } from "../../domain/budgets/budget.types";
import { ValidationResult } from "./expenseValidation";

export function validateBudget(budget: Partial<CreateBudgetModel>): ValidationResult {
  const errors: Record<string, string> = {};

  if (!budget.category || !budget.category.trim()) {
    errors.category = "Category key is required";
  }

  if (budget.limitAmount === undefined || isNaN(budget.limitAmount) || budget.limitAmount < 0) {
    errors.limitAmount = "Budget limit must be a number equal to or greater than 0";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
