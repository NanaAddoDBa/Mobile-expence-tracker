export type AccountType =
  | "checking"
  | "savings"
  | "credit_card"
  | "digital_wallet";
export type AccountProvider = string;
export type ConnectedAccountStatus =
  | "connecting"
  | "connected"
  | "needs_reconnect"
  | "disconnected"
  | "importing"
  | "error";
export type ConnectedAccountAccessType = "read_only";
export type ConnectedAccountMode = "mock" | "real";

export interface BankInstitution {
  id: string;
  name: string;
  bic?: string;
  countries?: string[];
  logo?: string;
  transactionTotalDays?: number;
  maxAccessValidForDays?: number;
}

export interface StartBankConnectionInput {
  institutionId?: string;
  country?: string;
  userLanguage?: string;
}

export interface ConnectedAccount {
  id: string;
  displayName?: string;
  name: string;
  accountType?: AccountType;
  type: AccountType;
  providerName?: AccountProvider;
  institutionName: AccountProvider;
  providerId?: string;
  lastFour?: string;
  balance: number;
  availableBalance?: number;
  balanceUpdatedAt?: string;
  currency: string;
  isConnected: boolean;
  status?: ConnectedAccountStatus;
  accessType?: ConnectedAccountAccessType;
  connectionMode?: ConnectedAccountMode;
  lastImportedAt?: string;
  consentGrantedAt?: string;
  lastConnectionCheckAt?: string;
  selectedForImport?: boolean;
  connectionError?: string;
  importedExpenseCount?: number;
  importedIncomeCount?: number;
  lastImportMessage?: string;
  lastImportedCount?: number;
  lastSkippedDuplicateCount?: number;
  lastImportFailedCount?: number;
  pendingTransactionCount?: number;
  lastPendingCount?: number;
}

export interface MockAccountProvider {
  id: string;
  name: string;
  description: string;
}

export type AvailableMockAccount = Omit<
  ConnectedAccount,
  | "isConnected"
  | "status"
  | "accessType"
  | "connectionMode"
  | "lastImportedAt"
  | "consentGrantedAt"
  | "lastConnectionCheckAt"
  | "selectedForImport"
  | "connectionError"
  | "importedExpenseCount"
>;
