import { BankInstitution, ConnectedAccount } from "../../domain/accounts/account.types";
import { mockBankingProvider } from "../adapters/mockBankingProvider";
import { AccountApi } from "./api.types";
import { USES_HTTP_API } from "./apiMode";
import { requestJson } from "./httpClient";
import { accountRepository } from "../repositories/accountRepository.mock";

interface ConnectedAccountResponse {
  id: string;
  provider: string;
  providerConnectionId: string | null;
  displayName: string;
  accountType: "checking" | "savings" | "credit_card" | "digital_wallet";
  status: "connecting" | "connected" | "needs_reconnect" | "disconnected" | "error";
  currency: string;
  institutionName: string;
  consentExpiresAt: string | null;
  lastImportAt: string | null;
  lastSyncAt: string | null;
  lastErrorCode: string | null;
  lastErrorMessage: string | null;
  importedExpenseCount: number;
  lastImportedCount: number;
  lastSkippedDuplicateCount: number;
  lastImportFailedCount: number;
  lastImportMessage: string | null;
  externalAccounts: Array<{
    id: string;
    providerAccountId: string;
    displayName: string;
    accountType: "checking" | "savings" | "credit_card" | "digital_wallet";
    currency: string;
    isSelected: boolean;
  }>;
}

interface ListConnectedAccountsResponse {
  data: {
    accounts: ConnectedAccountResponse[];
  };
}

interface BankInstitutionResponse {
  id: string;
  name: string;
  bic?: string | null;
  countries?: string[];
  logo?: string | null;
  transaction_total_days?: string | number | null;
  max_access_valid_for_days?: string | number | null;
}

interface ListBankInstitutionsResponse {
  data: {
    institutions: BankInstitutionResponse[];
  };
}

interface StartBankConnectionResponse {
  data: {
    connection: ConnectedAccountResponse;
    linkUrl: string;
  };
}

interface ImportConnectedAccountResponse {
  data: {
    result: {
      importBatchId: string;
      importedCount: number;
      skippedDuplicateCount: number;
      failedCount: number;
      message: string;
    };
  };
}

const mockAccountApi: AccountApi = {
  async listConnectedAccounts() {
    return accountRepository.getAll();
  },

  async listBankInstitutions(country = "DE") {
    return mockBankingProvider.listMockProviders().map((provider) => ({
      id: provider.id,
      name: provider.name,
      countries: [country],
    }));
  },

  async startBankConnection() {
    throw new Error("Real bank connection is unavailable in mock mode.");
  },

  async importConnectedAccount() {
    throw new Error("Real bank import is unavailable in mock mode.");
  },

  async deleteConnectedAccount(accountId) {
    const nextAccounts = accountRepository.getAll().filter((account) => account.id !== accountId);
    accountRepository.replaceAll(nextAccounts);
  },

  async replaceConnectedAccounts(accounts) {
    return accountRepository.replaceAll(accounts);
  },
};

const httpAccountApi: AccountApi = {
  async listConnectedAccounts() {
    const response = await requestJson<ListConnectedAccountsResponse>("/connected-accounts");
    return response.data.accounts.map(fromApiConnectedAccount);
  },

  async listBankInstitutions(country = "DE") {
    const response = await requestJson<ListBankInstitutionsResponse>(
      `/connected-accounts/institutions?country=${encodeURIComponent(country)}`
    );

    return response.data.institutions.map(fromApiBankInstitution);
  },

  async startBankConnection(input = {}) {
    const response = await requestJson<StartBankConnectionResponse>(
      "/connected-accounts/link/start",
      {
        method: "POST",
        body: JSON.stringify(input),
      }
    );

    return {
      linkUrl: response.data.linkUrl,
      account: fromApiConnectedAccount(response.data.connection),
    };
  },

  async importConnectedAccount(accountId) {
    const response = await requestJson<ImportConnectedAccountResponse>(
      `/connected-accounts/${accountId}/import`,
      { method: "POST" }
    );
    return response.data.result;
  },

  async deleteConnectedAccount(accountId) {
    await requestJson<{ data: { success: true } }>(`/connected-accounts/${accountId}`, {
      method: "DELETE",
    });
  },

  async replaceConnectedAccounts() {
    return this.listConnectedAccounts();
  },
};

export const accountApi: AccountApi = USES_HTTP_API
  ? httpAccountApi
  : mockAccountApi;

function fromApiConnectedAccount(account: ConnectedAccountResponse): ConnectedAccount {
  const primaryExternalAccount = account.externalAccounts[0];

  return {
    id: account.id,
    providerId: account.provider,
    providerName: "GoCardless Bank Account Data",
    displayName: account.displayName,
    name: account.displayName,
    accountType: primaryExternalAccount?.accountType || account.accountType,
    type: primaryExternalAccount?.accountType || account.accountType,
    institutionName: account.institutionName || "GoCardless Bank Account Data",
    balance: 0,
    currency: account.currency,
    isConnected: account.status === "connected",
    status: account.status,
    accessType: "read_only" as const,
    connectionMode: "real" as const,
    lastImportedAt: account.lastImportAt || undefined,
    consentGrantedAt: account.consentExpiresAt || undefined,
    lastConnectionCheckAt: account.lastSyncAt || undefined,
    connectionError: account.lastErrorMessage || undefined,
    importedExpenseCount: account.importedExpenseCount,
    lastImportMessage: account.lastImportMessage || undefined,
    lastImportedCount: account.lastImportedCount,
    lastSkippedDuplicateCount: account.lastSkippedDuplicateCount,
    lastImportFailedCount: account.lastImportFailedCount,
  };
}

function fromApiBankInstitution(institution: BankInstitutionResponse): BankInstitution {
  return {
    id: institution.id,
    name: institution.name,
    bic: institution.bic || undefined,
    countries: institution.countries,
    logo: institution.logo || undefined,
    transactionTotalDays: parseOptionalNumber(institution.transaction_total_days),
    maxAccessValidForDays: parseOptionalNumber(institution.max_access_valid_for_days),
  };
}

function parseOptionalNumber(value: string | number | null | undefined): number | undefined {
  if (value === null || value === undefined || value === "") return undefined;

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}
