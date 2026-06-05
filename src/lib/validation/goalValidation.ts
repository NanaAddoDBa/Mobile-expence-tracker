import { CreateGoalModel } from "../../domain/goals/goal.types";
import { ValidationResult } from "./expenseValidation";

export function validateGoal(goal: Partial<CreateGoalModel>): ValidationResult {
  const errors: Record<string, string> = {};

  if (!goal.name || !goal.name.trim()) {
    errors.name = "Goal designation is required";
  }

  if (goal.targetAmount === undefined || isNaN(goal.targetAmount) || goal.targetAmount <= 0) {
    errors.targetAmount = "Target amount must be a number greater than 0";
  }

  if (goal.currentAmount !== undefined && (isNaN(goal.currentAmount) || goal.currentAmount < 0)) {
    errors.currentAmount = "Reserves level cannot be negative";
  }

  if (!goal.targetDate || !goal.targetDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
    errors.targetDate = "A valid future target date (YYYY-MM-DD) is required";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
