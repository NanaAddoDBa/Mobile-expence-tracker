import { describe, expect, test } from "vitest";
import { createMemoryStorageAdapter } from "../services/storage/memoryStorageAdapter";

describe("memoryStorageAdapter", () => {
  test("supports set, get, and remove behavior", () => {
    const storage = createMemoryStorageAdapter();

    storage.setItem("expense-key", "stored-value");

    expect(storage.getItem("expense-key")).toBe("stored-value");

    storage.removeItem("expense-key");

    expect(storage.getItem("expense-key")).toBeNull();
  });

  test("can be seeded with initial values", () => {
    const storage = createMemoryStorageAdapter({
      "expense-key": "seeded-value",
    });

    expect(storage.getItem("expense-key")).toBe("seeded-value");
  });
});
