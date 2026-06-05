import { BudgetApi } from "./api.types";
import { budgetRepository } from "../repositories/budgetRepository.mock";

export const budgetApi: BudgetApi = {
  async listBudgets() {
    return budgetRepository.getAll();
  },

  async createBudget(budget) {
    return budgetRepository.add(budget);
  },

  async updateBudget(id, updates) {
    return budgetRepository.update(id, updates);
  },

  async deleteBudget(id) {
    return budgetRepository.delete(id);
  },

  async replaceBudgets(budgets) {
    budgetRepository.saveAll(budgets);
    return budgetRepository.getAll();
  },
};
