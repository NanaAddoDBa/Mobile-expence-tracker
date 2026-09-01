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

export type GoCardlessRequisitionStatus =
  | string
  | { short?: string; long?: string };

export interface GoCardlessRequisitionResponse {
  id: string;
  status: GoCardlessRequisitionStatus;
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

export interface GoCardlessBalance {
  balanceAmount: {
    amount: string;
    currency: string;
  };
  balanceType?: string;
  referenceDate?: string;
  lastChangeDateTime?: string;
}

export interface GoCardlessBalancesResponse {
  balances?: GoCardlessBalance[];
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
  last_updated?: string;
}

interface CachedToken {
  token: string;
  expiresAt: number;
}

interface RequestOptions {
  method?: "GET" | "POST" | "DELETE";
  accessToken?: string;
  body?: Record<string, unknown>;
  skipAuth?: boolean;
  allowNotFound?: boolean;
}

export class GoCardlessRequestError extends BadGatewayException {
  constructor(
    readonly providerStatus: number,
    message: string,
  ) {
    super(message);
  }
}

@Injectable()
export class GoCardlessBankDataClient {
  private cachedAccessToken: CachedToken | null = null;
  private cachedRefreshToken: CachedToken | null = null;
  private pendingTokenRequest: Promise<string> | null = null;

  constructor(private readonly config: ConfigService) {}

  async listInstitutions(country: string): Promise<GoCardlessInstitution[]> {
    const accessToken = await this.getAccessToken();
    return this.request<GoCardlessInstitution[]>(
      `/institutions/?country=${encodeURIComponent(country.toLowerCase())}`,
      { accessToken },
    );
  }

  async createAgreement(
    institutionId: string,
  ): Promise<GoCardlessAgreementResponse> {
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
        ...(input.userLanguage
          ? { user_language: input.userLanguage.toUpperCase() }
          : {}),
      },
    });
  }

  async getRequisition(
    requisitionId: string,
  ): Promise<GoCardlessRequisitionResponse> {
    const accessToken = await this.getAccessToken();
    return this.request<GoCardlessRequisitionResponse>(
      `/requisitions/${encodeURIComponent(requisitionId)}/`,
      { accessToken },
    );
  }

  async deleteRequisition(requisitionId: string): Promise<void> {
    const accessToken = await this.getAccessToken();
    await this.request<unknown>(
      `/requisitions/${encodeURIComponent(requisitionId)}/`,
      {
        method: "DELETE",
        accessToken,
        allowNotFound: true,
      },
    );
  }

  async getAccountDetails(
    accountId: string,
  ): Promise<GoCardlessAccountDetailsResponse> {
    const accessToken = await this.getAccessToken();
    return this.request<GoCardlessAccountDetailsResponse>(
      `/accounts/${encodeURIComponent(accountId)}/details/`,
      { accessToken },
    );
  }

  async getAccountBalances(
    accountId: string,
  ): Promise<GoCardlessBalancesResponse> {
    const accessToken = await this.getAccessToken();
    return this.request<GoCardlessBalancesResponse>(
      `/accounts/${encodeURIComponent(accountId)}/balances/`,
      { accessToken },
    );
  }

  async getAccountTransactions(
    accountId: string,
    input: { dateFrom?: string; dateTo?: string } = {},
  ): Promise<GoCardlessTransactionsResponse> {
    const accessToken = await this.getAccessToken();
    const query = new URLSearchParams();
    if (input.dateFrom) query.set("date_from", input.dateFrom);
    if (input.dateTo) query.set("date_to", input.dateTo);
    const suffix = query.size > 0 ? `?${query.toString()}` : "";

    return this.request<GoCardlessTransactionsResponse>(
      `/accounts/${encodeURIComponent(accountId)}/transactions/${suffix}`,
      { accessToken },
    );
  }

  private async getAccessToken(): Promise<string> {
    if (this.isUsable(this.cachedAccessToken)) {
      return this.cachedAccessToken.token;
    }

    if (!this.pendingTokenRequest) {
      this.pendingTokenRequest = this.refreshAccessToken().finally(() => {
        this.pendingTokenRequest = null;
      });
    }

    return this.pendingTokenRequest;
  }

  private async refreshAccessToken(): Promise<string> {
    if (this.isUsable(this.cachedRefreshToken)) {
      try {
        const refreshed = await this.request<GoCardlessTokenResponse>(
          "/token/refresh/",
          {
            method: "POST",
            body: { refresh: this.cachedRefreshToken.token },
            skipAuth: true,
          },
        );
        return this.cacheTokenResponse(refreshed);
      } catch {
        this.cachedRefreshToken = null;
      }
    }

    const secretId = this.config.get<string>("GOCARDLESS_SECRET_ID");
    const secretKey = this.config.get<string>("GOCARDLESS_SECRET_KEY");

    if (!secretId || !secretKey) {
      throw new ServiceUnavailableException(
        "GoCardless Bank Account Data credentials are not configured",
      );
    }

    const fresh = await this.request<GoCardlessTokenResponse>("/token/new/", {
      method: "POST",
      body: {
        secret_id: secretId,
        secret_key: secretKey,
      },
      skipAuth: true,
    });
    return this.cacheTokenResponse(fresh);
  }

  private cacheTokenResponse(response: GoCardlessTokenResponse): string {
    if (!response.access) {
      throw new BadGatewayException(
        "GoCardless did not return an access token",
      );
    }

    this.cachedAccessToken = {
      token: response.access,
      expiresAt: Date.now() + (response.access_expires ?? 86_400) * 1_000,
    };
    if (response.refresh) {
      this.cachedRefreshToken = {
        token: response.refresh,
        expiresAt: Date.now() + (response.refresh_expires ?? 2_592_000) * 1_000,
      };
    }
    return response.access;
  }

  private isUsable(token: CachedToken | null): token is CachedToken {
    return Boolean(token && token.expiresAt > Date.now() + 60_000);
  }

  private async request<T>(
    path: string,
    options: RequestOptions = {},
  ): Promise<T> {
    const method = options.method ?? "GET";
    const canRetry = method === "GET" || method === "DELETE";
    const maxRetries = canRetry
      ? this.getIntegerConfig("GOCARDLESS_MAX_RETRIES", 2, 0, 4)
      : 0;
    let lastError: unknown;

    for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
      const controller = new AbortController();
      const timeout = setTimeout(
        () => controller.abort(),
        this.getIntegerConfig(
          "GOCARDLESS_REQUEST_TIMEOUT_MS",
          10_000,
          1_000,
          60_000,
        ),
      );

      try {
        const baseUrl =
          this.config.get<string>("GOCARDLESS_BANK_DATA_BASE_URL") ??
          "https://bankaccountdata.gocardless.com/api/v2";
        const response = await fetch(`${baseUrl}${path}`, {
          method,
          headers: {
            accept: "application/json",
            ...(options.body ? { "content-type": "application/json" } : {}),
            ...(options.skipAuth
              ? {}
              : { authorization: `Bearer ${options.accessToken}` }),
          },
          body: options.body ? JSON.stringify(options.body) : undefined,
          signal: controller.signal,
        });

        if (options.allowNotFound && response.status === 404) {
          return undefined as T;
        }
        if (response.ok) {
          const body = await response.text();
          return (body ? JSON.parse(body) : undefined) as T;
        }

        const message = await this.readProviderError(response);
        const error = new GoCardlessRequestError(response.status, message);
        if (!this.shouldRetry(response.status, attempt, maxRetries)) {
          throw error;
        }
        lastError = error;
        await delay(this.getRetryDelay(response, attempt));
      } catch (error) {
        if (error instanceof GoCardlessRequestError) {
          if (!this.shouldRetry(error.providerStatus, attempt, maxRetries)) {
            throw error;
          }
          lastError = error;
          continue;
        }

        const requestError = new ServiceUnavailableException(
          isAbortError(error)
            ? "GoCardless request timed out"
            : "GoCardless request could not be completed",
        );
        if (attempt >= maxRetries) {
          throw requestError;
        }
        lastError = requestError;
        await delay(Math.min(250 * 2 ** attempt, 2_000));
      } finally {
        clearTimeout(timeout);
      }
    }

    throw (
      lastError ||
      new ServiceUnavailableException(
        "GoCardless request could not be completed",
      )
    );
  }

  private shouldRetry(
    status: number,
    attempt: number,
    maxRetries: number,
  ): boolean {
    return (
      attempt < maxRetries &&
      (status === 429 || status === 500 || status === 502 || status === 503 || status === 504)
    );
  }

  private getRetryDelay(response: Response, attempt: number): number {
    const retryAfter = response.headers.get("retry-after");
    if (retryAfter) {
      const seconds = Number(retryAfter);
      if (Number.isFinite(seconds)) {
        return Math.min(Math.max(seconds * 1_000, 0), 5_000);
      }

      const date = Date.parse(retryAfter);
      if (Number.isFinite(date)) {
        return Math.min(Math.max(date - Date.now(), 0), 5_000);
      }
    }
    return Math.min(250 * 2 ** attempt, 2_000);
  }

  private async readProviderError(response: Response): Promise<string> {
    const body = (await response.text()).slice(0, 1_000);
    try {
      const parsed = JSON.parse(body) as {
        summary?: string;
        detail?: string;
      };
      const detail = [parsed.summary, parsed.detail].filter(Boolean).join(": ");
      return `GoCardless request failed (${response.status})${
        detail ? `: ${detail.slice(0, 300)}` : ""
      }`;
    } catch {
      return `GoCardless request failed (${response.status})`;
    }
  }

  private getIntegerConfig(
    key: string,
    fallback: number,
    minimum: number,
    maximum: number,
  ): number {
    const value = Number(this.config.get<string>(key));
    return Number.isInteger(value) && value >= minimum && value <= maximum
      ? value
      : fallback;
  }
}

export function getGoCardlessRequisitionStatus(
  status: GoCardlessRequisitionStatus,
): string {
  if (typeof status === "string") return status.toUpperCase();
  return (status.short || status.long || "").toUpperCase();
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
