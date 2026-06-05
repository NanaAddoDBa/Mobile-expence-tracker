import { Goal } from "../domain/goals/goal.types";

export const INITIAL_GOALS: Goal[] = [
  {
    id: "g-1",
    name: "Summer Vacation",
    targetAmount: 2000.00,
    currentAmount: 1150.00,
    targetDate: "2026-08-15",
  },
  {
    id: "g-2",
    name: "Emergency Savings",
    targetAmount: 4000.00,
    currentAmount: 2400.00,
    targetDate: "2026-12-31",
  },
  {
    id: "g-3",
    name: "Commuter Bike",
    targetAmount: 1500.00,
    currentAmount: 300.00,
    targetDate: "2026-10-31",
  },
];
