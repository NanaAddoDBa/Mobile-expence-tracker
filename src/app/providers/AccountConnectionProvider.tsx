import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { ConnectedAccount } from "../../domain/accounts/account.types";
import { accountConnectionService } from "../../features/accounts/services/accountConnectionService";
import { accountImportService } from "../../features/accounts/services/accountImportService";
import { createNotification } from "../../features/notifications/services/notificationService";
import { accountRepository } from "../../services/repositories/accountRepository.mock";
import { createAppError } from "../../lib/error/appError";
import { logger } from "../../lib/logger";
import { useExpenses } from "./ExpenseProvider";
import { useNotifications } from "./NotificationProvider";

export interface AccountConnectionContextType {
  accounts: ConnectedAccount[];
  reloadAccounts: () => ConnectedAccount[];
  triggerMockImport: (accountId: string) => Promise<void>;
  connectMockAccounts: (providerId: string, accountIds: string[]) => void;
  reconnectAccount: (accountId: string) => Promise<void>;
  removeMockAccount: (accountId: string) => void;
}

const AccountConnectionContext = createContext<AccountConnectionContextType | undefined>(undefined);

export const AccountConnectionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [accounts, setAccounts] = useState<ConnectedAccount[]>(() => accountRepository.getAll());
  const { expenses, addImportedExpenses } = useExpenses();
  const { addNotification } = useNotifications();

  const updateAccounts = useCallback((nextAccounts: ConnectedAccount[]) => {
    accountRepository.replaceAll(nextAccounts);
    setAccounts(nextAccounts);
  }, []);

  const value = useMemo<AccountConnectionContextType>(() => {
    return {
      accounts,
      reloadAccounts() {
        const nextAccounts = accountRepository.getAll();
        setAccounts(nextAccounts);
        return nextAccounts;
      },
      connectMockAccounts(providerId, accountIds) {
        const connected = accountConnectionService.connectSelectedAccounts(providerId, accountIds);
        const merged = [
          ...accounts.filter((account) => !connected.some((next) => next.id === account.id)),
          ...connected,
        ];

        updateAccounts(merged);
        addNotification(
          createNotification(
            "success",
            `${connected.length === 1 ? "Account connected" : "Accounts connected"}. You can now import expenses.`
          )
        );
      },
      async reconnectAccount(accountId) {
        const account = accounts.find((item) => item.id === accountId);
        if (!account) return;

        const reconnecting = accounts.map((item) =>
          item.id === accountId ? { ...item, status: "needs_reconnect" as const } : item
        );
        updateAccounts(reconnecting);

        await accountConnectionService.simulateProviderAuthorization(account.providerId || "");

        const reconnectedAccount = accountConnectionService.reconnectAccount(account);
        const nextAccounts = reconnecting.map((item) =>
          item.id === accountId ? reconnectedAccount : item
        );
        updateAccounts(nextAccounts);

        addNotification(createNotification("success", `${account.name} reconnected.`));
      },
      removeMockAccount(accountId) {
        const nextAccounts = accountConnectionService.removeAccountConnection(accountId, accounts);
        updateAccounts(nextAccounts);
        addNotification(
          createNotification("info", "Connected account removed. Existing expenses were kept.")
        );
      },
      async triggerMockImport(accountId) {
        const account = accounts.find((item) => item.id === accountId);
        if (!account || !account.isConnected || account.status === "needs_reconnect") return;

        try {
          const importingAccounts = accounts.map((item) =>
            item.id === accountId ? { ...item, status: "importing" as const } : item
          );
          updateAccounts(importingAccounts);

          const result = await accountImportService.importExpensesForAccount(account, expenses);
          addImportedExpenses(result.imported);

          const nextAccounts = importingAccounts.map((item) =>
            item.id === accountId
              ? {
                  ...item,
                  status: "connected" as const,
                  lastImportedAt: result.importedAt,
                  importedExpenseCount: (item.importedExpenseCount || 0) + result.importedCount,
                  lastImportMessage: result.message,
                  lastImportedCount: result.importedCount,
                  lastSkippedDuplicateCount: result.skippedDuplicateCount,
                  lastImportFailedCount: result.failedCount,
                }
              : item
          );
          updateAccounts(nextAccounts);

          addNotification(
            createNotification(result.importedCount > 0 ? "success" : "info", result.message)
          );
        } catch (e) {
          const failedAccounts = accounts.map((item) =>
            item.id === accountId
              ? {
                  ...item,
                  status: "error" as const,
                  connectionError: "Import failed. Please try again.",
                  lastImportMessage: "Import failed. Please try again.",
                  lastImportedCount: 0,
                  lastSkippedDuplicateCount: 0,
                  lastImportFailedCount: 1,
                }
              : item
          );
          updateAccounts(failedAccounts);
          logger.error("Mock expense import failed.", {
            error: createAppError("IMPORT_ERROR", "Could not import mock expenses.", e),
            accountId,
          });
        }
      },
    };
  }, [accounts, expenses, addImportedExpenses, addNotification, updateAccounts]);

  return (
    <AccountConnectionContext.Provider value={value}>
      {children}
    </AccountConnectionContext.Provider>
  );
};

export const useConnectedAccounts = () => {
  const context = useContext(AccountConnectionContext);
  if (context === undefined) {
    throw new Error("useConnectedAccounts must be used within an AccountConnectionProvider");
  }
  return context;
};
