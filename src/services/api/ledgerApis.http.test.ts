/** @vitest-environment jsdom */

import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("./apiMode", () => ({
  API_BASE_URL: "",
  USES_HTTP_API: true,
}));

describe("HTTP ledger APIs", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  test("loads every expense page", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse(expensePage(1, 2, [expenseResponse("expense-1")]))
      )
      .mockResolvedValueOnce(
        jsonResponse(expensePage(2, 2, [expenseResponse("expense-101")]))
      );
    vi.stubGlobal("fetch", fetchMock);
    const { expenseApi } = await import("./expenseApi");

    await expect(expenseApi.listExpenses()).resolves.toMatchObject([
      { id: "expense-1" },
      { id: "expense-101" },
    ]);
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "/api/expenses?page=1&pageSize=100",
      expect.any(Object)
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "/api/expenses?page=2&pageSize=100",
      expect.any(Object)
    );
  });

  test("loads every income page", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse(incomePage(1, 2, [incomeResponse("income-1")]))
      )
      .mockResolvedValueOnce(
        jsonResponse(incomePage(2, 2, [incomeResponse("income-101")]))
      );
    vi.stubGlobal("fetch", fetchMock);
    const { incomeApi } = await import("./incomeApi");

    await expect(incomeApi.listIncomes()).resolves.toMatchObject([
      { id: "income-1" },
      { id: "income-101" },
    ]);
    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "/api/incomes?page=1&pageSize=100",
      expect.any(Object)
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "/api/incomes?page=2&pageSize=100",
      expect.any(Object)
    );
  });
});

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

function expensePage(page: number, totalPages: number, expenses: unknown[]) {
  return {
    data: { expenses },
    meta: {
      pagination: { page, pageSize: 100, total: 101, totalPages },
    },
  };
}

function incomePage(page: number, totalPages: number, incomes: unknown[]) {
  return {
    data: { incomes },
    meta: {
      pagination: { page, pageSize: 100, total: 101, totalPages },
    },
  };
}

function expenseResponse(id: string) {
  return {
    id,
    merchant: "Market",
    description: "Groceries",
    amountMinor: 2500,
    currency: "EUR",
    date: "2026-08-01",
    category: "groceries",
    paymentMethod: "debit_card",
    entrySource: "manual",
    notes: null,
    isRecurring: false,
    recurringFrequency: null,
    receiptId: null,
    sourceAccountId: null,
    importBatchId: null,
    externalTransactionId: null,
    recurringTemplateId: null,
  };
}

function incomeResponse(id: string) {
  return {
    id,
    source: "Employer",
    description: "Salary",
    amountMinor: 300000,
    currency: "EUR",
    date: "2026-08-01",
    category: "salary",
    paymentMethod: "bank_transfer",
    entrySource: "manual",
    notes: null,
    sourceAccountId: null,
    importBatchId: null,
    externalTransactionId: null,
    isRecurring: false,
    recurringFrequency: null,
    recurringTemplateId: null,
  };
}
