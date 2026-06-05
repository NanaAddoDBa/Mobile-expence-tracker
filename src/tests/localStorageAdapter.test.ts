import { afterEach, describe, expect, test, vi } from "vitest";
import { localStorageAdapter } from "../services/storage/localStorageAdapter";

describe("localStorageAdapter", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("supports set, get, and remove behavior", () => {
    localStorageAdapter.setItem("expense-key", "stored-value");

    expect(localStorageAdapter.getItem("expense-key")).toBe("stored-value");

    localStorageAdapter.removeItem("expense-key");

    expect(localStorageAdapter.getItem("expense-key")).toBeNull();
  });

  test("falls back gracefully when browser storage is unavailable", () => {
    vi.stubGlobal("window", undefined);

    expect(localStorageAdapter.getItem("expense-key")).toBeNull();
    expect(() => localStorageAdapter.setItem("expense-key", "stored-value")).not.toThrow();
    expect(() => localStorageAdapter.removeItem("expense-key")).not.toThrow();
  });
});
