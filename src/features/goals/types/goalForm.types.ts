import { Goal } from "../../../domain/goals/goal.types";

export type GoalFormValues = {
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
};

export type GoalFormSubmitPayload = GoalFormValues;

export type GoalFormInitialData = Partial<
  Pick<Goal, "name" | "targetAmount" | "currentAmount" | "targetDate">
>;

export type GoalSavingsSubmitPayload = number;
