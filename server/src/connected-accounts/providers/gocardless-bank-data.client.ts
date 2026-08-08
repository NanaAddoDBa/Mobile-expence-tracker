import {
  BadGatewayException,
  Injectable,
  ServiceUnavailableException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

export interface GoCardlessInstitution {
  id: string;
  name: string;
  bic?: string;
  countries?: string[];
  logo?: string;
  transaction_total_days?: string;
  max_access_valid_for_days?: string;
}

interface GoCardlessTokenResponse {
  access?: string;
  access_expires?: number;
  refresh?: string;
  refresh_expires?: number;
}

interface GoCardlessAgreementResponse {
  id: string;
  access_valid_for_days?: number;
}

export interface GoCardlessRequisitionResponse {
  id: string;
  status: string;
  link?: string;
  accounts: string[];
  institution_id: string;
  agreement?: string;
  reference?: string;
}

export interface GoCardlessAccountDetailsResponse {
  account?: {
    resourceId?: string;
    iban?: string;
    bban?: string;
    currency?: string;
    ownerName?: string;
    name?: string;
    displayName?: string;
    product?: string;
    cashAccountType?: string;
    maskedPan?: string;
  };
}

export interface GoCardlessTransaction {
  transactionId?: string;
  bookingDate?: string;
  valueDate?: string;
  debtorName?: string;
  creditorName?: string;
  remittanceInformationUnstructured?: string;
  additionalInformation?: string;
  bankTransactionCode?: string;
  transactionAmount: {
    currency: string;
    amount: string;
  };
}

export interface GoCardlessTransactionsResponse {
  transactions?: {
    booked?: GoCardlessTransaction[];
    pending?: GoCardlessTransaction[];
  };
}

interface CachedAccessToken {
  token: string;
  expiresAt: number;
}

@Injectable()
export class GoCardlessBankDataClient {
  private cachedAccessToken: CachedAccessToken | null = null;

  constructor(private readonly config: ConfigService) {}

  async listInstitutions(country: string): Promise<GoCardlessInstitution[]> {
    const accessToken = await this.getAccessToken();
    return this.request<GoCardlessInstitution[]>(
      `/institutions/?country=${encodeURIComponent(country.toLowerCase())}`,
      { accessToken },
    );
  }

  async createAgreement(institutionId: string): Promise<GoCardlessAgreementResponse> {
    const accessToken = await this.getAccessToken();
    return this.request<GoCardlessAgreementResponse>("/agreements/enduser/", {
      method: "POST",
      accessToken,
      body: {
        institution_id: institutionId,
        max_historical_days: 730,
        access_valid_for_days: 90,
        access_scope: ["details", "balances", "transactions"],
      },
    });
  }

  async createRequisition(input: {
    redirectUrl: string;
    institutionId: string;
    reference: string;
    agreementId?: string;
    userLanguage?: string;
  }): Promise<GoCardlessRequisitionResponse> {
    const accessToken = await this.getAccessToken();
    return this.request<GoCardlessRequisitionResponse>("/requisitions/", {
      method: "POST",
      accessToken,
      body: {
        redirect: input.redirectUrl,
        institution_id: input.institutionId,
        reference: input.reference,
        account_selection: true,
        ...(input.agreementId ? { agreement: input.agreementId } : {}),
        ...(input.userLanguage ? { user_language: input.userLanguage.toUpperCase() } : {}),
      },
    });
  }

  async getRequisition(requisitionId: string): Promise<GoCardlessRequisitionResponse> {
    const accessToken = await this.getAccessToken();
    return this.request<GoCardlessRequisitionResponse>(
      `/requisitions/${encodeURIComponent(requisitionId)}/`,
      { accessToken },
    );
  }

  async getAccountDetails(accountId: string): Promise<GoCardlessAccountDetailsResponse> {
    const accessToken = await this.getAccessToken();
    return this.request<GoCardlessAccountDetailsResponse>(
      `/accounts/${encodeURIComponent(accountId)}/details/`,
      { accessToken },
    );
  }

  async getAccountTransactions(accountId: string): Promise<GoCardlessTransactionsResponse> {
    const accessToken = await this.getAccessToken();
    return this.request<GoCardlessTransactionsResponse>(
      `/accounts/${encodeURIComponent(accountId)}/transactions/`,
      { accessToken },
    );
  }

  private async getAccessToken(): Promise<string> {
    if (this.cachedAccessToken && this.cachedAccessToken.expiresAt > Date.now() + 60_000) {
      return this.cachedAccessToken.token;
    }

    const secretId = this.config.get<string>("GOCARDLESS_SECRET_ID");
    const secretKey = this.config.get<string>("GOCARDLESS_SECRET_KEY");

    if (!secretId || !secretKey) {
      throw new ServiceUnavailableException(
        "GoCardless Bank Account Data credentials are not configured",
      );
    }

    const freshToken = await this.request<GoCardlessTokenResponse>("/token/new/", {
      method: "POST",
      body: {
        secret_id: secretId,
        secret_key: secretKey,
      },
      skipAuth: true,
    });

    if (freshToken.access) {
      this.cachedAccessToken = {
        token: freshToken.access,
        expiresAt: Date.now() + (freshToken.access_expires ?? 3600) * 1000,
      };
      return freshToken.access;
    }

    if (!freshToken.refresh) {
      throw new BadGatewayException("GoCardless did not return an access token");
    }

    const refreshedToken = await this.request<GoCardlessTokenResponse>("/token/refresh/", {
      method: "POST",
      body: { refresh: freshToken.refresh },
      skipAuth: true,
    });

    if (!refreshedToken.access) {
      throw new BadGatewayException("GoCardless did not return a refreshed access token");
    }

    this.cachedAccessToken = {
      token: refreshedToken.access,
      expiresAt: Date.now() + (refreshedToken.access_expires ?? 3600) * 1000,
    };
    return refreshedToken.access;
  }

  private async request<T>(
    path: string,
    options: {
      method?: "GET" | "POST";
      accessToken?: string;
      body?: Record<string, unknown>;
      skipAuth?: boolean;
    } = {},
  ): Promise<T> {
    const baseUrl =
      this.config.get<string>("GOCARDLESS_BANK_DATA_BASE_URL") ??
      "https://bankaccountdata.gocardless.com/api/v2";
    const response = await fetch(`${baseUrl}${path}`, {
      method: options.method ?? "GET",
      headers: {
        accept: "application/json",
        ...(options.body ? { "content-type": "application/json" } : {}),
        ...(options.skipAuth ? {} : { authorization: `Bearer ${options.accessToken}` }),
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new BadGatewayException(
        `GoCardless request failed (${response.status}): ${detail.slice(0, 300)}`,
      );
    }

    return (await response.json()) as T;
  }
}
