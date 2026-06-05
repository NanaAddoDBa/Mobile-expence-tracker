import { afterEach, describe, expect, test, vi } from "vitest";
import { ConnectedAccount } from "../domain/accounts/account.types";
import { Expense } from "../domain/expenses/expense.types";
import { accountImportService } from "../features/accounts/services/accountImportService";
import { mockBankingProvider } from "../services/adapters/mockBankingProvider";

const account: ConnectedAccount = {
  id: "mock-bank-checking-4820",
  providerId: "mock-bank",
  name: "Everyday Checking",
  institutionName: "Mock Bank",
  type: "checking",
  balance: 4250,
  currency: "EUR",
  isConnected: true,
  status: "connected",
};

const existingExpense: Expense = {
  id: "existing-1",
  merchant: "Aldi",
  description: "Existing grocery expense",
  amount: 42.35,
  date: "2026-06-02",
  category: "Food & Grocery",
  accountSource: account.id,
  sourceAccountId: account.id,
  paymentMethod: "debit_card",
  isRecurring: false,
  entrySource: "connected_account",
  externalTransactionId: "tx-duplicate",
};

const newExpense: Omit<Expense, "id"> = {
  merchant: "Bookshop",
  description: "Imported books",
  amount: 24,
  date: "2026-06-03",
  category: "Shopping",
  accountSource: account.id,
  paymentMethod: "debit_card",
  isRecurring: false,
  externalTransactionId: "tx-new",
};

describe("accountImportService", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("imports mock expenses with source metadata and skips duplicates", async () => {
    vi.spyOn(mockBankingProvider, "importMockExpensesForAccount").mockResolvedValue([
      {
        ...newExpense,
        externalTransactionId: "tx-duplicate",
      },
      newExpense,
      newExpense,
    ]);

    const result = await accountImportService.importExpensesForAccount(account, [existingExpense]);

    expect(result.importedCount).toBe(1);
    expect(result.skippedDuplicateCount).toBe(2);
    expect(result.failedCount).toBe(0);
    expect(result.importBatchId).toMatch(/^import-mock-bank-checking-4820-/);
    expect(result.message).toBe("Imported 1 mock expenses from Everyday Checking.");
    expect(result.imported[0]).toMatchObject({
      entrySource: "connected_account",
      sourceAccountId: account.id,
      accountSource: account.id,
      paymentMethod: "debit_card",
      externalTransactionId: "tx-new",
      importBatchId: result.importBatchId,
    });
  });

  test("returns a calm no-new-expenses message when everything is duplicate", async () => {
    vi.spyOn(mockBankingProvider, "importMockExpensesForAccount").mockResolvedValue([
      {
        ...newExpense,
        externalTransactionId: "tx-duplicate",
      },
    ]);

    const result = await accountImportService.importExpensesForAccount(account, [existingExpense]);

    expect(result.imported).toEqual([]);
    expect(result.importedCount).toBe(0);
    expect(result.skippedDuplicateCount).toBe(1);
    expect(result.message).toBe("No new expenses found.");
  });

  test("repeated imports do not duplicate already imported expenses", async () => {
    vi.spyOn(mockBankingProvider, "importMockExpensesForAccount").mockResolvedValue([
      {
        ...newExpense,
        externalTransactionId: "tx-repeat",
      },
    ]);

    const firstImport = await accountImportService.importExpensesForAccount(account, []);
    const existingAfterFirstImport: Expense[] = firstImport.imported.map((expense, index) => ({
      ...expense,
      id: `imported-${index}`,
    }));

    const secondImport = await accountImportService.importExpensesForAccount(
      account,
      existingAfterFirstImport
    );

    expect(firstImport.importedCount).toBe(1);
    expect(secondImport.importedCount).toBe(0);
    expect(secondImport.skippedDuplicateCount).toBe(1);
    expect(secondImport.message).toBe("No new expenses found.");
  });
});
