import { CreateGoalModel, Goal, UpdateGoalModel } from "../../domain/goals/goal.types";
import { getTodayDateString } from "../../lib/dateUtils";
import { GoalApi } from "./api.types";
import { USES_HTTP_API } from "./apiMode";
import { requestJson } from "./httpClient";
import { goalRepository } from "../repositories/goalRepository.mock";

interface GoalResponse {
  id: string;
  name: string;
  targetAmountMinor: number;
  currentAmountMinor: number;
  currency: "EUR";
  targetDate: string | null;
  status: "active" | "completed" | "paused" | "archived";
}

interface ListGoalsResponse {
  data: {
    goals: GoalResponse[];
  };
}

interface GoalPayloadResponse {
  data: {
    goal: GoalResponse;
  };
}

const mockGoalApi: GoalApi = {
  async listGoals() {
    return goalRepository.getAll();
  },

  async createGoal(goal) {
    return goalRepository.add(goal);
  },

  async updateGoal(id, updates) {
    return goalRepository.update(id, updates);
  },

  async deleteGoal(id) {
    return goalRepository.delete(id);
  },

  async replaceGoals(goals) {
    goalRepository.saveAll(goals);
    return goalRepository.getAll();
  },
};

const httpGoalApi: GoalApi = {
  async listGoals() {
    const response = await requestJson<ListGoalsResponse>("/goals");
    return response.data.goals.map(fromApiGoal);
  },

  async createGoal(goal) {
    const response = await requestJson<GoalPayloadResponse>("/goals", {
      method: "POST",
      body: JSON.stringify(toApiGoalPayload(goal)),
    });

    return fromApiGoal(response.data.goal);
  },

  async updateGoal(id, updates) {
    await requestJson<GoalPayloadResponse>(`/goals/${id}`, {
      method: "PATCH",
      body: JSON.stringify(toApiGoalPayload(updates)),
    });

    return this.listGoals();
  },

  async deleteGoal(id) {
    await requestJson<{ data: { success: true } }>(`/goals/${id}`, {
      method: "DELETE",
    });

    return this.listGoals();
  },

  async replaceGoals(goals) {
    const existingGoals = await this.listGoals();

    for (const goal of existingGoals) {
      await requestJson<{ data: { success: true } }>(`/goals/${goal.id}`, {
        method: "DELETE",
      });
    }

    for (const goal of goals) {
      await this.createGoal(goal);
    }

    return this.listGoals();
  },
};

export const goalApi: GoalApi = USES_HTTP_API ? httpGoalApi : mockGoalApi;

function fromApiGoal(goal: GoalResponse): Goal {
  return {
    id: goal.id,
    name: goal.name,
    targetAmount: goal.targetAmountMinor / 100,
    currentAmount: goal.currentAmountMinor / 100,
    targetDate: goal.targetDate || getTodayDateString(),
    currency: goal.currency,
    status: goal.status,
  };
}

function toApiGoalPayload(goal: Partial<CreateGoalModel | UpdateGoalModel>) {
  return {
    ...(goal.name === undefined ? {} : { name: goal.name }),
    ...(goal.targetAmount === undefined
      ? {}
      : { targetAmountMinor: Math.round(goal.targetAmount * 100) }),
    ...(goal.currentAmount === undefined
      ? {}
      : { currentAmountMinor: Math.round(goal.currentAmount * 100) }),
    currency: "EUR",
    ...(goal.targetDate === undefined ? {} : { targetDate: goal.targetDate }),
    ...(goal.status === undefined ? {} : { status: goal.status }),
  };
}
