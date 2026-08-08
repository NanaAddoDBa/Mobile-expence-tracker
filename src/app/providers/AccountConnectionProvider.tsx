import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  BankInstitution,
  ConnectedAccount,
  StartBankConnectionInput,
} from "../../domain/accounts/account.types";
import { accountConnectionService } from "../../features/accounts/services/accountConnectionService";
import { accountImportService } from "../../features/accounts/services/accountImportService";
import { createNotification } from "../../features/notifications/services/notificationService";
import { accountApi } from "../../services/api";
import { USES_HTTP_API } from "../../services/api/apiMode";
import { createAppError } from "../../lib/error/appError";
import { logger } from "../../lib/logger";
import { useExpenses } from "./ExpenseProvider";
import { useMockAuth } from "./MockAuthProvider";
import { useNotifications } from "./NotificationProvider";

export interface AccountConnectionContextType {
  accounts: ConnectedAccount[];
  reloadAccounts: () => Promise<ConnectedAccount[]>;
  triggerMockImport: (accountId: string) => Promise<void>;
  connectMockAccounts: (providerId: string, accountIds: string[]) => Promise<void>;
  listBankInstitutions: (country: string) => Promise<BankInstitution[]>;
  startRealBankConnection: (input?: StartBankConnectionInput) => Promise<void>;
  reconnectAccount: (accountId: string) => Promise<void>;
  removeMockAccount: (accountId: string) => Promise<void>;
}

const AccountConnectionContext = createContext<AccountConnectionContextType | undefined>(undefined);

export const AccountConnectionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
  const { expenses, addImportedExpenses, reloadExpenses } = useExpenses();
  const { addNotification } = useNotifications();
  const { currentUser, isAuthenticated } = useMockAuth();

  const reloadAccounts = useCallback(async () => {
    if (USES_HTTP_API && !isAuthenticated) {
      setAccounts([]);
      return [];
    }

    try {
      const nextAccounts = await accountApi.listConnectedAccounts();
      setAccounts(nextAccounts);
      return nextAccounts;
    } catch {
      setAccounts([]);
      return [];
    }
  }, [isAuthenticated]);

  const updateAccounts = useCallback(async (nextAccounts: ConnectedAccount[]) => {
    const savedAccounts = await accountApi.replaceConnectedAccounts(nextAccounts);
    setAccounts(savedAccounts);
    return savedAccounts;
  }, []);

  useEffect(() => {
    void reloadAccounts();
  }, [reloadAccounts, currentUser?.id]);

  const value = useMemo<AccountConnectionContextType>(() => {
    return {
      accounts,
      reloadAccounts,
      async listBankInstitutions(country) {
        if (!USES_HTTP_API) return accountApi.listBankInstitutions(country);

        try {
          return await accountApi.listBankInstitutions(country);
        } catch (e) {
          logger.error("Bank institutions failed to load.", {
            error: createAppError("BANK_CONNECTION_ERROR", "Could not load banks.", e),
            country,
          });
          throw e;
        }
      },
      async startRealBankConnection(input) {
        try {
          const result = await accountApi.startBankConnection(input);
          window.location.assign(result.linkUrl);
        } catch (e) {
          logger.error("Real bank connection failed to start.", {
            error: createAppError("BANK_CONNECTION_ERROR", "Could not start bank connection.", e),
          });
          addNotification(
            createNotification("warning", "Could not start the bank connection.")
          );
        }
      },
      async connectMockAccounts(providerId, accountIds) {
        if (USES_HTTP_API) {
          const result = await accountApi.startBankConnection();
          window.location.assign(result.linkUrl);
          return;
        }

        const connected = accountConnectionService.connectSelectedAccounts(providerId, accountIds);
        const merged = [
          ...accounts.filter((account) => !connected.some((next) => next.id === account.id)),
          ...connected,
        ];

        await updateAccounts(merged);
        addNotification(
          createNotification(
            "success",
            `${connected.length === 1 ? "Account connected" : "Accounts connected"}. You can now import expenses.`
          )
        );
      },
      async reconnectAccount(accountId) {
        if (USES_HTTP_API) {
          const result = await accountApi.startBankConnection();
          window.location.assign(result.linkUrl);
          return;
        }

        const account = accounts.find((item) => item.id === accountId);
        if (!account) return;

        const reconnecting = accounts.map((item) =>
          item.id === accountId ? { ...item, status: "needs_reconnect" as const } : item
        );
        await updateAccounts(reconnecting);

        await accountConnectionService.simulateProviderAuthorization(account.providerId || "");

        const reconnectedAccount = accountConnectionService.reconnectAccount(account);
        const nextAccounts = reconnecting.map((item) =>
          item.id === accountId ? reconnectedAccount : item
        );
        await updateAccounts(nextAccounts);

        addNotification(createNotification("success", `${account.name} reconnected.`));
      },
      async removeMockAccount(accountId) {
        if (USES_HTTP_API) {
          await accountApi.deleteConnectedAccount(accountId);
          await reloadAccounts();
          addNotification(
            createNotification("info", "Connected account removed. Existing expenses were kept.")
          );
          return;
        }

        const nextAccounts = accountConnectionService.removeAccountConnection(accountId, accounts);
        await updateAccounts(nextAccounts);
        addNotification(
          createNotification("info", "Connected account removed. Existing expenses were kept.")
        );
      },
      async triggerMockImport(accountId) {
        if (USES_HTTP_API) {
          try {
            const importingAccounts = accounts.map((item) =>
              item.id === accountId ? { ...item, status: "importing" as const } : item
            );
            setAccounts(importingAccounts);
            const result = await accountApi.importConnectedAccount(accountId);
            await reloadExpenses();
            await reloadAccounts();
            addNotification(
              createNotification(
                result.importedCount > 0 ? "success" : "info",
                result.message
              )
            );
          } catch (e) {
            logger.error("Real transaction import failed.", {
              error: createAppError("IMPORT_ERROR", "Could not import bank transactions.", e),
              accountId,
            });
            await reloadAccounts();
            addNotification(
              createNotification("warning", "Transaction import failed. Please try again.")
            );
          }
          return;
        }

        const account = accounts.find((item) => item.id === accountId);
        if (!account || !account.isConnected || account.status === "needs_reconnect") return;

        try {
          const importingAccounts = accounts.map((item) =>
            item.id === accountId ? { ...item, status: "importing" as const } : item
          );
          await updateAccounts(importingAccounts);

          const result = await accountImportService.importExpensesForAccount(account, expenses);
          await addImportedExpenses(result.imported);

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
          await updateAccounts(nextAccounts);

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
          await updateAccounts(failedAccounts);
          logger.error("Mock expense import failed.", {
            error: createAppError("IMPORT_ERROR", "Could not import mock expenses.", e),
            accountId,
          });
        }
      },
    };
  }, [
    accounts,
    expenses,
    addImportedExpenses,
    addNotification,
    reloadAccounts,
    reloadExpenses,
    updateAccounts,
  ]);

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
