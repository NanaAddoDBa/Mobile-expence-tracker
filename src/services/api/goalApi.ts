import { GoalApi } from "./api.types";
import { goalRepository } from "../repositories/goalRepository.mock";

export const goalApi: GoalApi = {
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
