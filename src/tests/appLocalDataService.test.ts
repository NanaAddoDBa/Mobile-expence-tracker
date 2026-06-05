import { describe, expect, test, vi } from "vitest";
import {
  APP_LOCAL_STORAGE_KEYS,
  clearLocalAppData,
  downloadLocalAppDataExport,
  getLocalAppDataExport,
} from "../services/storage/appLocalDataService";

describe("appLocalDataService", () => {
  test("creates a local app data export snapshot", () => {
    localStorage.setItem("exp_ledger", JSON.stringify([{ id: "expense-1" }]));
    localStorage.setItem("unrelated_app_key", "keep-me");

    const snapshot = getLocalAppDataExport(undefined, "2026-06-05T10:00:00.000Z");

    expect(snapshot.appName).toBe("Expense Tracker & Budget Manager");
    expect(snapshot.exportedAt).toBe("2026-06-05T10:00:00.000Z");
    expect(snapshot.data.exp_ledger).toEqual([{ id: "expense-1" }]);
    expect(snapshot.data).not.toHaveProperty("unrelated_app_key");
  });

  test("downloads a JSON export file", () => {
    const createObjectURL = vi.fn(() => "blob:expense-export");
    const revokeObjectURL = vi.fn();
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => undefined);

    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: createObjectURL,
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: revokeObjectURL,
    });

    localStorage.setItem("exp_budgets", JSON.stringify([{ id: "budget-1" }]));

    const snapshot = downloadLocalAppDataExport({
      exportedAt: "2026-06-05T10:00:00.000Z",
      filenameDate: "2026-06-05",
    });

    expect(snapshot.data.exp_budgets).toEqual([{ id: "budget-1" }]);
    expect(createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
    expect(click).toHaveBeenCalledTimes(1);
  });

  test("clears only app-owned local data keys", () => {
    APP_LOCAL_STORAGE_KEYS.forEach((key) => localStorage.setItem(key, "stored"));
    localStorage.setItem("unrelated_app_key", "keep-me");

    clearLocalAppData();

    APP_LOCAL_STORAGE_KEYS.forEach((key) => {
      expect(localStorage.getItem(key)).toBeNull();
    });
    expect(localStorage.getItem("unrelated_app_key")).toBe("keep-me");
  });
});
