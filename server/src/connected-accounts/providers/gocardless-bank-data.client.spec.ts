import { ConfigService } from "@nestjs/config";
import { GoCardlessBankDataClient } from "./gocardless-bank-data.client";

function createConfig(overrides: Record<string, string> = {}): ConfigService {
  const values: Record<string, string> = {
    GOCARDLESS_SECRET_ID: "secret-id",
    GOCARDLESS_SECRET_KEY: "secret-key",
    GOCARDLESS_BANK_DATA_BASE_URL: "https://bank.example.test/api/v2",
    GOCARDLESS_REQUEST_TIMEOUT_MS: "1000",
    GOCARDLESS_MAX_RETRIES: "1",
    ...overrides,
  };
  return {
    get: jest.fn((key: string) => values[key]),
  } as unknown as ConfigService;
}

function jsonResponse(
  body: unknown,
  status = 200,
  headers: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...headers },
  });
}

describe("GoCardlessBankDataClient", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it("reuses an access token and sends bounded transaction date filters", async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({
          access: "access-token",
          access_expires: 3600,
          refresh: "refresh-token",
          refresh_expires: 86400,
        }),
      )
      .mockResolvedValueOnce(jsonResponse({ transactions: { booked: [] } }))
      .mockResolvedValueOnce(jsonResponse({ transactions: { booked: [] } }));
    global.fetch = fetchMock as unknown as typeof fetch;
    const client = new GoCardlessBankDataClient(createConfig());

    await client.getAccountTransactions("account-1", {
      dateFrom: "2026-08-01",
      dateTo: "2026-08-30",
    });
    await client.getAccountTransactions("account-1");

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[1][0]).toBe(
      "https://bank.example.test/api/v2/accounts/account-1/transactions/?date_from=2026-08-01&date_to=2026-08-30",
    );
    expect(fetchMock.mock.calls[1][1]).toMatchObject({
      headers: expect.objectContaining({
        authorization: "Bearer access-token",
      }),
    });
  });

  it("retries a transient read failure once", async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({ access: "access-token", access_expires: 3600 }),
      )
      .mockResolvedValueOnce(
        jsonResponse(
          { summary: "Institution unavailable" },
          503,
          { "retry-after": "0" },
        ),
      )
      .mockResolvedValueOnce(jsonResponse([]));
    global.fetch = fetchMock as unknown as typeof fetch;
    const client = new GoCardlessBankDataClient(createConfig());

    await expect(client.listInstitutions("DE")).resolves.toEqual([]);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("uses the provider DELETE endpoint and treats an already removed requisition as success", async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({ access: "access-token", access_expires: 3600 }),
      )
      .mockResolvedValueOnce(jsonResponse({ detail: "Not found" }, 404));
    global.fetch = fetchMock as unknown as typeof fetch;
    const client = new GoCardlessBankDataClient(createConfig());

    await expect(
      client.deleteRequisition("requisition-1"),
    ).resolves.toBeUndefined();
    expect(fetchMock.mock.calls[1][0]).toBe(
      "https://bank.example.test/api/v2/requisitions/requisition-1/",
    );
    expect(fetchMock.mock.calls[1][1]).toMatchObject({ method: "DELETE" });
  });

  it("shares one token request between concurrent provider reads", async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({ access: "access-token", access_expires: 3600 }),
      )
      .mockResolvedValueOnce(jsonResponse([]))
      .mockResolvedValueOnce(jsonResponse([]));
    global.fetch = fetchMock as unknown as typeof fetch;
    const client = new GoCardlessBankDataClient(createConfig());

    await Promise.all([
      client.listInstitutions("DE"),
      client.listInstitutions("IE"),
    ]);

    const tokenCalls = fetchMock.mock.calls.filter(([url]) =>
      String(url).endsWith("/token/new/"),
    );
    expect(tokenCalls).toHaveLength(1);
  });
});
