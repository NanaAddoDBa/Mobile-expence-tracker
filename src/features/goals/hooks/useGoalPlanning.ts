import { useMemo, useState } from "react";
import { Goal } from "../../../domain/goals/goal.types";
import { goalPlanningService } from "../services/goalPlanningService";

export function useGoalPlanning(goals: Goal[], referenceDateStr: string) {
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);

  const preparedTrajectories = useMemo(() => {
    return goalPlanningService.prepareTrajectories(goals, referenceDateStr);
  }, [goals, referenceDateStr]);

  const summary = useMemo(() => {
    return goalPlanningService.calculateOverallSavingsOverview(goals);
  }, [goals]);

  const activeGoalTrajectory = useMemo(() => {
    if (!selectedGoalId) return null;
    return preparedTrajectories.find((t) => t.goal.id === selectedGoalId) || null;
  }, [preparedTrajectories, selectedGoalId]);

  return {
    preparedTrajectories,
    summary,
    selectedGoalId,
    setSelectedGoalId,
    activeGoalTrajectory,
  };
}
