import {
  BadGatewayException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  AccountType,
  ConnectedAccountStatus,
  ConsentStatus,
  CurrencyCode,
  EntrySource,
  ImportStatus,
  Prisma,
} from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import {
  ConnectedAccountResponse,
  toConnectedAccountResponse,
} from "./connected-account.mapper";
import { StartBankConnectionDto } from "./dto/start-bank-connection.dto";
import {
  GoCardlessBankDataClient,
  GoCardlessInstitution,
} from "./providers/gocardless-bank-data.client";
import { normalizeGoCardlessTransaction } from "./transaction-normalizer";

export interface BankConnectionStartResult {
  connection: ConnectedAccountResponse;
  linkUrl: string;
}

export interface ImportTransactionsResult {
  importBatchId: string;
  importedCount: number;
  skippedDuplicateCount: number;
  failedCount: number;
  message: string;
}

@Injectable()
export class ConnectedAccountsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly goCardless: GoCardlessBankDataClient,
    private readonly config: ConfigService,
  ) {}

  async list(userId: string): Promise<ConnectedAccountResponse[]> {
    const accounts = await this.prisma.connectedAccount.findMany({
      where: { userId },
      include: this.connectedAccountInclude(),
      orderBy: { createdAt: "desc" },
    });

    return accounts.map(toConnectedAccountResponse);
  }

  async listInstitutions(country: string): Promise<GoCardlessInstitution[]> {
    return this.goCardless.listInstitutions(country);
  }

  async startBankConnection(
    userId: string,
    input: StartBankConnectionDto,
  ): Promise<BankConnectionStartResult> {
    const institutionId =
      input.institutionId ||
      this.config.get<string>("GOCARDLESS_DEFAULT_INSTITUTION_ID") ||
      "SANDBOXFINANCE_SFIN0000";
    const connection = await this.prisma.connectedAccount.create({
      data: {
        userId,
        provider: "gocardless_bank_data",
        providerInstitutionId: institutionId,
        displayName: "Pending bank connection",
        accountType: AccountType.CHECKING,
        status: ConnectedAccountStatus.CONNECTING,
        currency: CurrencyCode.EUR,
      },
      include: this.connectedAccountInclude(),
    });
    const agreement = await this.goCardless.createAgreement(institutionId);
    const requisition = await this.goCardless.createRequisition({
      redirectUrl: this.getCallbackUrl(connection.id),
      institutionId,
      reference: connection.id,
      agreementId: agreement.id,
      userLanguage: input.userLanguage,
    });

    if (!requisition.link) {
      throw new BadGatewayException("GoCardless did not return a connection link");
    }

    const consentExpiresAt = new Date(
      Date.now() + (agreement.access_valid_for_days ?? 90) * 24 * 60 * 60 * 1000,
    );
    const updatedConnection = await this.prisma.connectedAccount.update({
      where: { id: connection.id },
      data: {
        providerConnectionId: requisition.id,
        providerAgreementId: agreement.id,
        consentExpiresAt,
      },
      include: this.connectedAccountInclude(),
    });

    await this.prisma.consentRecord.create({
      data: {
        userId,
        connectedAccountId: connection.id,
        provider: "gocardless_bank_data",
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

    const updatedConnection = await this.prisma.connectedAccount.update({
      where: { id: connection.id },
      data: {
        status:
          accountIds.length > 0
            ? ConnectedAccountStatus.CONNECTED
            : ConnectedAccountStatus.ERROR,
        displayName:
          accountIds.length > 1
            ? `${accountIds.length} bank accounts`
            : "Bank account",
        lastErrorCode: accountIds.length > 0 ? null : "NO_ACCOUNTS",
        lastErrorMessage:
          accountIds.length > 0 ? null : "No bank accounts were returned",
      },
      include: this.connectedAccountInclude(),
    });

    await this.prisma.consentRecord.create({
      data: {
        userId,
        connectedAccountId: connection.id,
        provider: "gocardless_bank_data",
        status:
          accountIds.length > 0 ? ConsentStatus.GRANTED : ConsentStatus.ERROR,
        grantedAt: accountIds.length > 0 ? new Date() : null,
        expiresAt: updatedConnection.consentExpiresAt,
        metadata: {
          requisitionId: connection.providerConnectionId,
          accountCount: accountIds.length,
          providerStatus: requisition.status,
        },
      },
    });

    return toConnectedAccountResponse(updatedConnection);
  }

  async importTransactions(
    userId: string,
    connectionId: string,
  ): Promise<ImportTransactionsResult> {
    const connection = await this.findOwnedConnection(userId, connectionId);

    if (connection.status !== ConnectedAccountStatus.CONNECTED) {
      throw new NotFoundException("Connected account is not ready for import");
    }

    const externalAccounts = await this.prisma.externalAccount.findMany({
      where: {
        userId,
        connectedAccountId: connection.id,
        isSelected: true,
      },
    });

    let importedCount = 0;
    let skippedDuplicateCount = 0;
    let failedCount = 0;

    const importBatch = await this.prisma.importBatch.create({
      data: {
        userId,
        connectedAccountId: connection.id,
        status: ImportStatus.RUNNING,
        message: "Import started.",
      },
    });

    try {
      for (const externalAccount of externalAccounts) {
        const response = await this.goCardless.getAccountTransactions(
          externalAccount.providerAccountId,
        );
        const transactions = response.transactions?.booked ?? [];

        for (const transaction of transactions) {
          const normalized = normalizeGoCardlessTransaction(
            externalAccount.providerAccountId,
            transaction,
          );

          if (!normalized) {
            failedCount += 1;
            continue;
          }

          const existing = await this.prisma.externalTransaction.findUnique({
            where: {
              userId_providerTransactionId: {
                userId,
                providerTransactionId: normalized.providerTransactionId,
              },
            },
          });

          if (existing) {
            skippedDuplicateCount += 1;
            continue;
          }

          await this.prisma.externalTransaction.create({
            data: {
              userId,
              connectedAccountId: connection.id,
              importBatchId: importBatch.id,
              providerTransactionId: normalized.providerTransactionId,
              providerAccountId: normalized.providerAccountId,
              merchantName: normalized.merchantName,
              description: normalized.description,
              amountMinor: normalized.amountMinor,
              currency: normalized.currency,
              postedDate: normalized.postedDate,
              rawCategory: normalized.rawCategory,
              normalizedCategory: normalized.normalizedCategory,
              dedupeHash: normalized.dedupeHash,
            },
          });
          await this.prisma.expense.create({
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
              sourceAccountId: connection.id,
              importBatchId: importBatch.id,
              externalTransactionId: normalized.providerTransactionId,
            },
          });
          importedCount += 1;
        }
      }

      const message =
        importedCount > 0
          ? `Imported ${importedCount} expenses.`
          : "No new expenses found.";
      await this.prisma.importBatch.update({
        where: { id: importBatch.id },
        data: {
          status: ImportStatus.COMPLETED,
          importedCount,
          skippedDuplicateCount,
          failedCount,
          message,
          completedAt: new Date(),
        },
      });
      await this.prisma.connectedAccount.update({
        where: { id: connection.id },
        data: {
          lastImportAt: new Date(),
          lastSyncAt: new Date(),
          lastErrorCode: null,
          lastErrorMessage: null,
        },
      });

      return {
        importBatchId: importBatch.id,
        importedCount,
        skippedDuplicateCount,
        failedCount,
        message,
      };
    } catch (error) {
      const message = getErrorMessage(error);
      await this.prisma.importBatch.update({
        where: { id: importBatch.id },
        data: {
          status: ImportStatus.FAILED,
          importedCount,
          skippedDuplicateCount,
          failedCount: failedCount + 1,
          message,
          completedAt: new Date(),
        },
      });
      await this.prisma.connectedAccount.update({
        where: { id: connection.id },
        data: {
          status: ConnectedAccountStatus.ERROR,
          lastErrorCode: "IMPORT_FAILED",
          lastErrorMessage: message,
        },
      });
      throw error;
    }
  }

  async remove(userId: string, connectionId: string): Promise<void> {
    const result = await this.prisma.connectedAccount.deleteMany({
      where: { id: connectionId, userId },
    });

    if (result.count === 0) {
      throw new NotFoundException("Connected account not found");
    }
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
        select: { expenses: true },
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
}

function mapCurrency(value: string | undefined): CurrencyCode {
  const normalized = value?.trim().toUpperCase();

  if (normalized === CurrencyCode.GBP) {
    return CurrencyCode.GBP;
  }

  if (normalized === CurrencyCode.USD) {
    return CurrencyCode.USD;
  }

  return CurrencyCode.EUR;
}

function mapExternalAccountType(value: string | undefined): AccountType {
  const normalized = value?.trim().toLowerCase() ?? "";

  if (normalized.includes("savings")) {
    return AccountType.SAVINGS;
  }

  if (normalized.includes("card")) {
    return AccountType.CREDIT_CARD;
  }

  return AccountType.CHECKING;
}

function sanitizeAccountMetadata(account: unknown): Prisma.InputJsonValue {
  if (!account || typeof account !== "object") {
    return {};
  }

  const value = account as Record<string, unknown>;
  const metadata: Record<string, string> = {};

  if (typeof value.resourceId === "string") {
    metadata.resourceId = value.resourceId;
  }

  if (typeof value.iban === "string") {
    metadata.ibanLast4 = value.iban.slice(-4);
  }

  if (typeof value.product === "string") {
    metadata.product = value.product;
  }

  if (typeof value.status === "string") {
    metadata.status = value.status;
  }

  return metadata;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Transaction import failed";
}
