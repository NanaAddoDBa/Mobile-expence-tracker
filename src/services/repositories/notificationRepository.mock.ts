import { SystemNotification } from "../../domain/notifications/notification.types";
import { createAppError } from "../../lib/error/appError";
import { logger } from "../../lib/logger";
import { localStorageAdapter } from "../storage/localStorageAdapter";
import { StorageAdapter } from "../storage/storage.types";

const STORAGE_KEY = "exp_notifications";

export function createNotificationRepository(storage: StorageAdapter = localStorageAdapter) {
  return {
    getAll(): SystemNotification[] {
      const saved = storage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          logger.error("Failed to parse notifications from storage. Falling back to an empty notification list.", {
            error: createAppError("STORAGE_ERROR", "Could not parse saved notifications.", e),
            storageKey: STORAGE_KEY,
          });
        }
      }
      return [];
    },

    saveAll(notifications: SystemNotification[]): void {
      storage.setItem(STORAGE_KEY, JSON.stringify(notifications));
    },

    clear(): void {
      storage.removeItem(STORAGE_KEY);
    },
  };
}

export const notificationRepository = createNotificationRepository();
