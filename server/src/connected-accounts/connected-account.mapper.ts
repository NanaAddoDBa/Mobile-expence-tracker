import {
  AccountType as PrismaAccountType,
  ConnectedAccount,
  ConnectedAccountStatus,
  CurrencyCode,
  ExternalAccount,
  ImportBatch,
} from "@prisma/client";

export interface ConnectedAccountResponse {
  id: string;
  provider: string;
  providerConnectionId: string | null;
  displayName: string;
  accountType: "checking" | "savings" | "credit_card" | "digital_wallet";
  status: "connecting" | "connected" | "needs_reconnect" | "disconnected" | "error";
  currency: CurrencyCode;
  institutionName: string;
  consentExpiresAt: Date | null;
  lastImportAt: Date | null;
  lastSyncAt: Date | null;
  lastErrorCode: string | null;
  lastErrorMessage: string | null;
  currentBalanceMinor: number | null;
  availableBalanceMinor: number | null;
  balanceUpdatedAt: Date | null;
  externalAccounts: ExternalAccountResponse[];
  importedExpenseCount: number;
  importedIncomeCount: number;
  lastImportedCount: number;
  lastSkippedDuplicateCount: number;
  lastImportFailedCount: number;
  lastPendingCount: number;
  pendingTransactionCount: number;
  lastImportMessage: string | null;
}

export interface ExternalAccountResponse {
  id: string;
  providerAccountId: string;
  displayName: string;
  accountType: "checking" | "savings" | "credit_card" | "digital_wallet";
  currency: CurrencyCode;
  isSelected: boolean;
  currentBalanceMinor: number | null;
  availableBalanceMinor: number | null;
  balanceUpdatedAt: Date | null;
}

type ConnectedAccountWithDetails = ConnectedAccount & {
  externalAccounts?: ExternalAccount[];
  importBatches?: ImportBatch[];
  _count?: {
    expenses?: number;
    incomes?: number;
    externalTransactions?: number;
  };
};

export function toConnectedAccountResponse(
  account: ConnectedAccountWithDetails,
): ConnectedAccountResponse {
  const latestImport = account.importBatches?.[0];
  const selectedEuroAccounts = (account.externalAccounts ?? []).filter(
    (item) => item.isSelected && item.currency === CurrencyCode.EUR,
  );
  const currentBalances = selectedEuroAccounts
    .map((item) => item.currentBalanceMinor)
    .filter((value): value is number => value !== null);
  const availableBalances = selectedEuroAccounts
    .map((item) => item.availableBalanceMinor)
    .filter((value): value is number => value !== null);
  const balanceUpdatedAt = selectedEuroAccounts
    .map((item) => item.balanceUpdatedAt)
    .filter((value): value is Date => value !== null)
    .sort((left, right) => right.getTime() - left.getTime())[0] ?? null;

  return {
    id: account.id,
    provider: account.provider,
    providerConnectionId: account.providerConnectionId,
    displayName: account.displayName,
    accountType: toApiAccountType(account.accountType),
    status: toApiStatus(account.status),
    currency: account.currency,
    institutionName: account.providerInstitutionId || account.provider,
    consentExpiresAt: account.consentExpiresAt,
    lastImportAt: account.lastImportAt,
    lastSyncAt: account.lastSyncAt,
    lastErrorCode: account.lastErrorCode,
    lastErrorMessage: account.lastErrorMessage,
    currentBalanceMinor:
      currentBalances.length > 0
        ? currentBalances.reduce((sum, value) => sum + value, 0)
        : null,
    availableBalanceMinor:
      availableBalances.length > 0
        ? availableBalances.reduce((sum, value) => sum + value, 0)
        : null,
    balanceUpdatedAt,
    externalAccounts: (account.externalAccounts ?? []).map(toExternalAccountResponse),
    importedExpenseCount: account._count?.expenses ?? 0,
    importedIncomeCount: account._count?.incomes ?? 0,
    lastImportedCount: latestImport?.importedCount ?? 0,
    lastSkippedDuplicateCount: latestImport?.skippedDuplicateCount ?? 0,
    lastImportFailedCount: latestImport?.failedCount ?? 0,
    lastPendingCount: latestImport?.pendingCount ?? 0,
    pendingTransactionCount: account._count?.externalTransactions ?? 0,
    lastImportMessage: latestImport?.message ?? account.lastErrorMessage,
  };
}

function toExternalAccountResponse(account: ExternalAccount): ExternalAccountResponse {
  return {
    id: account.id,
    providerAccountId: account.providerAccountId,
    displayName: account.displayName,
    accountType: toApiAccountType(account.accountType),
    currency: account.currency,
    isSelected: account.isSelected,
    currentBalanceMinor: account.currentBalanceMinor,
    availableBalanceMinor: account.availableBalanceMinor,
    balanceUpdatedAt: account.balanceUpdatedAt,
  };
}

function toApiStatus(
  status: ConnectedAccountStatus,
): ConnectedAccountResponse["status"] {
  const mappings: Record<ConnectedAccountStatus, ConnectedAccountResponse["status"]> = {
    [ConnectedAccountStatus.CONNECTING]: "connecting",
    [ConnectedAccountStatus.CONNECTED]: "connected",
    [ConnectedAccountStatus.NEEDS_RECONNECT]: "needs_reconnect",
    [ConnectedAccountStatus.DISCONNECTED]: "disconnected",
    [ConnectedAccountStatus.ERROR]: "error",
  };

  return mappings[status];
}

function toApiAccountType(
  accountType: PrismaAccountType,
): ExternalAccountResponse["accountType"] {
  const mappings: Record<PrismaAccountType, ExternalAccountResponse["accountType"]> = {
    [PrismaAccountType.CHECKING]: "checking",
    [PrismaAccountType.SAVINGS]: "savings",
    [PrismaAccountType.CREDIT_CARD]: "credit_card",
    [PrismaAccountType.DIGITAL_WALLET]: "digital_wallet",
  };

  return mappings[accountType];
}
