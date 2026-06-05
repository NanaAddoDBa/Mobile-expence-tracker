import {
  AvailableMockAccount,
  ConnectedAccount,
  MockAccountProvider,
} from "../../domain/accounts/account.types";
import { Expense } from "../../domain/expenses/expense.types";
import { getCurrentIsoTimestamp, getTodayDateString } from "../../lib/dateUtils";

const MOCK_PROVIDERS: MockAccountProvider[] = [
  {
    id: "mock-bank",
    name: "Mock Bank",
    description: "Checking and savings accounts for everyday spending.",
  },
  {
    id: "mock-card",
    name: "Mock Credit Card Provider",
    description: "Credit card accounts for imported card expenses.",
  },
  {
    id: "mock-wallet",
    name: "Mock Digital Wallet",
    description: "Digital wallet activity for small daily purchases.",
  },
];

const AVAILABLE_ACCOUNTS: Record<string, AvailableMockAccount[]> = {
  "mock-bank": [
    {
      id: "mock-bank-checking-4820",
      providerId: "mock-bank",
      providerName: "Mock Bank",
      displayName: "Everyday Checking",
      name: "Everyday Checking",
      accountType: "checking",
      type: "checking",
      institutionName: "Mock Bank",
      lastFour: "4820",
      balance: 4250.75,
      currency: "EUR",
    },
    {
      id: "mock-bank-savings-1188",
      providerId: "mock-bank",
      providerName: "Mock Bank",
      displayName: "Rainy Day Savings",
      name: "Rainy Day Savings",
      accountType: "savings",
      type: "savings",
      institutionName: "Mock Bank",
      lastFour: "1188",
      balance: 8200,
      currency: "EUR",
    },
  ],
  "mock-card": [
    {
      id: "mock-card-credit-9312",
      providerId: "mock-card",
      providerName: "Mock Credit Card Provider",
      displayName: "Rewards Credit Card",
      name: "Rewards Credit Card",
      accountType: "credit_card",
      type: "credit_card",
      institutionName: "Mock Credit Card Provider",
      lastFour: "9312",
      balance: -332.4,
      currency: "EUR",
    },
  ],
  "mock-wallet": [
    {
      id: "mock-wallet-digital-8841",
      providerId: "mock-wallet",
      providerName: "Mock Digital Wallet",
      displayName: "Digital Wallet",
      name: "Digital Wallet",
      accountType: "digital_wallet",
      type: "digital_wallet",
      institutionName: "Mock Digital Wallet",
      lastFour: "8841",
      balance: 145.2,
      currency: "EUR",
    },
  ],
};

const TRANSACTIONS_BY_ACCOUNT: Record<string, Omit<Expense, "id">[]> = {
  "mock-bank-checking-4820": [
    {
      merchant: "Aldi",
      description: "Imported grocery expense",
      amount: 42.35,
      date: getTodayDateString(),
      category: "Food & Grocery",
      accountSource: "mock-bank-checking-4820",
      sourceAccountId: "mock-bank-checking-4820",
      paymentMethod: "debit_card",
      isRecurring: false,
      entrySource: "connected_account",
      externalTransactionId: "mock-bank-checking-4820-tx-001",
    },
    {
      merchant: "City Transit",
      description: "Imported train ticket",
      amount: 12.8,
      date: getTodayDateString(),
      category: "Transport & Auto",
      accountSource: "mock-bank-checking-4820",
      sourceAccountId: "mock-bank-checking-4820",
      paymentMethod: "bank_transfer",
      isRecurring: false,
      entrySource: "connected_account",
      externalTransactionId: "mock-bank-checking-4820-tx-002",
    },
  ],
  "mock-bank-savings-1188": [],
  "mock-card-credit-9312": [
    {
      merchant: "Bookshop",
      description: "Imported card purchase",
      amount: 28.9,
      date: getTodayDateString(),
      category: "Education & Kids",
      accountSource: "mock-card-credit-9312",
      sourceAccountId: "mock-card-credit-9312",
      paymentMethod: "credit_card",
      isRecurring: false,
      entrySource: "connected_account",
      externalTransactionId: "mock-card-credit-9312-tx-001",
    },
  ],
  "mock-wallet-digital-8841": [
    {
      merchant: "Corner Cafe",
      description: "Imported digital wallet expense",
      amount: 6.4,
      date: getTodayDateString(),
      category: "Dining & Cafe",
      accountSource: "mock-wallet-digital-8841",
      sourceAccountId: "mock-wallet-digital-8841",
      paymentMethod: "digital_wallet",
      isRecurring: false,
      entrySource: "connected_account",
      externalTransactionId: "mock-wallet-digital-8841-tx-001",
    },
  ],
};

const wait = async () => new Promise((resolve) => setTimeout(resolve, 300));

export const mockBankingProvider = {
  listMockProviders(): MockAccountProvider[] {
    return MOCK_PROVIDERS;
  },

  async startMockConnection(): Promise<{ connectionId: string }> {
    await wait();
    return { connectionId: `mock-connection-${Date.now()}` };
  },

  async simulateMockAuthentication(providerId: string): Promise<{ providerId: string; authorized: boolean }> {
    await wait();
    return { providerId, authorized: true };
  },

  listAvailableMockAccounts(providerId: string): AvailableMockAccount[] {
    return AVAILABLE_ACCOUNTS[providerId] || [];
  },

  connectSelectedMockAccounts(providerId: string, accountIds: string[]): ConnectedAccount[] {
    const timestamp = getCurrentIsoTimestamp();
    const selected = this.listAvailableMockAccounts(providerId).filter((account) =>
      accountIds.includes(account.id)
    );

    return selected.map((account) => ({
      ...account,
      isConnected: true,
      status: "connected",
      accessType: "read_only",
      connectionMode: "mock",
      consentGrantedAt: timestamp,
      lastConnectionCheckAt: timestamp,
      importedExpenseCount: 0,
    }));
  },

  reconnectMockAccount(account: ConnectedAccount): ConnectedAccount {
    return {
      ...account,
      isConnected: true,
      status: "connected",
      connectionError: undefined,
      lastConnectionCheckAt: getCurrentIsoTimestamp(),
    };
  },

  removeMockConnection(accountId: string, accounts: ConnectedAccount[]): ConnectedAccount[] {
    return accounts.filter((account) => account.id !== accountId);
  },

  async importMockExpensesForAccount(accountId: string): Promise<Omit<Expense, "id">[]> {
    await wait();
    return (TRANSACTIONS_BY_ACCOUNT[accountId] || []).map((transaction) => ({
      ...transaction,
      importBatchId: `import-${accountId}`,
    }));
  },

  async importTransactions(account: ConnectedAccount): Promise<Omit<Expense, "id">[]> {
    return this.importMockExpensesForAccount(account.id);
  },
};
