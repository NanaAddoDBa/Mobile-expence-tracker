import { Goal, GoalCalculation } from "./goal.types";

/**
 * Calculates weeks, months, balances, and recommended contributions for a given goal.
 * Uses reference date to avoid testing or runtime shifts.
 */
export function calculateGoalMetrics(
  goal: Goal,
  todayStr: string
): {
  monthsRemaining: number;
  suggestedMonthly: number;
  remainingAmount: number;
  progressPercentage: number;
} {
  const ref = new Date(todayStr);
  const tgt = new Date(goal.targetDate);

  let months = (tgt.getFullYear() - ref.getFullYear()) * 12 + (tgt.getMonth() - ref.getMonth());
  if (months <= 0) months = 1;

  const remainingAmount = Math.max(0, goal.targetAmount - goal.currentAmount);
  const suggestedMonthly = remainingAmount / months;
  const progressPercentage = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;

  return {
    monthsRemaining: months,
    suggestedMonthly: +suggestedMonthly.toFixed(2),
    remainingAmount: +remainingAmount.toFixed(2),
    progressPercentage,
  };
}

/**
 * Generates an aggregated plan of metrics across all goals.
 */
export function calculateAllGoalsProjections(
  goals: Goal[],
  todayStr: string
): GoalCalculation[] {
  return goals.map((goal) => {
    const metrics = calculateGoalMetrics(goal, todayStr);
    return {
      goalId: goal.id,
      progressPercentage: metrics.progressPercentage,
      monthsRemaining: metrics.monthsRemaining,
      suggestedMonthlyContribution: metrics.suggestedMonthly,
    };
  });
}
