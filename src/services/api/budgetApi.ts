import { Budget, CreateBudgetModel, UpdateBudgetModel } from "../../domain/budgets/budget.types";
import { getCurrentMonthKey } from "../../lib/dateUtils";
import { BudgetApi } from "./api.types";
import { USES_HTTP_API } from "./apiMode";
import {
  ApiExpenseCategory,
  toApiCategory,
  toFrontendCategory,
} from "./categoryMapper";
import { requestJson } from "./httpClient";
import { budgetRepository } from "../repositories/budgetRepository.mock";

interface BudgetResponse {
  id: string;
  category: ApiExpenseCategory;
  limitAmountMinor: number;
  currency: "EUR";
  monthKey: string;
}

interface ListBudgetsResponse {
  data: {
    budgets: BudgetResponse[];
  };
}

interface BudgetPayloadResponse {
  data: {
    budget: BudgetResponse;
  };
}

const mockBudgetApi: BudgetApi = {
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

const httpBudgetApi: BudgetApi = {
  async listBudgets() {
    const monthKey = getCurrentMonthKey();
    const response = await requestJson<ListBudgetsResponse>(
      `/budgets?monthKey=${encodeURIComponent(monthKey)}`
    );
    return response.data.budgets.map(fromApiBudget);
  },

  async createBudget(budget) {
    const response = await requestJson<BudgetPayloadResponse>("/budgets", {
      method: "POST",
      body: JSON.stringify(toApiBudgetPayload(budget)),
    });

    return fromApiBudget(response.data.budget);
  },

  async updateBudget(id, updates) {
    await requestJson<BudgetPayloadResponse>(`/budgets/${id}`, {
      method: "PATCH",
      body: JSON.stringify(toApiBudgetPayload(updates)),
    });

    return this.listBudgets();
  },

  async deleteBudget(id) {
    await requestJson<{ data: { success: true } }>(`/budgets/${id}`, {
      method: "DELETE",
    });

    return this.listBudgets();
  },

  async replaceBudgets(budgets) {
    const existingBudgets = await this.listBudgets();

    for (const budget of existingBudgets) {
      await requestJson<{ data: { success: true } }>(`/budgets/${budget.id}`, {
        method: "DELETE",
      });
    }

    for (const budget of budgets) {
      await this.createBudget(budget);
    }

    return this.listBudgets();
  },
};

export const budgetApi: BudgetApi = USES_HTTP_API
  ? httpBudgetApi
  : mockBudgetApi;

function fromApiBudget(budget: BudgetResponse): Budget {
  return {
    id: budget.id,
    category: toFrontendCategory(budget.category),
    limitAmount: budget.limitAmountMinor / 100,
    currency: budget.currency,
    monthKey: budget.monthKey,
  };
}

function toApiBudgetPayload(
  budget: Partial<CreateBudgetModel | UpdateBudgetModel>
) {
  return {
    ...(budget.category === undefined
      ? {}
      : { category: toApiCategory(budget.category) }),
    ...(budget.limitAmount === undefined
      ? {}
      : { limitAmountMinor: Math.round(budget.limitAmount * 100) }),
    currency: "EUR",
    monthKey: budget.monthKey ?? getCurrentMonthKey(),
  };
}
