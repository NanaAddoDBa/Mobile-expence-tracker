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
  externalAccounts: ExternalAccountResponse[];
  importedExpenseCount: number;
  lastImportedCount: number;
  lastSkippedDuplicateCount: number;
  lastImportFailedCount: number;
  lastImportMessage: string | null;
}

export interface ExternalAccountResponse {
  id: string;
  providerAccountId: string;
  displayName: string;
  accountType: "checking" | "savings" | "credit_card" | "digital_wallet";
  currency: CurrencyCode;
  isSelected: boolean;
}

type ConnectedAccountWithDetails = ConnectedAccount & {
  externalAccounts?: ExternalAccount[];
  importBatches?: ImportBatch[];
  _count?: {
    expenses?: number;
  };
};

export function toConnectedAccountResponse(
  account: ConnectedAccountWithDetails,
): ConnectedAccountResponse {
  const latestImport = account.importBatches?.[0];

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
    externalAccounts: (account.externalAccounts ?? []).map(toExternalAccountResponse),
    importedExpenseCount: account._count?.expenses ?? 0,
    lastImportedCount: latestImport?.importedCount ?? 0,
    lastSkippedDuplicateCount: latestImport?.skippedDuplicateCount ?? 0,
    lastImportFailedCount: latestImport?.failedCount ?? 0,
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
