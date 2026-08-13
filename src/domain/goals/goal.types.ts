export type GoalStatus = "Not Started" | "In Progress" | "Completed";

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string; // YYYY-MM-DD
  currency?: "EUR";
  status?: "active" | "completed" | "paused" | "archived";
}

export type CreateGoalModel = Omit<Goal, "id">;
export type UpdateGoalModel = Partial<CreateGoalModel>;

export interface GoalCalculation {
  goalId: string;
  progressPercentage: number;
  monthsRemaining: number;
  suggestedMonthlyContribution: number;
}
