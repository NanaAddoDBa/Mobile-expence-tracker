import { describe, expect, test } from "vitest";
import { mockBankingProvider } from "../services/adapters/mockBankingProvider";

describe("mockBankingProvider", () => {
  test("lists mock providers without cash as a connected provider", () => {
    const providers = mockBankingProvider.listMockProviders();

    expect(providers.map((provider) => provider.name)).toEqual([
      "Mock Bank",
      "Mock Credit Card Provider",
      "Mock Digital Wallet",
    ]);
    expect(providers.some((provider) => provider.name.toLowerCase().includes("cash"))).toBe(false);
  });

  test("connects selected mock accounts as read-only mock connections", () => {
    const accounts = mockBankingProvider.connectSelectedMockAccounts("mock-bank", [
      "mock-bank-checking-4820",
    ]);

    expect(accounts).toHaveLength(1);
    expect(accounts[0]).toMatchObject({
      id: "mock-bank-checking-4820",
      status: "connected",
      accessType: "read_only",
      connectionMode: "mock",
      isConnected: true,
    });
  });

  test("imported expenses include stable source metadata", async () => {
    const account = mockBankingProvider.connectSelectedMockAccounts("mock-bank", [
      "mock-bank-checking-4820",
    ])[0];

    const expenses = await mockBankingProvider.importMockExpensesForAccount(account.id);

    expect(expenses.length).toBeGreaterThan(0);
    expect(expenses[0].entrySource).toBe("connected_account");
    expect(expenses[0].sourceAccountId).toBe("mock-bank-checking-4820");
    expect(expenses[0].externalTransactionId).toBe("mock-bank-checking-4820-tx-001");
  });

  test("does not import savings transfers as expenses", async () => {
    const account = mockBankingProvider.connectSelectedMockAccounts("mock-bank", [
      "mock-bank-savings-1188",
    ])[0];

    const expenses = await mockBankingProvider.importMockExpensesForAccount(account.id);

    expect(expenses).toEqual([]);
  });
});
