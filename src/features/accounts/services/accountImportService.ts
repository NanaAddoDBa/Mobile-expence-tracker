import { ConnectedAccount } from "../../../domain/accounts/account.types";
import { normalizePaymentMethod } from "../../../domain/expenses/expense.constants";
import { Expense } from "../../../domain/expenses/expense.types";
import { getCurrentIsoTimestamp } from "../../../lib/dateUtils";
import { mockBankingProvider } from "../../../services/adapters/mockBankingProvider";

export interface AccountImportResult {
  imported: Omit<Expense, "id">[];
  importedAt: string;
  importedCount: number;
  skippedDuplicateCount: number;
  failedCount: number;
  importBatchId: string;
  message: string;
}

export async function importExpensesForAccount(
  account: ConnectedAccount,
  existingExpenses: Expense[]
): Promise<AccountImportResult> {
  const importedAt = getCurrentIsoTimestamp();
  const importBatchId = `import-${account.id}-${Date.now()}`;
  const existingExternalIds = new Set(
    existingExpenses
      .filter((expense) => expense.sourceAccountId === account.id || expense.accountSource === account.id)
      .map((expense) => expense.externalTransactionId)
      .filter(Boolean)
  );

  const candidates = await mockBankingProvider.importMockExpensesForAccount(account.id);
  let skippedDuplicateCount = 0;

  const imported: Omit<Expense, "id">[] = [];

  candidates.forEach((expense) => {
    if (expense.externalTransactionId && existingExternalIds.has(expense.externalTransactionId)) {
      skippedDuplicateCount += 1;
      return;
    }

    if (expense.externalTransactionId) {
      existingExternalIds.add(expense.externalTransactionId);
    }

    imported.push({
      ...expense,
      paymentMethod: normalizePaymentMethod(expense.paymentMethod),
      entrySource: "connected_account",
      sourceAccountId: account.id,
      accountSource: account.id,
      importBatchId,
    });
  });

  return {
    imported,
    importedAt,
    importedCount: imported.length,
    skippedDuplicateCount,
    failedCount: 0,
    importBatchId,
    message:
      imported.length > 0
        ? `Imported ${imported.length} mock expenses from ${account.name}.`
        : "No new expenses found.",
  };
}

export const accountImportService = {
  importExpensesForAccount,
};
