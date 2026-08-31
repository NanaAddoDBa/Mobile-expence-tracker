import { ConflictException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  AccountType,
  ConnectedAccount,
  ConnectedAccountStatus,
  CurrencyCode,
  ExternalAccount,
  TransactionBookingStatus,
} from "@prisma/client";
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
    nextSyncAt: null,
    syncLockToken: null,
    syncLockExpiresAt: null,
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
    currentBalanceMinor: null,
    availableBalanceMinor: null,
    balanceUpdatedAt: null,
    metadata: null,
    createdAt: new Date("2026-08-07T10:00:00.000Z"),
    updatedAt: new Date("2026-08-07T10:00:00.000Z"),
  };

  function createService() {
    const prismaMock: Record<string, unknown> = {
      connectedAccount: {
        create: jest.fn().mockResolvedValue({
          ...connectedAccount,
          providerConnectionId: null,
          providerAgreementId: null,
          status: ConnectedAccountStatus.CONNECTING,
          externalAccounts: [],
          importBatches: [],
          _count: { expenses: 0, incomes: 0, externalTransactions: 0 },
        }),
        findMany: jest.fn().mockResolvedValue([]),
        findFirst: jest.fn().mockResolvedValue(connectedAccount),
        update: jest.fn().mockImplementation(({ data }) =>
          Promise.resolve({
            ...connectedAccount,
            ...data,
            externalAccounts: [],
            importBatches: [],
            _count: { expenses: 0, incomes: 0, externalTransactions: 0 },
          }),
        ),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      externalAccount: {
        findMany: jest.fn().mockResolvedValue([externalAccount]),
        upsert: jest.fn().mockResolvedValue(externalAccount),
        update: jest.fn().mockResolvedValue(externalAccount),
      },
      externalTransaction: {
        findUnique: jest.fn().mockImplementation(({ where }) => {
          const id =
            where.userId_providerTransactionId?.providerTransactionId ?? "";
          return Promise.resolve(
            id.endsWith(":tx-2")
              ? {
                  id: "existing-external-transaction",
                  bookingStatus: TransactionBookingStatus.BOOKED,
                }
              : null,
          );
        }),
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: "external-transaction-1" }),
        update: jest.fn().mockResolvedValue({ id: "external-transaction-1" }),
      },
      expense: {
        create: jest.fn().mockResolvedValue({ id: "expense-1" }),
      },
      income: {
        create: jest.fn().mockResolvedValue({ id: "income-1" }),
      },
      importBatch: {
        create: jest.fn().mockResolvedValue({ id: "import-batch-1" }),
        update: jest.fn().mockResolvedValue({ id: "import-batch-1" }),
      },
      consentRecord: {
        create: jest.fn().mockResolvedValue({ id: "consent-1" }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      accountSyncRun: {
        create: jest.fn().mockResolvedValue({ id: "sync-run-1" }),
        update: jest.fn().mockResolvedValue({ id: "sync-run-1" }),
      },
    };
    prismaMock.$transaction = jest.fn(
      async (
        input:
          | Promise<unknown>[]
          | ((client: Record<string, unknown>) => Promise<unknown>),
      ) =>
        typeof input === "function"
          ? input(prismaMock)
          : Promise.all(input),
    );

    const prisma = prismaMock as unknown as PrismaService;
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
      deleteRequisition: jest.fn().mockResolvedValue(undefined),
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
          pending: [
            {
              transactionId: "tx-pending",
              valueDate: "2026-08-08",
              creditorName: "Pending Shop",
              remittanceInformationUnstructured: "Pending card transaction",
              transactionAmount: { currency: "EUR", amount: "-12.00" },
            },
          ],
          booked: [
            {
              transactionId: "tx-1",
              bookingDate: "2026-08-07",
              creditorName: "Aldi",
              remittanceInformationUnstructured: "CARD Aldi groceries",
              transactionAmount: { currency: "EUR", amount: "-24.75" },
            },
            {
              transactionId: "tx-income",
              bookingDate: "2026-08-07",
              debtorName: "Example Employer",
              remittanceInformationUnstructured: "August payroll salary",
              transactionAmount: { currency: "EUR", amount: "2500.00" },
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
      getAccountBalances: jest.fn().mockResolvedValue({
        balances: [
          {
            balanceAmount: { amount: "1234.56", currency: "EUR" },
            balanceType: "closingBooked",
          },
          {
            balanceAmount: { amount: "1200.00", currency: "EUR" },
            balanceType: "interimAvailable",
          },
        ],
      }),
    } as unknown as GoCardlessBankDataClient;
    const config = {
      get: jest.fn((key: string) => {
        const values: Record<string, string> = {
          PUBLIC_API_URL: "http://localhost:4000",
          GOCARDLESS_DEFAULT_INSTITUTION_ID: "SANDBOXFINANCE_SFIN0000",
          BANK_SYNC_INTERVAL_MINUTES: "360",
          BANK_SYNC_LOCK_MINUTES: "10",
          BANK_SYNC_ENABLED: "false",
        };
        return values[key];
      }),
    } as unknown as ConfigService;

    return {
      prisma,
      prismaMock,
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

  it("syncs booked inflow and outflow records while staging pending transactions", async () => {
    const { prisma, service } = createService();

    await expect(
      service.importTransactions("user-1", "connection-1"),
    ).resolves.toMatchObject({
      importedCount: 2,
      importedExpenseCount: 1,
      importedIncomeCount: 1,
      pendingCount: 1,
      skippedDuplicateCount: 1,
      failedCount: 0,
      syncRunId: "sync-run-1",
    });
    expect(prisma.externalTransaction.create).toHaveBeenCalledTimes(3);
    expect(prisma.expense.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        merchant: "Aldi",
        amountMinor: 2475,
        entrySource: "CONNECTED_ACCOUNT",
        sourceAccountId: "connection-1",
      }),
    });
    expect(prisma.income.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        source: "Example Employer",
        amountMinor: 250000,
        category: "SALARY",
        entrySource: "CONNECTED_ACCOUNT",
      }),
    });
    expect(prisma.externalAccount.update).toHaveBeenCalledWith({
      where: { id: "external-account-1" },
      data: {
        currentBalanceMinor: 123456,
        availableBalanceMinor: 120000,
        balanceUpdatedAt: expect.any(Date),
      },
    });
    expect(prisma.accountSyncRun.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "COMPLETED",
          importedCount: 2,
          providerRequestCount: 3,
        }),
      }),
    );
  });

  it("rejects overlapping sync attempts using the database lease", async () => {
    const { prismaMock, service } = createService();
    (
      prismaMock.connectedAccount as { updateMany: jest.Mock }
    ).updateMany.mockResolvedValueOnce({ count: 0 });

    await expect(
      service.importTransactions("user-1", "connection-1"),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(
      (prismaMock.accountSyncRun as { create: jest.Mock }).create,
    ).not.toHaveBeenCalled();
  });

  it("revokes provider access before deleting the local connection", async () => {
    const { prisma, goCardless, service } = createService();

    await service.remove("user-1", "connection-1");

    expect(goCardless.deleteRequisition).toHaveBeenCalledWith("requisition-1");
    expect(prisma.consentRecord.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: "REVOKED" }),
      }),
    );
    expect(prisma.connectedAccount.deleteMany).toHaveBeenCalledWith({
      where: { id: "connection-1", userId: "user-1" },
    });
  });
});
