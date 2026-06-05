import { ConnectedAccount } from "../../../domain/accounts/account.types";
import { mockBankingProvider } from "../../../services/adapters/mockBankingProvider";

export const accountConnectionService = {
  getAvailableProviders() {
    return mockBankingProvider.listMockProviders();
  },

  startConnection() {
    return mockBankingProvider.startMockConnection();
  },

  simulateProviderAuthorization(providerId: string) {
    return mockBankingProvider.simulateMockAuthentication(providerId);
  },

  getAvailableAccountsForProvider(providerId: string) {
    return mockBankingProvider.listAvailableMockAccounts(providerId);
  },

  connectSelectedAccounts(providerId: string, selectedAccountIds: string[]): ConnectedAccount[] {
    return mockBankingProvider.connectSelectedMockAccounts(providerId, selectedAccountIds);
  },

  reconnectAccount(account: ConnectedAccount): ConnectedAccount {
    return mockBankingProvider.reconnectMockAccount(account);
  },

  removeAccountConnection(accountId: string, accounts: ConnectedAccount[]): ConnectedAccount[] {
    return mockBankingProvider.removeMockConnection(accountId, accounts);
  },
};
