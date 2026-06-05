import { ConnectedAccount } from "../../domain/accounts/account.types";

export function buildConnectedAccount(
  overrides: Partial<ConnectedAccount> = {}
): ConnectedAccount {
  return {
    id: "mock-bank-checking-4820",
    providerId: "mock-bank",
    name: "Everyday Checking",
    displayName: "Everyday Checking",
    institutionName: "Mock Bank",
    providerName: "Mock Bank",
    type: "checking",
    accountType: "checking",
    lastFour: "4820",
    balance: 4250.75,
    currency: "EUR",
    isConnected: true,
    status: "connected",
    accessType: "read_only",
    connectionMode: "mock",
    ...overrides,
  };
}
