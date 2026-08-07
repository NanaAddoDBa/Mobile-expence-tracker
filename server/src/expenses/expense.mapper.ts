import {
  CurrencyCode as PrismaCurrencyCode,
  EntrySource as PrismaEntrySource,
  Expense,
  ExpenseCategory as PrismaExpenseCategory,
  PaymentMethod as PrismaPaymentMethod,
  Prisma,
  RecurringFrequency as PrismaRecurringFrequency,
} from "@prisma/client";
import {
  CurrencyCode,
  EntrySource,
  ExpenseCategory,
  PaymentMethod,
  RecurringFrequency,
} from "../common/validation/enums.dto";
import { CreateExpenseDto } from "./dto/create-expense.dto";
import { UpdateExpenseDto } from "./dto/update-expense.dto";

export interface ExpenseResponse {
  id: string;
  merchant: string;
  description: string | null;
  amountMinor: number;
  currency: CurrencyCode;
  date: string;
  category: ExpenseCategory;
  paymentMethod: PaymentMethod;
  entrySource: EntrySource;
  notes: string | null;
  isRecurring: boolean;
  recurringFrequency: RecurringFrequency | null;
  receiptId: string | null;
  sourceAccountId: string | null;
  importBatchId: string | null;
  externalTransactionId: string | null;
  recurringTemplateId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const categoryToPrisma: Record<ExpenseCategory, PrismaExpenseCategory> = {
  [ExpenseCategory.HOUSING]: PrismaExpenseCategory.HOUSING,
  [ExpenseCategory.GROCERIES]: PrismaExpenseCategory.GROCERIES,
  [ExpenseCategory.TRANSPORT]: PrismaExpenseCategory.TRANSPORT,
  [ExpenseCategory.UTILITIES]: PrismaExpenseCategory.UTILITIES,
  [ExpenseCategory.DINING]: PrismaExpenseCategory.DINING,
  [ExpenseCategory.ENTERTAINMENT]: PrismaExpenseCategory.ENTERTAINMENT,
  [ExpenseCategory.HEALTH]: PrismaExpenseCategory.HEALTH,
  [ExpenseCategory.SHOPPING]: PrismaExpenseCategory.SHOPPING,
  [ExpenseCategory.EDUCATION]: PrismaExpenseCategory.EDUCATION,
  [ExpenseCategory.SUBSCRIPTIONS]: PrismaExpenseCategory.SUBSCRIPTIONS,
  [ExpenseCategory.TRANSFERS]: PrismaExpenseCategory.TRANSFERS,
  [ExpenseCategory.OTHER]: PrismaExpenseCategory.OTHER,
};

const categoryFromPrisma: Record<PrismaExpenseCategory, ExpenseCategory> = {
  [PrismaExpenseCategory.HOUSING]: ExpenseCategory.HOUSING,
  [PrismaExpenseCategory.GROCERIES]: ExpenseCategory.GROCERIES,
  [PrismaExpenseCategory.TRANSPORT]: ExpenseCategory.TRANSPORT,
  [PrismaExpenseCategory.UTILITIES]: ExpenseCategory.UTILITIES,
  [PrismaExpenseCategory.DINING]: ExpenseCategory.DINING,
  [PrismaExpenseCategory.ENTERTAINMENT]: ExpenseCategory.ENTERTAINMENT,
  [PrismaExpenseCategory.HEALTH]: ExpenseCategory.HEALTH,
  [PrismaExpenseCategory.SHOPPING]: ExpenseCategory.SHOPPING,
  [PrismaExpenseCategory.EDUCATION]: ExpenseCategory.EDUCATION,
  [PrismaExpenseCategory.SUBSCRIPTIONS]: ExpenseCategory.SUBSCRIPTIONS,
  [PrismaExpenseCategory.TRANSFERS]: ExpenseCategory.TRANSFERS,
  [PrismaExpenseCategory.OTHER]: ExpenseCategory.OTHER,
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

export function toExpenseResponse(expense: Expense): ExpenseResponse {
  return {
    id: expense.id,
    merchant: expense.merchant,
    description: expense.description,
    amountMinor: expense.amountMinor,
    currency: expense.currency as CurrencyCode,
    date: expense.date.toISOString().slice(0, 10),
    category: categoryFromPrisma[expense.category],
    paymentMethod: paymentMethodFromPrisma[expense.paymentMethod],
    entrySource: entrySourceFromPrisma[expense.entrySource],
    notes: expense.notes,
    isRecurring: expense.isRecurring,
    recurringFrequency: expense.recurringFrequency
      ? recurringFrequencyFromPrisma[expense.recurringFrequency]
      : null,
    receiptId: expense.receiptId,
    sourceAccountId: expense.sourceAccountId,
    importBatchId: expense.importBatchId,
    externalTransactionId: expense.externalTransactionId,
    recurringTemplateId: expense.recurringTemplateId,
    createdAt: expense.createdAt,
    updatedAt: expense.updatedAt,
  };
}

export function toExpenseCreateInput(
  userId: string,
  input: CreateExpenseDto,
): Prisma.ExpenseUncheckedCreateInput {
  return {
    userId,
    merchant: input.merchant.trim(),
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

export function toExpenseUpdateInput(
  input: UpdateExpenseDto,
): Prisma.ExpenseUncheckedUpdateInput {
  const data: Prisma.ExpenseUncheckedUpdateInput = {};

  if (input.merchant !== undefined) {
    data.merchant = input.merchant.trim();
  }

  if (input.description !== undefined) {
    data.description = cleanOptionalString(input.description);
  }

  if (input.amountMinor !== undefined) {
    data.amountMinor = input.amountMinor;
  }

  if (input.currency !== undefined) {
    data.currency = PrismaCurrencyCode.EUR;
  }

  if (input.date !== undefined) {
    data.date = parseDateOnly(input.date);
  }

  if (input.category !== undefined) {
    data.category = categoryToPrisma[input.category];
  }

  if (input.paymentMethod !== undefined) {
    data.paymentMethod = paymentMethodToPrisma[input.paymentMethod];
  }

  if (input.entrySource !== undefined) {
    data.entrySource = entrySourceToPrisma[input.entrySource];
  }

  if (input.notes !== undefined) {
    data.notes = cleanOptionalString(input.notes);
  }

  if (input.isRecurring !== undefined) {
    data.isRecurring = input.isRecurring;
    if (!input.isRecurring) {
      data.recurringFrequency = null;
    }
  }

  if (input.recurringFrequency !== undefined) {
    data.recurringFrequency = input.recurringFrequency
      ? recurringFrequencyToPrisma[input.recurringFrequency]
      : null;
  }

  return data;
}

export function parseDateOnly(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

function cleanOptionalString(value: string | undefined): string | null {
  if (value === undefined) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}
