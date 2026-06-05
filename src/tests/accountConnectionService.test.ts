import { describe, expect, test } from "vitest";
import { buildConnectedAccount } from "./builders/accountBuilder";
import { accountConnectionService } from "../features/accounts/services/accountConnectionService";

describe("accountConnectionService", () => {
  test("returns mock account providers", () => {
    const providers = accountConnectionService.getAvailableProviders();

    expect(providers.length).toBeGreaterThan(0);
    expect(providers[0]).toMatchObject({
      id: expect.any(String),
      name: expect.any(String),
    });
  });

  test("starts a mock connection and authorizes the selected provider", async () => {
    const connection = await accountConnectionService.startConnection();
    const authorization = await accountConnectionService.simulateProviderAuthorization("mock-bank");

    expect(connection.connectionId).toMatch(/^mock-connection-/);
    expect(authorization).toEqual({
      providerId: "mock-bank",
      authorized: true,
    });
  });

  test("returns available accounts for a provider", () => {
    const accounts = accountConnectionService.getAvailableAccountsForProvider("mock-bank");

    expect(accounts.map((account) => account.id)).toContain("mock-bank-checking-4820");
  });

  test("connects selected accounts as read-only mock accounts", () => {
    const [account] = accountConnectionService.connectSelectedAccounts("mock-bank", [
      "mock-bank-checking-4820",
    ]);

    expect(account).toMatchObject({
      id: "mock-bank-checking-4820",
      isConnected: true,
      status: "connected",
      accessType: "read_only",
      connectionMode: "mock",
    });
  });

  test("reconnect updates an account to connected status", () => {
    const account = buildConnectedAccount({
      status: "needs_reconnect",
      isConnected: false,
    });

    const reconnected = accountConnectionService.reconnectAccount(account);

    expect(reconnected.status).toBe("connected");
    expect(reconnected.isConnected).toBe(true);
    expect(reconnected.lastConnectionCheckAt).toBeDefined();
  });

  test("remove account removes only the selected connection", () => {
    const kept = buildConnectedAccount({ id: "kept-account", name: "Kept Account" });
    const removed = buildConnectedAccount({ id: "removed-account", name: "Removed Account" });

    const accounts = accountConnectionService.removeAccountConnection("removed-account", [
      kept,
      removed,
    ]);

    expect(accounts.map((account) => account.id)).toEqual(["kept-account"]);
  });
});
