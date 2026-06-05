import { Goal } from "../../../domain/goals/goal.types";
import { calculateGoalMetrics } from "../../../domain/goals/goal.rules";

export interface TrajectoryPoint {
  date: Date;
  amount: number;
}

export interface PreparedGoalTrajectory {
  goal: Goal;
  color: string;
  startDate: Date;
  finalDate: Date;
  startAmount: number;
  targetAmount: number;
  monthsRemaining: number;
  suggestedMonthly: number;
  remainingAmount: number;
  progressPercentage: number;
}

export const goalPlanningService = {
  getPaletteColor(index: number): string {
    const colors = [
      "#10b981", // Emerald
      "#6366f1", // Indigo
      "#f59e0b", // Amber
      "#06b6d4", // Cyan
      "#ec4899", // Pink
      "#8b5cf6", // Violet
      "#14b8a6", // Teal
    ];
    return colors[index % colors.length];
  },

  prepareTrajectories(goals: Goal[], referenceDateStr: string): PreparedGoalTrajectory[] {
    const referenceDate = new Date(referenceDateStr);

    return goals.map((g, index) => {
      const targetDateObj = new Date(g.targetDate);
      
      const finalDate = targetDateObj.getTime() > referenceDate.getTime()
        ? targetDateObj
        : new Date(referenceDate.getTime() + 30 * 24 * 60 * 60 * 1000);

      const metrics = calculateGoalMetrics(g, referenceDateStr);

      return {
        goal: g,
        color: this.getPaletteColor(index),
        startDate: referenceDate,
        finalDate,
        startAmount: g.currentAmount,
        targetAmount: g.targetAmount,
        monthsRemaining: metrics.monthsRemaining,
        suggestedMonthly: metrics.suggestedMonthly,
        remainingAmount: metrics.remainingAmount,
        progressPercentage: metrics.progressPercentage,
      };
    });
  },

  calculateOverallSavingsOverview(goals: Goal[]) {
    const totalCurrent = goals.reduce((sum, g) => sum + g.currentAmount, 0);
    const totalTarget = goals.reduce((sum, g) => sum + g.targetAmount, 0);
    const overallProgress = totalTarget > 0 ? (totalCurrent / totalTarget) * 100 : 0;
    const overallRemaining = totalTarget - totalCurrent;

    return {
      totalCurrent: +totalCurrent.toFixed(2),
      totalTarget: +totalTarget.toFixed(2),
      overallProgress: +overallProgress.toFixed(1),
      overallRemaining: +overallRemaining.toFixed(2),
    };
  },
};
