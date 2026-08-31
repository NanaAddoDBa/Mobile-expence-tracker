import { normalizePaymentMethod } from "../../domain/expenses/expense.constants";
import type {
  ExpenseEntrySource,
  PaymentMethod,
  RecurringFrequency,
} from "../../domain/expenses/expense.types";
import {
  toApiIncomeCategory,
  toFrontendIncomeCategory,
} from "../../domain/incomes/income.constants";
import type {
  CreateIncomeModel,
  Income,
  UpdateIncomeModel,
} from "../../domain/incomes/income.types";
import { incomeRepository } from "../repositories/incomeRepository.mock";
import type { IncomeApi } from "./api.types";
import { USES_HTTP_API } from "./apiMode";
import { requestJson } from "./httpClient";
import { requestAllPages } from "./paginatedRequest";

interface IncomeResponse {
  id: string;
  source: string;
  description: string | null;
  amountMinor: number;
  currency: "EUR";
  date: string;
  category: string;
  paymentMethod: PaymentMethod;
  entrySource: ExpenseEntrySource;
  notes: string | null;
  sourceAccountId: string | null;
  importBatchId: string | null;
  externalTransactionId: string | null;
  isRecurring: boolean;
  recurringFrequency: RecurringFrequency | null;
  recurringTemplateId: string | null;
}

interface IncomePayloadResponse {
  data: { income: IncomeResponse };
}

const mockIncomeApi: IncomeApi = {
  async listIncomes() {
    return incomeRepository.getAll();
  },
  async createIncome(income) {
    return incomeRepository.add(income);
  },
  async updateIncome(id, updates) {
    return incomeRepository.update(id, updates);
  },
  async deleteIncome(id) {
    return incomeRepository.delete(id);
  },
  async replaceIncomes(incomes) {
    incomeRepository.saveAll(incomes);
    return incomeRepository.getAll();
  },
};

const httpIncomeApi: IncomeApi = {
  async listIncomes() {
    const incomes = await requestAllPages<
      { incomes: IncomeResponse[] },
      IncomeResponse
    >("/incomes", (data) => data.incomes);
    return incomes.map(fromApiIncome);
  },
  async createIncome(income) {
    const response = await requestJson<IncomePayloadResponse>("/incomes", {
      method: "POST",
      body: JSON.stringify(toApiIncomePayload(income)),
    });
    return fromApiIncome(response.data.income);
  },
  async updateIncome(id, updates) {
    await requestJson<IncomePayloadResponse>(`/incomes/${id}`, {
      method: "PATCH",
      body: JSON.stringify(toApiIncomePayload(updates)),
    });
    return this.listIncomes();
  },
  async deleteIncome(id) {
    await requestJson<{ data: { success: true } }>(`/incomes/${id}`, {
      method: "DELETE",
    });
    return this.listIncomes();
  },
  async replaceIncomes(incomes) {
    for (const income of incomes) {
      await this.createIncome(income);
    }
    return this.listIncomes();
  },
};

export const incomeApi: IncomeApi = USES_HTTP_API ? httpIncomeApi : mockIncomeApi;

function fromApiIncome(income: IncomeResponse): Income {
  return {
    id: income.id,
    source: income.source,
    description: income.description ?? "",
    amount: income.amountMinor / 100,
    date: income.date,
    category: toFrontendIncomeCategory(income.category),
    accountSource: income.sourceAccountId || income.entrySource || "manual",
    paymentMethod: normalizePaymentMethod(income.paymentMethod),
    entrySource: income.entrySource,
    notes: income.notes || undefined,
    sourceAccountId: income.sourceAccountId || undefined,
    importBatchId: income.importBatchId || undefined,
    externalTransactionId: income.externalTransactionId || undefined,
    isRecurring: income.isRecurring,
    recurringFrequency: income.recurringFrequency || undefined,
    recurringTemplateId: income.recurringTemplateId || undefined,
  };
}

function toApiIncomePayload(
  income: Partial<CreateIncomeModel | UpdateIncomeModel>,
) {
  return {
    ...(income.source === undefined ? {} : { source: income.source }),
    ...(income.description === undefined
      ? {}
      : { description: income.description }),
    ...(income.amount === undefined
      ? {}
      : { amountMinor: Math.round(income.amount * 100) }),
    currency: "EUR",
    ...(income.date === undefined ? {} : { date: income.date }),
    ...(income.category === undefined
      ? {}
      : { category: toApiIncomeCategory(income.category) }),
    ...(income.paymentMethod === undefined
      ? {}
      : { paymentMethod: normalizePaymentMethod(income.paymentMethod) }),
    ...(income.entrySource === undefined
      ? {}
      : { entrySource: income.entrySource }),
    ...(income.notes === undefined ? {} : { notes: income.notes }),
    ...(income.isRecurring === undefined
      ? {}
      : { isRecurring: income.isRecurring }),
    ...(income.recurringFrequency === undefined
      ? {}
      : { recurringFrequency: income.recurringFrequency }),
  };
}
