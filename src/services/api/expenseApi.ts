import {
  CreateExpenseModel,
  Expense,
  ExpenseEntrySource,
  PaymentMethod,
  RecurringFrequency,
  UpdateExpenseModel,
} from "../../domain/expenses/expense.types";
import { normalizePaymentMethod } from "../../domain/expenses/expense.constants";
import { ExpenseApi } from "./api.types";
import { USES_HTTP_API } from "./apiMode";
import {
  ApiExpenseCategory,
  toApiCategory,
  toFrontendCategory,
} from "./categoryMapper";
import { requestJson } from "./httpClient";
import { requestAllPages } from "./paginatedRequest";
import { expenseRepository } from "../repositories/expenseRepository.mock";

interface ExpenseResponse {
  id: string;
  merchant: string;
  description: string | null;
  amountMinor: number;
  currency: "EUR";
  date: string;
  category: ApiExpenseCategory;
  paymentMethod: PaymentMethod;
  entrySource: ExpenseEntrySource;
  notes: string | null;
  isRecurring: boolean;
  recurringFrequency: RecurringFrequency | null;
  receiptId: string | null;
  sourceAccountId: string | null;
  importBatchId: string | null;
  externalTransactionId: string | null;
  recurringTemplateId: string | null;
}

interface ExpensePayloadResponse {
  data: {
    expense: ExpenseResponse;
  };
}

const mockExpenseApi: ExpenseApi = {
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

const httpExpenseApi: ExpenseApi = {
  async listExpenses() {
    const expenses = await requestAllPages<
      { expenses: ExpenseResponse[] },
      ExpenseResponse
    >("/expenses", (data) => data.expenses);
    return expenses.map(fromApiExpense);
  },

  async createExpense(expense) {
    const response = await requestJson<ExpensePayloadResponse>("/expenses", {
      method: "POST",
      body: JSON.stringify(toApiExpensePayload(expense)),
    });

    return fromApiExpense(response.data.expense);
  },

  async createImportedExpenses(expenses) {
    const created: Expense[] = [];

    for (const expense of expenses) {
      created.push(await this.createExpense(expense));
    }

    return created;
  },

  async updateExpense(id, updates) {
    await requestJson<ExpensePayloadResponse>(`/expenses/${id}`, {
      method: "PATCH",
      body: JSON.stringify(toApiExpensePayload(updates)),
    });

    return this.listExpenses();
  },

  async deleteExpense(id) {
    await requestJson<{ data: { success: true } }>(`/expenses/${id}`, {
      method: "DELETE",
    });

    return this.listExpenses();
  },

  async replaceExpenses(expenses) {
    for (const expense of expenses) {
      await this.createExpense(expense);
    }

    return this.listExpenses();
  },
};

export const expenseApi: ExpenseApi = USES_HTTP_API
  ? httpExpenseApi
  : mockExpenseApi;

function fromApiExpense(expense: ExpenseResponse): Expense {
  return {
    id: expense.id,
    merchant: expense.merchant,
    description: expense.description || "",
    amount: expense.amountMinor / 100,
    date: expense.date,
    category: toFrontendCategory(expense.category),
    accountSource: expense.sourceAccountId || expense.entrySource || "manual",
    paymentMethod: normalizePaymentMethod(expense.paymentMethod),
    isRecurring: expense.isRecurring,
    recurringFrequency: expense.recurringFrequency || undefined,
    notes: expense.notes || undefined,
    receiptId: expense.receiptId || undefined,
    entrySource: expense.entrySource,
    sourceAccountId: expense.sourceAccountId || undefined,
    importBatchId: expense.importBatchId || undefined,
    externalTransactionId: expense.externalTransactionId || undefined,
    recurringTemplateId: expense.recurringTemplateId || undefined,
  };
}

function toApiExpensePayload(
  expense: Partial<CreateExpenseModel | UpdateExpenseModel>
) {
  return {
    ...(expense.merchant === undefined ? {} : { merchant: expense.merchant }),
    ...(expense.description === undefined
      ? {}
      : { description: expense.description }),
    ...(expense.amount === undefined
      ? {}
      : { amountMinor: Math.round(expense.amount * 100) }),
    currency: "EUR",
    ...(expense.date === undefined ? {} : { date: expense.date }),
    ...(expense.category === undefined
      ? {}
      : { category: toApiCategory(expense.category) }),
    ...(expense.paymentMethod === undefined
      ? {}
      : { paymentMethod: normalizePaymentMethod(expense.paymentMethod) }),
    ...(expense.entrySource === undefined
      ? {}
      : { entrySource: expense.entrySource }),
    ...(expense.notes === undefined ? {} : { notes: expense.notes }),
    ...(expense.isRecurring === undefined
      ? {}
      : { isRecurring: expense.isRecurring }),
    ...(expense.recurringFrequency === undefined
      ? {}
      : { recurringFrequency: expense.recurringFrequency }),
  };
}
