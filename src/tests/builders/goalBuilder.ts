import { Goal } from "../../domain/goals/goal.types";

export function buildGoal(overrides: Partial<Goal> = {}): Goal {
  return {
    id: "goal-1",
    name: "Emergency fund",
    targetAmount: 3000,
    currentAmount: 750,
    targetDate: "2026-12-31",
    ...overrides,
  };
}

export function buildGoalPayload(overrides: Partial<Omit<Goal, "id">> = {}): Omit<Goal, "id"> {
  return {
    name: "Emergency fund",
    targetAmount: 3000,
    currentAmount: 750,
    targetDate: "2026-12-31",
    ...overrides,
  };
}
