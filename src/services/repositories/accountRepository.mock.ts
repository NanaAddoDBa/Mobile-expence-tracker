import { ConnectedAccount } from "../../domain/accounts/account.types";
import { createAppError } from "../../lib/error/appError";
import { logger } from "../../lib/logger";
import { localStorageAdapter } from "../storage/localStorageAdapter";
import { StorageAdapter } from "../storage/storage.types";

const STORAGE_KEY = "exp_accounts";

export function createAccountRepository(storage: StorageAdapter = localStorageAdapter) {
  return {
    getAll(): ConnectedAccount[] {
      const saved = storage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          logger.error("Failed to parse connected accounts from storage. Falling back to an empty connected account list.", {
            error: createAppError("STORAGE_ERROR", "Could not parse saved connected accounts.", e),
            storageKey: STORAGE_KEY,
          });
        }
      }
      return [];
    },

    saveAll(accounts: ConnectedAccount[]): void {
      storage.setItem(STORAGE_KEY, JSON.stringify(accounts));
    },

    replaceAll(accounts: ConnectedAccount[]): ConnectedAccount[] {
      this.saveAll(accounts);
      return accounts;
    },
  };
}

export const accountRepository = createAccountRepository();
