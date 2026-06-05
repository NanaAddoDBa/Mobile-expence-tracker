import { describe, test, expect } from "vitest";
import { goalPlanningService } from "../features/goals/services/goalPlanningService";
import { Goal } from "../domain/goals/goal.types";
import { calculateGoalMetrics } from "../domain/goals/goal.rules";

describe("goalPlanningService linear projection targets", () => {
  test("calculates necessary metrics with future date horizon", () => {
    const goals: Goal[] = [
      {
        id: "g1",
        name: "Emergency Fund Fundraiser",
        targetAmount: 3000,
        currentAmount: 1200,
        targetDate: "2026-12-02", // 6 months ahead from June 2026
      },
    ];

    const trajectories = goalPlanningService.prepareTrajectories(goals, "2026-06-02");
    expect(trajectories).toHaveLength(1);
    expect(trajectories[0].remainingAmount).toBe(1800);
    expect(trajectories[0].monthsRemaining).toBe(6);
    expect(trajectories[0].suggestedMonthly).toBe(300); // 1800 / 6
  });

  test("calculates progress percentage and completed goal metrics", () => {
    const metrics = calculateGoalMetrics(
      {
        id: "g2",
        name: "Holiday",
        targetAmount: 1000,
        currentAmount: 1000,
        targetDate: "2026-07-02",
      },
      "2026-06-02"
    );

    expect(metrics.progressPercentage).toBe(100);
    expect(metrics.remainingAmount).toBe(0);
    expect(metrics.suggestedMonthly).toBe(0);
  });

  test("summarizes manual savings planning totals", () => {
    const summary = goalPlanningService.calculateOverallSavingsOverview([
      {
        id: "g1",
        name: "Emergency Fund",
        targetAmount: 3000,
        currentAmount: 1200,
        targetDate: "2026-12-02",
      },
      {
        id: "g2",
        name: "Holiday",
        targetAmount: 1000,
        currentAmount: 1000,
        targetDate: "2026-07-02",
      },
    ]);

    expect(summary.totalCurrent).toBe(2200);
    expect(summary.totalTarget).toBe(4000);
    expect(summary.overallProgress).toBe(55);
    expect(summary.overallRemaining).toBe(1800);
  });
});
