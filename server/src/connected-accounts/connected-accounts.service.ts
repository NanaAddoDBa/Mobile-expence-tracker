import {
  BadGatewayException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  AccountType,
  ConnectedAccount,
  ConnectedAccountStatus,
  ConsentStatus,
  CurrencyCode,
  EntrySource,
  ImportStatus,
  Prisma,
  TransactionBookingStatus,
  TransactionDirection,
} from "@prisma/client";
import { randomUUID } from "node:crypto";
import { PrismaService } from "../prisma/prisma.service";
import {
  ConnectedAccountResponse,
  toConnectedAccountResponse,
} from "./connected-account.mapper";
import { StartBankConnectionDto } from "./dto/start-bank-connection.dto";
import {
  getGoCardlessRequisitionStatus,
  GoCardlessBalance,
  GoCardlessBankDataClient,
  GoCardlessInstitution,
  GoCardlessRequestError,
} from "./providers/gocardless-bank-data.client";
import {
  normalizeGoCardlessTransaction,
  NormalizedImportedTransaction,
} from "./transaction-normalizer";

const PROVIDER = "gocardless_bank_data";
const REQUISITION_LINKED_STATUSES = new Set(["LN", "LINKED"]);
const REQUISITION_EXPIRED_STATUSES = new Set(["EX", "EXPIRED"]);
const REQUISITION_REJECTED_STATUSES = new Set(["RJ", "REJECTED"]);

export interface BankConnectionStartResult {
  connection: ConnectedAccountResponse;
  linkUrl: string;
}

export interface ImportTransactionsResult {
  importBatchId: string;
  syncRunId: string;
  importedCount: number;
  importedExpenseCount: number;
  importedIncomeCount: number;
  pendingCount: number;
  skippedDuplicateCount: number;
  failedCount: number;
  message: string;
}

type SyncTrigger = "manual" | "scheduled";

@Injectable()
export class ConnectedAccountsService {
  private readonly logger = new Logger(ConnectedAccountsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly goCardless: GoCardlessBankDataClient,
    private readonly config: ConfigService,
  ) {}

  async list(userId: string): Promise<ConnectedAccountResponse[]> {
    await this.expireElapsedConsents(userId);
    const accounts = await this.prisma.connectedAccount.findMany({
      where: { userId },
      include: this.connectedAccountInclude(),
      orderBy: { createdAt: "desc" },
    });

    return accounts.map(toConnectedAccountResponse);
  }

  async listInstitutions(country: string): Promise<GoCardlessInstitution[]> {
    this.assertBankConnectionsEnabled();
    const normalized = country.trim().toUpperCase();
    if (!/^[A-Z]{2}$/.test(normalized)) {
      throw new BadGatewayException("A valid two-letter bank country is required");
    }
    return this.goCardless.listInstitutions(normalized);
  }

  async startBankConnection(
    userId: string,
    input: StartBankConnectionDto,
  ): Promise<BankConnectionStartResult> {
    this.assertBankConnectionsEnabled();
    const institutionId =
      input.institutionId ||
      this.config.get<string>("GOCARDLESS_DEFAULT_INSTITUTION_ID") ||
      "SANDBOXFINANCE_SFIN0000";
    const connection = await this.prisma.connectedAccount.create({
      data: {
        userId,
        provider: PROVIDER,
        providerInstitutionId: institutionId,
        displayName: "Pending bank connection",
        accountType: AccountType.CHECKING,
        status: ConnectedAccountStatus.CONNECTING,
        currency: CurrencyCode.EUR,
      },
      include: this.connectedAccountInclude(),
    });

    return this.provisionConnection(
      userId,
      connection.id,
      institutionId,
      input.userLanguage,
    );
  }

  async reconnect(
    userId: string,
    connectionId: string,
    userLanguage?: string,
  ): Promise<BankConnectionStartResult> {
    this.assertBankConnectionsEnabled();
    const connection = await this.findOwnedConnection(userId, connectionId);
    await this.revokeProviderAccess(connection);
    await this.prisma.consentRecord.updateMany({
      where: {
        userId,
        connectedAccountId: connection.id,
        status: { in: [ConsentStatus.STARTED, ConsentStatus.GRANTED] },
      },
      data: { status: ConsentStatus.REVOKED, revokedAt: new Date() },
    });

    return this.provisionConnection(
      userId,
      connection.id,
      connection.providerInstitutionId ||
        this.config.get<string>("GOCARDLESS_DEFAULT_INSTITUTION_ID") ||
        "SANDBOXFINANCE_SFIN0000",
      userLanguage,
    );
  }

  async completeBankConnection(
    userId: string,
    connectionId: string,
  ): Promise<ConnectedAccountResponse> {
    const connection = await this.findOwnedConnection(userId, connectionId);

    if (!connection.providerConnectionId) {
      throw new NotFoundException("Bank connection has no provider reference");
    }

    const requisition = await this.goCardless.getRequisition(
      connection.providerConnectionId,
    );
    const providerStatus = getGoCardlessRequisitionStatus(requisition.status);
    if (!REQUISITION_LINKED_STATUSES.has(providerStatus)) {
      await this.applyUnlinkedRequisitionStatus(
        connection,
        providerStatus,
        "Bank authorization was not completed",
      );
      throw new ConflictException(
        "Bank authorization is not complete. Reconnect the account and try again.",
      );
    }

    const accountIds = requisition.accounts ?? [];
    for (const providerAccountId of accountIds) {
      const details = await this.goCardless.getAccountDetails(providerAccountId);
      const externalAccount = details.account;
      await this.prisma.externalAccount.upsert({
        where: {
          connectedAccountId_providerAccountId: {
            connectedAccountId: connection.id,
            providerAccountId,
          },
        },
        create: {
          userId,
          connectedAccountId: connection.id,
          providerAccountId,
          displayName:
            externalAccount?.displayName ||
            externalAccount?.name ||
            externalAccount?.iban ||
            "Bank account",
          accountType: mapExternalAccountType(externalAccount?.cashAccountType),
          currency: mapCurrency(externalAccount?.currency),
          isSelected: true,
          metadata: sanitizeAccountMetadata(externalAccount),
        },
        update: {
          displayName:
            externalAccount?.displayName ||
            externalAccount?.name ||
            externalAccount?.iban ||
            "Bank account",
          accountType: mapExternalAccountType(externalAccount?.cashAccountType),
          currency: mapCurrency(externalAccount?.currency),
          isSelected: true,
          metadata: sanitizeAccountMetadata(externalAccount),
        },
      });
    }

    const connected = accountIds.length > 0;
    const updatedConnection = await this.prisma.connectedAccount.update({
      where: { id: connection.id },
      data: {
        status: connected
          ? ConnectedAccountStatus.CONNECTED
          : ConnectedAccountStatus.ERROR,
        displayName:
          accountIds.length > 1
            ? `${accountIds.length} bank accounts`
            : "Bank account",
        nextSyncAt: connected ? new Date() : null,
        lastErrorCode: connected ? null : "NO_ACCOUNTS",
        lastErrorMessage: connected
          ? null
          : "No bank accounts were returned",
      },
      include: this.connectedAccountInclude(),
    });

    await this.prisma.consentRecord.create({
      data: {
        userId,
        connectedAccountId: connection.id,
        provider: PROVIDER,
        status: connected ? ConsentStatus.GRANTED : ConsentStatus.ERROR,
        grantedAt: connected ? new Date() : null,
        expiresAt: updatedConnection.consentExpiresAt,
        metadata: {
          requisitionId: connection.providerConnectionId,
          accountCount: accountIds.length,
          providerStatus,
        },
      },
    });

    return toConnectedAccountResponse(updatedConnection);
  }

  async importTransactions(
    userId: string,
    connectionId: string,
    trigger: SyncTrigger = "manual",
  ): Promise<ImportTransactionsResult> {
    this.assertBankConnectionsEnabled();
    const connection = await this.findOwnedConnection(userId, connectionId);
    const leaseToken = await this.acquireSyncLease(userId, connectionId);
    let syncRun: { id: string };
    try {
      syncRun = await this.prisma.accountSyncRun.create({
        data: {
          userId,
          connectedAccountId: connectionId,
          status: ImportStatus.RUNNING,
          metadata: { trigger },
        },
      });
    } catch (error) {
      await this.releaseSyncLease(userId, connectionId, leaseToken);
      throw error;
    }

    let importBatchId: string | null = null;
    let importedCount = 0;
    let importedExpenseCount = 0;
    let importedIncomeCount = 0;
    let pendingCount = 0;
    let skippedDuplicateCount = 0;
    let failedCount = 0;
    let providerRequestCount = 0;

    try {
      providerRequestCount += 1;
      await this.assertConnectionReady(connection);
      const externalAccounts = await this.prisma.externalAccount.findMany({
        where: {
          userId,
          connectedAccountId: connection.id,
          isSelected: true,
        },
      });
      if (externalAccounts.length === 0) {
        throw new ConflictException(
          "No bank accounts are selected for transaction import",
        );
      }

      const importBatch = await this.prisma.importBatch.create({
        data: {
          userId,
          connectedAccountId: connection.id,
          status: ImportStatus.RUNNING,
          message: "Transaction sync started.",
        },
      });
      importBatchId = importBatch.id;
      const dateWindow = createTransactionDateWindow(connection.lastImportAt);

      for (const externalAccount of externalAccounts) {
        providerRequestCount += 1;
        const response = await this.goCardless.getAccountTransactions(
          externalAccount.providerAccountId,
          dateWindow,
        );

        for (const transaction of response.transactions?.pending ?? []) {
          const normalized = normalizeGoCardlessTransaction(
            externalAccount.providerAccountId,
            transaction,
          );
          if (!normalized) {
            failedCount += 1;
            continue;
          }
          const stored = await this.persistPendingTransaction(
            userId,
            connection.id,
            importBatch.id,
            normalized,
          );
          if (stored) pendingCount += 1;
        }

        for (const transaction of response.transactions?.booked ?? []) {
          const normalized = normalizeGoCardlessTransaction(
            externalAccount.providerAccountId,
            transaction,
          );
          if (!normalized) {
            failedCount += 1;
            continue;
          }

          const direction = await this.persistBookedTransaction(
            userId,
            connection.id,
            importBatch.id,
            normalized,
          );
          if (!direction) {
            skippedDuplicateCount += 1;
            continue;
          }
          if (direction === TransactionDirection.INFLOW) {
            importedIncomeCount += 1;
          } else {
            importedExpenseCount += 1;
          }
          importedCount += 1;
        }

        providerRequestCount += 1;
        try {
          const balances = await this.goCardless.getAccountBalances(
            externalAccount.providerAccountId,
          );
          const snapshot = selectEuroBalanceSnapshot(balances.balances ?? []);
          await this.prisma.externalAccount.update({
            where: { id: externalAccount.id },
            data: {
              currentBalanceMinor: snapshot.currentBalanceMinor,
              availableBalanceMinor: snapshot.availableBalanceMinor,
              balanceUpdatedAt: snapshot.hasBalance ? new Date() : null,
            },
          });
        } catch (error) {
          failedCount += 1;
          this.logger.warn(
            `Balance refresh failed for external account ${externalAccount.id}: ${getErrorMessage(error)}`,
          );
        }
      }

      const completedAt = new Date();
      const status =
        failedCount > 0 ? ImportStatus.PARTIAL : ImportStatus.COMPLETED;
      const message = createImportMessage({
        importedCount,
        importedExpenseCount,
        importedIncomeCount,
        pendingCount,
        failedCount,
      });
      await this.prisma.importBatch.update({
        where: { id: importBatch.id },
        data: {
          status,
          importedCount,
          pendingCount,
          skippedDuplicateCount,
          failedCount,
          message,
          completedAt,
        },
      });
      await this.prisma.accountSyncRun.update({
        where: { id: syncRun.id },
        data: {
          status,
          completedAt,
          providerRequestCount,
          importedCount,
          skippedDuplicateCount,
          failedCount,
          metadata: { trigger, pendingCount },
        },
      });
      await this.prisma.connectedAccount.update({
        where: { id: connection.id },
        data: {
          status: ConnectedAccountStatus.CONNECTED,
          lastImportAt: completedAt,
          lastSyncAt: completedAt,
          nextSyncAt: this.getNextSyncAt(completedAt),
          lastErrorCode: failedCount > 0 ? "PARTIAL_SYNC" : null,
          lastErrorMessage: failedCount > 0 ? message : null,
        },
      });

      return {
        importBatchId: importBatch.id,
        syncRunId: syncRun.id,
        importedCount,
        importedExpenseCount,
        importedIncomeCount,
        pendingCount,
        skippedDuplicateCount,
        failedCount,
        message,
      };
    } catch (error) {
      await this.recordSyncFailure({
        connection,
        syncRunId: syncRun.id,
        importBatchId,
        trigger,
        error,
        providerRequestCount,
        importedCount,
        skippedDuplicateCount,
        failedCount: failedCount + 1,
      });
      throw error;
    } finally {
      await this.releaseSyncLease(userId, connectionId, leaseToken).catch(
        (error) => {
          this.logger.error(
            `Could not release sync lease for connection ${connectionId}: ${getErrorMessage(error)}`,
          );
        },
      );
    }
  }

  async syncDueConnections(): Promise<void> {
    if (!this.getBooleanConfig("BANK_SYNC_ENABLED", false)) return;

    const now = new Date();
    const accounts = await this.prisma.connectedAccount.findMany({
      where: {
        status: ConnectedAccountStatus.CONNECTED,
        OR: [{ nextSyncAt: null }, { nextSyncAt: { lte: now } }],
      },
      select: { id: true, userId: true },
      orderBy: [{ nextSyncAt: "asc" }, { lastSyncAt: "asc" }],
      take: this.getIntegerConfig("BANK_SYNC_BATCH_SIZE", 10, 1, 100),
    });

    for (const account of accounts) {
      try {
        await this.importTransactions(account.userId, account.id, "scheduled");
      } catch (error) {
        this.logger.warn(
          `Scheduled bank sync failed for connection ${account.id}: ${getErrorMessage(error)}`,
        );
      }
    }
  }

  async remove(userId: string, connectionId: string): Promise<void> {
    const connection = await this.findOwnedConnection(userId, connectionId);
    await this.revokeProviderAccess(connection);
    await this.prisma.$transaction([
      this.prisma.consentRecord.updateMany({
        where: {
          userId,
          connectedAccountId: connectionId,
          status: { not: ConsentStatus.REVOKED },
        },
        data: { status: ConsentStatus.REVOKED, revokedAt: new Date() },
      }),
      this.prisma.connectedAccount.deleteMany({
        where: { id: connectionId, userId },
      }),
    ]);
  }

  async revokeAllForUser(userId: string): Promise<void> {
    const connections = await this.prisma.connectedAccount.findMany({
      where: {
        userId,
        provider: PROVIDER,
        providerConnectionId: { not: null },
      },
    });
    for (const connection of connections) {
      await this.revokeProviderAccess(connection);
    }
  }

  private async provisionConnection(
    userId: string,
    connectionId: string,
    institutionId: string,
    userLanguage?: string,
  ): Promise<BankConnectionStartResult> {
    let requisitionId: string | null = null;
    try {
      const agreement = await this.goCardless.createAgreement(institutionId);
      const requisition = await this.goCardless.createRequisition({
        redirectUrl: this.getCallbackUrl(connectionId),
        institutionId,
        reference: connectionId,
        agreementId: agreement.id,
        userLanguage,
      });
      requisitionId = requisition.id;
      if (!requisition.link) {
        throw new BadGatewayException(
          "GoCardless did not return a connection link",
        );
      }

      const consentExpiresAt = new Date(
        Date.now() +
          (agreement.access_valid_for_days ?? 90) * 24 * 60 * 60 * 1_000,
      );
      const updatedConnection = await this.prisma.connectedAccount.update({
        where: { id: connectionId },
        data: {
          provider: PROVIDER,
          providerInstitutionId: institutionId,
          providerConnectionId: requisition.id,
          providerAgreementId: agreement.id,
          displayName: "Pending bank connection",
          status: ConnectedAccountStatus.CONNECTING,
          consentExpiresAt,
          nextSyncAt: null,
          lastErrorCode: null,
          lastErrorMessage: null,
        },
        include: this.connectedAccountInclude(),
      });
      await this.prisma.consentRecord.create({
        data: {
          userId,
          connectedAccountId: connectionId,
          provider: PROVIDER,
          status: ConsentStatus.STARTED,
          expiresAt: consentExpiresAt,
          metadata: {
            institutionId,
            requisitionId: requisition.id,
          },
        },
      });

      return {
        connection: toConnectedAccountResponse(updatedConnection),
        linkUrl: requisition.link,
      };
    } catch (error) {
      if (requisitionId) {
        await this.goCardless.deleteRequisition(requisitionId).catch(() => {});
      }
      await this.prisma.connectedAccount.updateMany({
        where: { id: connectionId, userId },
        data: {
          status: ConnectedAccountStatus.ERROR,
          lastErrorCode: "CONNECTION_START_FAILED",
          lastErrorMessage: getErrorMessage(error),
        },
      });
      throw error;
    }
  }

  private async assertConnectionReady(
    connection: ConnectedAccount,
  ): Promise<void> {
    if (
      connection.consentExpiresAt &&
      connection.consentExpiresAt.getTime() <= Date.now()
    ) {
      await this.markNeedsReconnect(
        connection,
        ConsentStatus.EXPIRED,
        "Bank consent has expired",
      );
      throw new ConflictException(
        "Bank consent has expired. Reconnect the account before syncing.",
      );
    }
    if (!connection.providerConnectionId) {
      throw new ConflictException("Bank connection has no provider reference");
    }

    const requisition = await this.goCardless.getRequisition(
      connection.providerConnectionId,
    );
    const status = getGoCardlessRequisitionStatus(requisition.status);
    if (!REQUISITION_LINKED_STATUSES.has(status)) {
      await this.applyUnlinkedRequisitionStatus(
        connection,
        status,
        "Bank connection is not linked",
      );
      throw new ConflictException(
        "Bank access is no longer active. Reconnect the account before syncing.",
      );
    }
    if (connection.status !== ConnectedAccountStatus.CONNECTED) {
      await this.prisma.connectedAccount.update({
        where: { id: connection.id },
        data: {
          status: ConnectedAccountStatus.CONNECTED,
          lastErrorCode: null,
          lastErrorMessage: null,
        },
      });
    }
  }

  private async applyUnlinkedRequisitionStatus(
    connection: ConnectedAccount,
    providerStatus: string,
    fallbackMessage: string,
  ): Promise<void> {
    if (REQUISITION_EXPIRED_STATUSES.has(providerStatus)) {
      await this.markNeedsReconnect(
        connection,
        ConsentStatus.EXPIRED,
        "Bank consent has expired",
      );
      return;
    }
    if (REQUISITION_REJECTED_STATUSES.has(providerStatus)) {
      await this.markNeedsReconnect(
        connection,
        ConsentStatus.ERROR,
        "Bank authorization was rejected",
      );
      return;
    }

    await this.prisma.connectedAccount.update({
      where: { id: connection.id },
      data: {
        status: ConnectedAccountStatus.CONNECTING,
        lastErrorCode: "AUTHORIZATION_INCOMPLETE",
        lastErrorMessage: `${fallbackMessage} (provider status ${providerStatus || "unknown"})`,
      },
    });
  }

  private async markNeedsReconnect(
    connection: ConnectedAccount,
    consentStatus: ConsentStatus,
    message: string,
  ): Promise<void> {
    const now = new Date();
    await this.prisma.$transaction([
      this.prisma.connectedAccount.update({
        where: { id: connection.id },
        data: {
          status: ConnectedAccountStatus.NEEDS_RECONNECT,
          nextSyncAt: null,
          lastErrorCode:
            consentStatus === ConsentStatus.EXPIRED
              ? "CONSENT_EXPIRED"
              : "AUTHORIZATION_REJECTED",
          lastErrorMessage: message,
        },
      }),
      this.prisma.consentRecord.updateMany({
        where: {
          connectedAccountId: connection.id,
          status: { in: [ConsentStatus.STARTED, ConsentStatus.GRANTED] },
        },
        data: {
          status: consentStatus,
          ...(consentStatus === ConsentStatus.EXPIRED
            ? {}
            : { revokedAt: now }),
        },
      }),
    ]);
  }

  private async persistPendingTransaction(
    userId: string,
    connectionId: string,
    importBatchId: string,
    normalized: NormalizedImportedTransaction,
  ): Promise<boolean> {
    const existing = await this.prisma.externalTransaction.findUnique({
      where: {
        userId_providerTransactionId: {
          userId,
          providerTransactionId: normalized.providerTransactionId,
        },
      },
    });
    if (existing?.bookingStatus === TransactionBookingStatus.BOOKED) {
      return false;
    }

    const data = this.toExternalTransactionData(
      userId,
      connectionId,
      importBatchId,
      normalized,
      TransactionBookingStatus.PENDING,
    );
    try {
      if (existing) {
        await this.prisma.externalTransaction.update({
          where: { id: existing.id },
          data,
        });
      } else {
        await this.prisma.externalTransaction.create({ data });
      }
      return true;
    } catch (error) {
      if (isUniqueConstraintError(error)) return false;
      throw error;
    }
  }

  private async persistBookedTransaction(
    userId: string,
    connectionId: string,
    importBatchId: string,
    normalized: NormalizedImportedTransaction,
  ): Promise<TransactionDirection | null> {
    let existing = await this.prisma.externalTransaction.findUnique({
      where: {
        userId_providerTransactionId: {
          userId,
          providerTransactionId: normalized.providerTransactionId,
        },
      },
    });
    if (existing?.bookingStatus === TransactionBookingStatus.BOOKED) {
      return null;
    }
    if (!existing) {
      existing = await this.prisma.externalTransaction.findFirst({
        where: {
          userId,
          connectedAccountId: connectionId,
          dedupeHash: normalized.dedupeHash,
          bookingStatus: TransactionBookingStatus.PENDING,
        },
      });
    }

    try {
      return await this.prisma.$transaction(async (transactionClient) => {
        const data = this.toExternalTransactionData(
          userId,
          connectionId,
          importBatchId,
          normalized,
          TransactionBookingStatus.BOOKED,
        );
        if (existing) {
          await transactionClient.externalTransaction.update({
            where: { id: existing.id },
            data,
          });
        } else {
          await transactionClient.externalTransaction.create({ data });
        }

        if (
          normalized.direction === TransactionDirection.INFLOW &&
          normalized.normalizedIncomeCategory
        ) {
          await transactionClient.income.create({
            data: {
              userId,
              source: normalized.merchantName,
              description: normalized.description,
              amountMinor: normalized.amountMinor,
              currency: normalized.currency,
              date: normalized.postedDate,
              category: normalized.normalizedIncomeCategory,
              paymentMethod: normalized.paymentMethod,
              entrySource: EntrySource.CONNECTED_ACCOUNT,
              sourceAccountId: connectionId,
              importBatchId,
              externalTransactionId: normalized.providerTransactionId,
            },
          });
          return TransactionDirection.INFLOW;
        }

        if (!normalized.normalizedCategory) {
          throw new Error("Imported transaction has no normalized category");
        }
        await transactionClient.expense.create({
          data: {
            userId,
            merchant: normalized.merchantName,
            description: normalized.description,
            amountMinor: normalized.amountMinor,
            currency: normalized.currency,
            date: normalized.postedDate,
            category: normalized.normalizedCategory,
            paymentMethod: normalized.paymentMethod,
            entrySource: EntrySource.CONNECTED_ACCOUNT,
            sourceAccountId: connectionId,
            importBatchId,
            externalTransactionId: normalized.providerTransactionId,
          },
        });
        return TransactionDirection.OUTFLOW;
      });
    } catch (error) {
      if (isUniqueConstraintError(error)) return null;
      throw error;
    }
  }

  private toExternalTransactionData(
    userId: string,
    connectionId: string,
    importBatchId: string,
    normalized: NormalizedImportedTransaction,
    bookingStatus: TransactionBookingStatus,
  ): Prisma.ExternalTransactionUncheckedCreateInput {
    return {
      userId,
      connectedAccountId: connectionId,
      importBatchId,
      providerTransactionId: normalized.providerTransactionId,
      providerAccountId: normalized.providerAccountId,
      merchantName: normalized.merchantName,
      description: normalized.description,
      amountMinor: normalized.amountMinor,
      direction: normalized.direction,
      bookingStatus,
      currency: normalized.currency,
      postedDate: normalized.postedDate,
      rawCategory: normalized.rawCategory,
      normalizedCategory: normalized.normalizedCategory,
      normalizedIncomeCategory: normalized.normalizedIncomeCategory,
      dedupeHash: normalized.dedupeHash,
    };
  }

  private async acquireSyncLease(
    userId: string,
    connectionId: string,
  ): Promise<string> {
    const now = new Date();
    const token = randomUUID();
    const expiresAt = new Date(
      now.getTime() +
        this.getIntegerConfig("BANK_SYNC_LOCK_MINUTES", 10, 1, 60) * 60_000,
    );
    const result = await this.prisma.connectedAccount.updateMany({
      where: {
        id: connectionId,
        userId,
        OR: [
          { syncLockExpiresAt: null },
          { syncLockExpiresAt: { lte: now } },
        ],
      },
      data: { syncLockToken: token, syncLockExpiresAt: expiresAt },
    });
    if (result.count !== 1) {
      throw new ConflictException(
        "A transaction sync is already running for this account",
      );
    }
    return token;
  }

  private async releaseSyncLease(
    userId: string,
    connectionId: string,
    token: string,
  ): Promise<void> {
    await this.prisma.connectedAccount.updateMany({
      where: { id: connectionId, userId, syncLockToken: token },
      data: { syncLockToken: null, syncLockExpiresAt: null },
    });
  }

  private async recordSyncFailure(input: {
    connection: ConnectedAccount;
    syncRunId: string;
    importBatchId: string | null;
    trigger: SyncTrigger;
    error: unknown;
    providerRequestCount: number;
    importedCount: number;
    skippedDuplicateCount: number;
    failedCount: number;
  }): Promise<void> {
    const message = getErrorMessage(input.error);
    const rateLimited =
      input.error instanceof GoCardlessRequestError &&
      input.error.providerStatus === 429;
    const accessExpired =
      input.error instanceof GoCardlessRequestError &&
      input.error.providerStatus === 401;
    const status = rateLimited ? ImportStatus.RATE_LIMITED : ImportStatus.FAILED;
    const completedAt = new Date();

    try {
      if (input.importBatchId) {
        await this.prisma.importBatch.update({
          where: { id: input.importBatchId },
          data: {
            status,
            importedCount: input.importedCount,
            skippedDuplicateCount: input.skippedDuplicateCount,
            failedCount: input.failedCount,
            message,
            completedAt,
          },
        });
      }
      await this.prisma.accountSyncRun.update({
        where: { id: input.syncRunId },
        data: {
          status,
          completedAt,
          providerRequestCount: input.providerRequestCount,
          importedCount: input.importedCount,
          skippedDuplicateCount: input.skippedDuplicateCount,
          failedCount: input.failedCount,
          errorCode: rateLimited
            ? "RATE_LIMITED"
            : accessExpired
              ? "ACCESS_EXPIRED"
              : "SYNC_FAILED",
          errorMessage: message,
          metadata: { trigger: input.trigger },
        },
      });
      await this.prisma.connectedAccount.update({
        where: { id: input.connection.id },
        data: {
          ...(accessExpired
            ? {
                status: ConnectedAccountStatus.NEEDS_RECONNECT,
                nextSyncAt: null,
              }
            : {
                nextSyncAt: new Date(
                  completedAt.getTime() + (rateLimited ? 6 : 1) * 60 * 60_000,
                ),
              }),
          lastErrorCode: rateLimited
            ? "RATE_LIMITED"
            : accessExpired
              ? "ACCESS_EXPIRED"
              : "SYNC_FAILED",
          lastErrorMessage: message,
        },
      });
    } catch (recordingError) {
      this.logger.error(
        `Could not record failed sync ${input.syncRunId}: ${getErrorMessage(recordingError)}`,
      );
    }
  }

  private async revokeProviderAccess(
    connection: ConnectedAccount,
  ): Promise<void> {
    if (connection.provider !== PROVIDER || !connection.providerConnectionId) {
      return;
    }
    await this.goCardless.deleteRequisition(connection.providerConnectionId);
  }

  private async expireElapsedConsents(userId: string): Promise<void> {
    const now = new Date();
    await this.prisma.$transaction([
      this.prisma.connectedAccount.updateMany({
        where: {
          userId,
          status: ConnectedAccountStatus.CONNECTED,
          consentExpiresAt: { lte: now },
        },
        data: {
          status: ConnectedAccountStatus.NEEDS_RECONNECT,
          nextSyncAt: null,
          lastErrorCode: "CONSENT_EXPIRED",
          lastErrorMessage: "Bank consent has expired",
        },
      }),
      this.prisma.consentRecord.updateMany({
        where: {
          userId,
          status: ConsentStatus.GRANTED,
          expiresAt: { lte: now },
        },
        data: { status: ConsentStatus.EXPIRED },
      }),
    ]);
  }

  private async findOwnedConnection(userId: string, connectionId: string) {
    const connection = await this.prisma.connectedAccount.findFirst({
      where: { id: connectionId, userId },
    });
    if (!connection) {
      throw new NotFoundException("Connected account not found");
    }
    return connection;
  }

  private connectedAccountInclude() {
    return {
      externalAccounts: true,
      importBatches: {
        orderBy: { startedAt: "desc" as const },
        take: 1,
      },
      _count: {
        select: {
          expenses: true,
          incomes: true,
          externalTransactions: {
            where: { bookingStatus: TransactionBookingStatus.PENDING },
          },
        },
      },
    };
  }

  private getCallbackUrl(connectionId: string): string {
    const publicApiUrl =
      this.config.get<string>("PUBLIC_API_URL") || "http://localhost:4000";
    return `${publicApiUrl}/api/connected-accounts/link/callback?connectionId=${encodeURIComponent(
      connectionId,
    )}`;
  }

  private getNextSyncAt(from: Date): Date {
    return new Date(
      from.getTime() +
        this.getIntegerConfig(
          "BANK_SYNC_INTERVAL_MINUTES",
          360,
          60,
          10_080,
        ) *
          60_000,
    );
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

  private getBooleanConfig(key: string, fallback: boolean): boolean {
    const value = this.config.get<string>(key)?.trim().toLowerCase();
    if (value === "true") return true;
    if (value === "false") return false;
    return fallback;
  }

  private assertBankConnectionsEnabled(): void {
    if (!this.getBooleanConfig("BANK_CONNECTIONS_ENABLED", true)) {
      throw new ServiceUnavailableException(
        "Bank connections are not enabled for this deployment",
      );
    }
  }
}

function createTransactionDateWindow(lastImportAt: Date | null): {
  dateFrom?: string;
  dateTo: string;
} {
  const now = new Date();
  if (!lastImportAt) {
    return { dateTo: toDateOnly(now) };
  }
  const overlapStart = new Date(lastImportAt.getTime() - 7 * 24 * 60 * 60_000);
  return { dateFrom: toDateOnly(overlapStart), dateTo: toDateOnly(now) };
}

function toDateOnly(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function selectEuroBalanceSnapshot(balances: GoCardlessBalance[]): {
  currentBalanceMinor: number | null;
  availableBalanceMinor: number | null;
  hasBalance: boolean;
} {
  const euroBalances = balances
    .map((balance) => ({
      type: balance.balanceType?.toLowerCase() ?? "",
      amountMinor: parseEuroAmountMinor(balance),
    }))
    .filter(
      (balance): balance is { type: string; amountMinor: number } =>
        balance.amountMinor !== null,
    );
  const current =
    findBalance(euroBalances, ["closingbooked", "interimbooked", "expected"]) ??
    euroBalances[0]?.amountMinor ??
    null;
  const available =
    findBalance(euroBalances, [
      "interimavailable",
      "closingavailable",
      "forwardavailable",
    ]) ?? current;

  return {
    currentBalanceMinor: current,
    availableBalanceMinor: available,
    hasBalance: current !== null || available !== null,
  };
}

function parseEuroAmountMinor(balance: GoCardlessBalance): number | null {
  if (balance.balanceAmount.currency.trim().toUpperCase() !== CurrencyCode.EUR) {
    return null;
  }
  const amount = Number(balance.balanceAmount.amount);
  return Number.isFinite(amount) ? Math.round(amount * 100) : null;
}

function findBalance(
  balances: Array<{ type: string; amountMinor: number }>,
  priorities: string[],
): number | null {
  for (const priority of priorities) {
    const match = balances.find((balance) => balance.type.includes(priority));
    if (match) return match.amountMinor;
  }
  return null;
}

function createImportMessage(input: {
  importedCount: number;
  importedExpenseCount: number;
  importedIncomeCount: number;
  pendingCount: number;
  failedCount: number;
}): string {
  const imported =
    input.importedCount > 0
      ? `Imported ${input.importedCount} booked transactions (${input.importedExpenseCount} expenses, ${input.importedIncomeCount} income entries).`
      : "No new booked transactions found.";
  const pending =
    input.pendingCount > 0
      ? ` Stored ${input.pendingCount} pending transactions until the bank books them.`
      : "";
  const failed =
    input.failedCount > 0
      ? ` ${input.failedCount} records or balance reads could not be processed.`
      : "";
  return `${imported}${pending}${failed}`;
}

function mapCurrency(value: string | undefined): CurrencyCode {
  const normalized = value?.trim().toUpperCase();
  if (normalized === CurrencyCode.GBP) return CurrencyCode.GBP;
  if (normalized === CurrencyCode.USD) return CurrencyCode.USD;
  return CurrencyCode.EUR;
}

function mapExternalAccountType(value: string | undefined): AccountType {
  const normalized = value?.trim().toLowerCase() ?? "";
  if (normalized.includes("savings")) return AccountType.SAVINGS;
  if (normalized.includes("card")) return AccountType.CREDIT_CARD;
  return AccountType.CHECKING;
}

function sanitizeAccountMetadata(account: unknown): Prisma.InputJsonValue {
  if (!account || typeof account !== "object") return {};
  const value = account as Record<string, unknown>;
  const metadata: Record<string, string> = {};
  if (typeof value.resourceId === "string") {
    metadata.resourceId = value.resourceId;
  }
  if (typeof value.iban === "string") {
    metadata.ibanLast4 = value.iban.slice(-4);
  }
  if (typeof value.product === "string") metadata.product = value.product;
  if (typeof value.status === "string") metadata.status = value.status;
  return metadata;
}

function isUniqueConstraintError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Transaction sync failed";
}
