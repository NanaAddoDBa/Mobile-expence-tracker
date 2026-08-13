import {
  AccountType,
  ConnectedAccount,
  ConnectedAccountStatus,
  CurrencyCode,
  ExternalAccount,
} from "@prisma/client";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../prisma/prisma.service";
import { ConnectedAccountsService } from "./connected-accounts.service";
import { GoCardlessBankDataClient } from "./providers/gocardless-bank-data.client";

describe("ConnectedAccountsService", () => {
  const connectedAccount: ConnectedAccount = {
    id: "connection-1",
    userId: "user-1",
    provider: "gocardless_bank_data",
    providerConnectionId: "requisition-1",
    providerInstitutionId: "SANDBOXFINANCE_SFIN0000",
    providerAgreementId: "agreement-1",
    displayName: "Bank account",
    accountType: AccountType.CHECKING,
    status: ConnectedAccountStatus.CONNECTED,
    currency: CurrencyCode.EUR,
    consentExpiresAt: new Date("2026-11-05T00:00:00.000Z"),
    lastImportAt: null,
    lastSyncAt: null,
    lastErrorCode: null,
    lastErrorMessage: null,
    createdAt: new Date("2026-08-07T10:00:00.000Z"),
    updatedAt: new Date("2026-08-07T10:00:00.000Z"),
  };

  const externalAccount: ExternalAccount = {
    id: "external-account-1",
    userId: "user-1",
    connectedAccountId: "connection-1",
    providerAccountId: "provider-account-1",
    displayName: "Everyday Checking",
    accountType: AccountType.CHECKING,
    currency: CurrencyCode.EUR,
    isSelected: true,
    metadata: null,
    createdAt: new Date("2026-08-07T10:00:00.000Z"),
    updatedAt: new Date("2026-08-07T10:00:00.000Z"),
  };

  function createService() {
    const prisma = {
      connectedAccount: {
        create: jest.fn().mockResolvedValue({
          ...connectedAccount,
          id: "connection-1",
          providerConnectionId: null,
          providerAgreementId: null,
          status: ConnectedAccountStatus.CONNECTING,
          externalAccounts: [],
          importBatches: [],
          _count: { expenses: 0 },
        }),
        findMany: jest.fn().mockResolvedValue([
          {
            ...connectedAccount,
            externalAccounts: [externalAccount],
            importBatches: [],
            _count: { expenses: 0 },
          },
        ]),
        findFirst: jest.fn().mockResolvedValue(connectedAccount),
        update: jest.fn().mockResolvedValue({
          ...connectedAccount,
          status: ConnectedAccountStatus.CONNECTING,
          externalAccounts: [],
          importBatches: [],
          _count: { expenses: 0 },
        }),
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      externalAccount: {
        findMany: jest.fn().mockResolvedValue([externalAccount]),
        upsert: jest.fn().mockResolvedValue(externalAccount),
      },
      externalTransaction: {
        findUnique: jest
          .fn()
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce({ id: "existing-external-transaction" }),
        create: jest.fn().mockResolvedValue({ id: "external-transaction-1" }),
      },
      expense: {
        create: jest.fn().mockResolvedValue({ id: "expense-1" }),
      },
      importBatch: {
        create: jest.fn().mockResolvedValue({ id: "import-batch-1" }),
        update: jest.fn().mockResolvedValue({ id: "import-batch-1" }),
      },
      consentRecord: {
        create: jest.fn().mockResolvedValue({ id: "consent-1" }),
      },
    } as unknown as PrismaService;
    const goCardless = {
      listInstitutions: jest.fn().mockResolvedValue([]),
      createAgreement: jest.fn().mockResolvedValue({
        id: "agreement-1",
        access_valid_for_days: 90,
      }),
      createRequisition: jest.fn().mockResolvedValue({
        id: "requisition-1",
        link: "https://ob.gocardless.com/start",
        status: "CR",
        institution_id: "SANDBOXFINANCE_SFIN0000",
        accounts: [],
      }),
      getRequisition: jest.fn().mockResolvedValue({
        id: "requisition-1",
        status: "LN",
        institution_id: "SANDBOXFINANCE_SFIN0000",
        accounts: ["provider-account-1"],
      }),
      getAccountDetails: jest.fn().mockResolvedValue({
        account: {
          displayName: "Everyday Checking",
          currency: "EUR",
          cashAccountType: "CACC",
          iban: "DE12500105170648489890",
        },
      }),
      getAccountTransactions: jest.fn().mockResolvedValue({
        transactions: {
          booked: [
            {
              transactionId: "tx-1",
              bookingDate: "2026-08-07",
              creditorName: "Aldi",
              remittanceInformationUnstructured: "CARD Aldi groceries",
              transactionAmount: { currency: "EUR", amount: "-24.75" },
            },
            {
              transactionId: "tx-2",
              bookingDate: "2026-08-07",
              creditorName: "Aldi",
              remittanceInformationUnstructured: "Duplicate",
              transactionAmount: { currency: "EUR", amount: "-10.00" },
            },
          ],
        },
      }),
    } as unknown as GoCardlessBankDataClient;
    const config = {
      get: jest.fn((key: string) => {
        const values: Record<string, string> = {
          PUBLIC_API_URL: "http://localhost:4000",
          GOCARDLESS_DEFAULT_INSTITUTION_ID: "SANDBOXFINANCE_SFIN0000",
        };
        return values[key];
      }),
    } as unknown as ConfigService;

    return {
      prisma,
      goCardless,
      service: new ConnectedAccountsService(prisma, goCardless, config),
    };
  }

  it("starts a bank connection and returns the provider consent link", async () => {
    const { prisma, goCardless, service } = createService();

    await expect(
      service.startBankConnection("user-1", {
        institutionId: "SANDBOXFINANCE_SFIN0000",
      }),
    ).resolves.toMatchObject({
      linkUrl: "https://ob.gocardless.com/start",
      connection: expect.objectContaining({
        id: "connection-1",
        status: "connecting",
      }),
    });
    expect(goCardless.createRequisition).toHaveBeenCalledWith(
      expect.objectContaining({
        redirectUrl:
          "http://localhost:4000/api/connected-accounts/link/callback?connectionId=connection-1",
      }),
    );
    expect(prisma.consentRecord.create).toHaveBeenCalled();
  });

  it("imports new expenses and skips duplicate provider transactions", async () => {
    const { prisma, service } = createService();

    await expect(
      service.importTransactions("user-1", "connection-1"),
    ).resolves.toMatchObject({
      importedCount: 1,
      skippedDuplicateCount: 1,
      failedCount: 0,
    });
    expect(prisma.externalTransaction.create).toHaveBeenCalledTimes(1);
    expect(prisma.expense.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        merchant: "Aldi",
        amountMinor: 2475,
        entrySource: "CONNECTED_ACCOUNT",
        sourceAccountId: "connection-1",
      }),
    });
    expect(prisma.importBatch.update).toHaveBeenLastCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "COMPLETED",
          importedCount: 1,
          skippedDuplicateCount: 1,
        }),
      }),
    );
  });
});
