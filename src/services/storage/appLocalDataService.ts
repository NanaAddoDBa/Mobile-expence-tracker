import { getCurrentIsoTimestamp, getTodayDateString } from "../../lib/dateUtils";
import { localStorageAdapter } from "./localStorageAdapter";
import { StorageAdapter } from "./storage.types";

export const APP_LOCAL_STORAGE_KEYS = [
  "exp_accounts",
  "exp_auth",
  "exp_budgets",
  "exp_goals",
  "exp_ledger",
  "income_ledger",
  "exp_notifications",
  "exp_onboarded",
  "exp_theme",
  "exp_user_profile",
] as const;

interface LocalAppDataExport {
  appName: "Expense Tracker & Budget Manager";
  exportedAt: string;
  storageKeys: string[];
  data: Record<string, unknown>;
}

interface DownloadExportOptions {
  exportedAt?: string;
  filenameDate?: string;
  storage?: StorageAdapter;
}

function parseStoredValue(value: string | null): unknown {
  if (value === null) return null;

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

export function getLocalAppDataExport(
  storage: StorageAdapter = localStorageAdapter,
  exportedAt = getCurrentIsoTimestamp()
): LocalAppDataExport {
  const data = APP_LOCAL_STORAGE_KEYS.reduce<Record<string, unknown>>((snapshot, key) => {
    snapshot[key] = parseStoredValue(storage.getItem(key));
    return snapshot;
  }, {});

  return {
    appName: "Expense Tracker & Budget Manager",
    exportedAt,
    storageKeys: [...APP_LOCAL_STORAGE_KEYS],
    data,
  };
}

export function downloadLocalAppDataExport({
  exportedAt = getCurrentIsoTimestamp(),
  filenameDate = getTodayDateString(),
  storage = localStorageAdapter,
}: DownloadExportOptions = {}): LocalAppDataExport {
  const snapshot = getLocalAppDataExport(storage, exportedAt);
  const blob = new Blob([JSON.stringify(snapshot, null, 2)], {
    type: "application/json",
  });
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = objectUrl;
  anchor.download = `expense-tracker-export-${filenameDate}.json`;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0);

  return snapshot;
}

export function clearLocalAppData(storage: StorageAdapter = localStorageAdapter): void {
  APP_LOCAL_STORAGE_KEYS.forEach((key) => storage.removeItem(key));
}
