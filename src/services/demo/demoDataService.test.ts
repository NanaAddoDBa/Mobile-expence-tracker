import { describe, expect, test } from "vitest";
import {
  clearDemoData,
  DEMO_DATA_STORAGE_KEYS,
  hasUserData,
  loadStarterDemoData,
  resetDemoData,
} from "./demoDataService";
import { createMemoryStorageAdapter } from "../storage/memoryStorageAdapter";

describe("demoDataService", () => {
  test("loadStarterDemoData writes starter expenses, budgets, and goals", () => {
    const storage = createMemoryStorageAdapter();

    const result = loadStarterDemoData(storage);

    expect(result).toMatchObject({
      expenses: 14,
      budgets: 10,
      goals: 3,
      accounts: 2,
    });
    expect(JSON.parse(storage.getItem("exp_ledger") || "[]")).toHaveLength(14);
    expect(JSON.parse(storage.getItem("exp_budgets") || "[]")).toHaveLength(10);
    expect(JSON.parse(storage.getItem("exp_goals") || "[]")).toHaveLength(3);
    expect(JSON.parse(storage.getItem("exp_accounts") || "[]")).toHaveLength(2);
    expect(hasUserData(storage)).toBe(true);
  });

  test("resetDemoData replaces existing product data with starter data", () => {
    const storage = createMemoryStorageAdapter();
    storage.setItem("exp_ledger", JSON.stringify([{ id: "custom-expense" }]));
    storage.setItem("exp_accounts", JSON.stringify([{ id: "connected-account" }]));

    const result = resetDemoData(storage);

    expect(result.expenses).toBe(14);
    expect(JSON.parse(storage.getItem("exp_ledger") || "[]")[0].id).toBe("exp-rec-1");
    expect(result.accounts).toBe(2);
    expect(JSON.parse(storage.getItem("exp_accounts") || "[]")).toHaveLength(2);
  });

  test("clearDemoData clears product data while leaving auth and onboarding state alone", () => {
    const storage = createMemoryStorageAdapter();
    DEMO_DATA_STORAGE_KEYS.forEach((key) => storage.setItem(key, "stored"));
    storage.setItem("exp_auth", "true");
    storage.setItem("exp_onboarded", "true");

    clearDemoData(storage);

    DEMO_DATA_STORAGE_KEYS.forEach((key) => expect(storage.getItem(key)).toBeNull());
    expect(storage.getItem("exp_auth")).toBe("true");
    expect(storage.getItem("exp_onboarded")).toBe("true");
    expect(hasUserData(storage)).toBe(false);
  });
});
