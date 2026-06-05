import { ExpenseApi } from "./api.types";
import { expenseRepository } from "../repositories/expenseRepository.mock";

export const expenseApi: ExpenseApi = {
  async listExpenses() {
    return expenseRepository.getAll();
  },

  async createExpense(expense) {
    return expenseRepository.add(expense);
  },

  async createImportedExpenses(expenses) {
    return expenses.map((expense) => expenseRepository.add(expense));
  },

  async updateExpense(id, updates) {
    return expenseRepository.update(id, updates);
  },

  async deleteExpense(id) {
    return expenseRepository.delete(id);
  },

  async replaceExpenses(expenses) {
    expenseRepository.saveAll(expenses);
    return expenseRepository.getAll();
  },
};
