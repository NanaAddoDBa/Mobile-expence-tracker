import {
  CurrencyCode as PrismaCurrencyCode,
  EntrySource as PrismaEntrySource,
  Income as PrismaIncome,
  IncomeCategory as PrismaIncomeCategory,
  PaymentMethod as PrismaPaymentMethod,
  Prisma,
  RecurringFrequency as PrismaRecurringFrequency,
} from "@prisma/client";
import {
  CurrencyCode,
  EntrySource,
  IncomeCategory,
  PaymentMethod,
  RecurringFrequency,
} from "../common/validation/enums.dto";
import { CreateIncomeDto } from "./dto/create-income.dto";
import { UpdateIncomeDto } from "./dto/update-income.dto";

export interface IncomeResponse {
  id: string;
  source: string;
  description: string | null;
  amountMinor: number;
  currency: CurrencyCode;
  date: string;
  category: IncomeCategory;
  paymentMethod: PaymentMethod;
  entrySource: EntrySource;
  notes: string | null;
  sourceAccountId: string | null;
  importBatchId: string | null;
  externalTransactionId: string | null;
  isRecurring: boolean;
  recurringFrequency: RecurringFrequency | null;
  recurringTemplateId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const categoryToPrisma: Record<IncomeCategory, PrismaIncomeCategory> = {
  [IncomeCategory.SALARY]: PrismaIncomeCategory.SALARY,
  [IncomeCategory.FREELANCE]: PrismaIncomeCategory.FREELANCE,
  [IncomeCategory.BUSINESS]: PrismaIncomeCategory.BUSINESS,
  [IncomeCategory.INVESTMENT]: PrismaIncomeCategory.INVESTMENT,
  [IncomeCategory.BENEFITS]: PrismaIncomeCategory.BENEFITS,
  [IncomeCategory.GIFT]: PrismaIncomeCategory.GIFT,
  [IncomeCategory.REFUND]: PrismaIncomeCategory.REFUND,
  [IncomeCategory.REIMBURSEMENT]: PrismaIncomeCategory.REIMBURSEMENT,
  [IncomeCategory.TRANSFERS]: PrismaIncomeCategory.TRANSFERS,
  [IncomeCategory.OTHER]: PrismaIncomeCategory.OTHER,
};

const categoryFromPrisma: Record<PrismaIncomeCategory, IncomeCategory> = {
  [PrismaIncomeCategory.SALARY]: IncomeCategory.SALARY,
  [PrismaIncomeCategory.FREELANCE]: IncomeCategory.FREELANCE,
  [PrismaIncomeCategory.BUSINESS]: IncomeCategory.BUSINESS,
  [PrismaIncomeCategory.INVESTMENT]: IncomeCategory.INVESTMENT,
  [PrismaIncomeCategory.BENEFITS]: IncomeCategory.BENEFITS,
  [PrismaIncomeCategory.GIFT]: IncomeCategory.GIFT,
  [PrismaIncomeCategory.REFUND]: IncomeCategory.REFUND,
  [PrismaIncomeCategory.REIMBURSEMENT]: IncomeCategory.REIMBURSEMENT,
  [PrismaIncomeCategory.TRANSFERS]: IncomeCategory.TRANSFERS,
  [PrismaIncomeCategory.OTHER]: IncomeCategory.OTHER,
};

const paymentMethodToPrisma: Record<PaymentMethod, PrismaPaymentMethod> = {
  [PaymentMethod.CASH]: PrismaPaymentMethod.CASH,
  [PaymentMethod.DEBIT_CARD]: PrismaPaymentMethod.DEBIT_CARD,
  [PaymentMethod.CREDIT_CARD]: PrismaPaymentMethod.CREDIT_CARD,
  [PaymentMethod.DIGITAL_WALLET]: PrismaPaymentMethod.DIGITAL_WALLET,
  [PaymentMethod.BANK_TRANSFER]: PrismaPaymentMethod.BANK_TRANSFER,
};

const paymentMethodFromPrisma: Record<PrismaPaymentMethod, PaymentMethod> = {
  [PrismaPaymentMethod.CASH]: PaymentMethod.CASH,
  [PrismaPaymentMethod.DEBIT_CARD]: PaymentMethod.DEBIT_CARD,
  [PrismaPaymentMethod.CREDIT_CARD]: PaymentMethod.CREDIT_CARD,
  [PrismaPaymentMethod.DIGITAL_WALLET]: PaymentMethod.DIGITAL_WALLET,
  [PrismaPaymentMethod.BANK_TRANSFER]: PaymentMethod.BANK_TRANSFER,
};

const entrySourceToPrisma: Record<EntrySource, PrismaEntrySource> = {
  [EntrySource.MANUAL]: PrismaEntrySource.MANUAL,
  [EntrySource.RECEIPT_SCAN]: PrismaEntrySource.RECEIPT_SCAN,
  [EntrySource.CONNECTED_ACCOUNT]: PrismaEntrySource.CONNECTED_ACCOUNT,
  [EntrySource.RECURRING_FORECAST]: PrismaEntrySource.RECURRING_FORECAST,
};

const entrySourceFromPrisma: Record<PrismaEntrySource, EntrySource> = {
  [PrismaEntrySource.MANUAL]: EntrySource.MANUAL,
  [PrismaEntrySource.RECEIPT_SCAN]: EntrySource.RECEIPT_SCAN,
  [PrismaEntrySource.CONNECTED_ACCOUNT]: EntrySource.CONNECTED_ACCOUNT,
  [PrismaEntrySource.RECURRING_FORECAST]: EntrySource.RECURRING_FORECAST,
};

const recurringFrequencyToPrisma: Record<
  RecurringFrequency,
  PrismaRecurringFrequency
> = {
  [RecurringFrequency.DAILY]: PrismaRecurringFrequency.DAILY,
  [RecurringFrequency.WEEKLY]: PrismaRecurringFrequency.WEEKLY,
  [RecurringFrequency.BI_WEEKLY]: PrismaRecurringFrequency.BI_WEEKLY,
  [RecurringFrequency.MONTHLY]: PrismaRecurringFrequency.MONTHLY,
  [RecurringFrequency.YEARLY]: PrismaRecurringFrequency.YEARLY,
};

const recurringFrequencyFromPrisma: Record<
  PrismaRecurringFrequency,
  RecurringFrequency
> = {
  [PrismaRecurringFrequency.DAILY]: RecurringFrequency.DAILY,
  [PrismaRecurringFrequency.WEEKLY]: RecurringFrequency.WEEKLY,
  [PrismaRecurringFrequency.BI_WEEKLY]: RecurringFrequency.BI_WEEKLY,
  [PrismaRecurringFrequency.MONTHLY]: RecurringFrequency.MONTHLY,
  [PrismaRecurringFrequency.YEARLY]: RecurringFrequency.YEARLY,
};

export function toIncomeResponse(income: PrismaIncome): IncomeResponse {
  return {
    id: income.id,
    source: income.source,
    description: income.description,
    amountMinor: income.amountMinor,
    currency: income.currency as CurrencyCode,
    date: income.date.toISOString().slice(0, 10),
    category: categoryFromPrisma[income.category],
    paymentMethod: paymentMethodFromPrisma[income.paymentMethod],
    entrySource: entrySourceFromPrisma[income.entrySource],
    notes: income.notes,
    sourceAccountId: income.sourceAccountId,
    importBatchId: income.importBatchId,
    externalTransactionId: income.externalTransactionId,
    isRecurring: income.isRecurring,
    recurringFrequency: income.recurringFrequency
      ? recurringFrequencyFromPrisma[income.recurringFrequency]
      : null,
    recurringTemplateId: income.recurringTemplateId,
    createdAt: income.createdAt,
    updatedAt: income.updatedAt,
  };
}

export function toIncomeCreateInput(
  userId: string,
  input: CreateIncomeDto,
): Prisma.IncomeUncheckedCreateInput {
  return {
    userId,
    source: input.source.trim(),
    description: cleanOptionalString(input.description),
    amountMinor: input.amountMinor,
    currency: PrismaCurrencyCode.EUR,
    date: parseDateOnly(input.date),
    category: categoryToPrisma[input.category],
    paymentMethod: paymentMethodToPrisma[input.paymentMethod],
    entrySource: entrySourceToPrisma[input.entrySource ?? EntrySource.MANUAL],
    notes: cleanOptionalString(input.notes),
    isRecurring: input.isRecurring ?? false,
    recurringFrequency:
      input.isRecurring && input.recurringFrequency
        ? recurringFrequencyToPrisma[input.recurringFrequency]
        : null,
  };
}

export function toIncomeUpdateInput(
  input: UpdateIncomeDto,
): Prisma.IncomeUncheckedUpdateInput {
  const data: Prisma.IncomeUncheckedUpdateInput = {};

  if (input.source !== undefined) data.source = input.source.trim();
  if (input.description !== undefined) {
    data.description = cleanOptionalString(input.description);
  }
  if (input.amountMinor !== undefined) data.amountMinor = input.amountMinor;
  if (input.currency !== undefined) data.currency = PrismaCurrencyCode.EUR;
  if (input.date !== undefined) data.date = parseDateOnly(input.date);
  if (input.category !== undefined) data.category = categoryToPrisma[input.category];
  if (input.paymentMethod !== undefined) {
    data.paymentMethod = paymentMethodToPrisma[input.paymentMethod];
  }
  if (input.entrySource !== undefined) {
    data.entrySource = entrySourceToPrisma[input.entrySource];
  }
  if (input.notes !== undefined) data.notes = cleanOptionalString(input.notes);
  if (input.isRecurring !== undefined) {
    data.isRecurring = input.isRecurring;
    if (!input.isRecurring) data.recurringFrequency = null;
  }
  if (input.recurringFrequency !== undefined) {
    data.recurringFrequency = input.recurringFrequency
      ? recurringFrequencyToPrisma[input.recurringFrequency]
      : null;
  }

  return data;
}

export function parseIncomeDateOnly(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

function cleanOptionalString(value: string | undefined): string | null {
  if (value === undefined) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseDateOnly(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}
