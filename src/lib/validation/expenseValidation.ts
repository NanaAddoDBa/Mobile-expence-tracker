import { CreateExpenseModel } from "../../domain/expenses/expense.types";

export type ValidationResult = {
  isValid: boolean;
  errors: Record<string, string>;
};

export function validateExpense(expense: Partial<CreateExpenseModel>): ValidationResult {
  const errors: Record<string, string> = {};

  if (!expense.merchant || !expense.merchant.trim()) {
    errors.merchant = "Merchant name is required";
  }

  if (expense.amount === undefined || isNaN(expense.amount) || expense.amount <= 0) {
    errors.amount = "Amount must be a positive number greater than 0";
  }

  if (!expense.date || !expense.date.match(/^\d{4}-\d{2}-\d{2}$/)) {
    errors.date = "A valid calendar date (YYYY-MM-DD) is required";
  }

  if (!expense.category) {
    errors.category = "Category is required";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
