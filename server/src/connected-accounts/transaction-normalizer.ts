import { createHash } from "crypto";
import {
  CurrencyCode,
  ExpenseCategory,
  IncomeCategory,
  PaymentMethod,
  TransactionDirection,
} from "@prisma/client";
import { GoCardlessTransaction } from "./providers/gocardless-bank-data.client";

export interface NormalizedImportedTransaction {
  providerTransactionId: string;
  providerAccountId: string;
  merchantName: string;
  description: string;
  amountMinor: number;
  direction: TransactionDirection;
  currency: CurrencyCode;
  postedDate: Date;
  rawCategory: string | null;
  normalizedCategory: ExpenseCategory | null;
  normalizedIncomeCategory: IncomeCategory | null;
  dedupeHash: string;
  paymentMethod: PaymentMethod;
}

export function normalizeGoCardlessTransaction(
  providerAccountId: string,
  transaction: GoCardlessTransaction,
): NormalizedImportedTransaction | null {
  const amount = Number(transaction.transactionAmount.amount);

  if (!Number.isFinite(amount) || amount === 0) {
    return null;
  }

  const currency = normalizeCurrency(transaction.transactionAmount.currency);

  if (!currency) {
    return null;
  }

  const postedDate = parseDateOnly(transaction.bookingDate || transaction.valueDate);

  if (!postedDate) {
    return null;
  }

  const description = cleanText(
    transaction.remittanceInformationUnstructured ||
      transaction.additionalInformation ||
      transaction.bankTransactionCode ||
      "Imported transaction",
  );
  const direction =
    amount > 0 ? TransactionDirection.INFLOW : TransactionDirection.OUTFLOW;
  const merchantName = cleanText(
    (direction === TransactionDirection.INFLOW
      ? transaction.debtorName || transaction.creditorName
      : transaction.creditorName || transaction.debtorName) ||
      inferMerchantFromDescription(description),
  );
  const amountMinor = Math.round(Math.abs(amount) * 100);
  const rawTransactionId =
    transaction.transactionId ||
    createDedupeHash([
      providerAccountId,
      postedDate.toISOString().slice(0, 10),
      direction,
      String(amountMinor),
      description,
    ]);
  const providerTransactionId = `gocardless:${providerAccountId}:${rawTransactionId}`;
  const dedupeHash = createDedupeHash([
    providerAccountId,
    postedDate.toISOString().slice(0, 10),
    direction,
    String(amountMinor),
    currency,
    merchantName,
    description,
  ]);

  return {
    providerTransactionId,
    providerAccountId,
    merchantName,
    description,
    amountMinor,
    direction,
    currency,
    postedDate,
    rawCategory: transaction.bankTransactionCode ?? null,
    normalizedCategory:
      direction === TransactionDirection.OUTFLOW
        ? categorizeExpense(`${merchantName} ${description}`)
        : null,
    normalizedIncomeCategory:
      direction === TransactionDirection.INFLOW
        ? categorizeIncome(`${merchantName} ${description}`)
        : null,
    dedupeHash,
    paymentMethod: PaymentMethod.BANK_TRANSFER,
  };
}

export function createDedupeHash(parts: string[]): string {
  return createHash("sha256").update(parts.join("|")).digest("hex");
}

function parseDateOnly(value?: string): Date | null {
  if (!value) {
    return null;
  }

  return new Date(`${value}T00:00:00.000Z`);
}

function normalizeCurrency(value: string): CurrencyCode | null {
  const normalized = value.trim().toUpperCase();

  return normalized === CurrencyCode.EUR ? CurrencyCode.EUR : null;
}

function cleanText(value: string): string {
  return value.replace(/\s+/g, " ").trim() || "Imported transaction";
}

function inferMerchantFromDescription(description: string): string {
  return description
    .replace(/^payment\s+/i, "")
    .replace(/^card\s+/i, "")
    .split(/\s{2,}|,|-/)[0]
    .trim()
    .slice(0, 120) || "Imported transaction";
}

function categorizeExpense(value: string): ExpenseCategory {
  const text = value.toLowerCase();

  if (matchesAny(text, ["rent", "housing", "utility", "electric", "water", "internet"])) {
    return ExpenseCategory.HOUSING;
  }

  if (matchesAny(text, ["aldi", "lidl", "rewe", "edeka", "grocery", "supermarket"])) {
    return ExpenseCategory.GROCERIES;
  }

  if (matchesAny(text, ["uber", "bolt", "train", "bus", "fuel", "parking", "transport"])) {
    return ExpenseCategory.TRANSPORT;
  }

  if (matchesAny(text, ["restaurant", "cafe", "coffee", "burger", "pizza", "deliveroo"])) {
    return ExpenseCategory.DINING;
  }

  if (matchesAny(text, ["netflix", "spotify", "cinema", "theatre", "ticket"])) {
    return ExpenseCategory.ENTERTAINMENT;
  }

  if (matchesAny(text, ["pharmacy", "doctor", "clinic", "health"])) {
    return ExpenseCategory.HEALTH;
  }

  if (matchesAny(text, ["amazon", "ikea", "shop", "store"])) {
    return ExpenseCategory.SHOPPING;
  }

  if (matchesAny(text, ["school", "course", "university", "book"])) {
    return ExpenseCategory.EDUCATION;
  }

  if (matchesAny(text, ["hotel", "flight", "airline", "holiday", "travel"])) {
    return ExpenseCategory.TRAVEL;
  }

  return ExpenseCategory.OTHER;
}

function categorizeIncome(value: string): IncomeCategory {
  const text = value.toLowerCase();

  if (matchesAny(text, ["salary", "payroll", "wage", "pay slip", "payslip"])) {
    return IncomeCategory.SALARY;
  }

  if (matchesAny(text, ["freelance", "contractor", "consulting", "invoice payment"])) {
    return IncomeCategory.FREELANCE;
  }

  if (matchesAny(text, ["business", "client payment", "customer payment"])) {
    return IncomeCategory.BUSINESS;
  }

  if (matchesAny(text, ["interest", "dividend", "distribution", "investment"])) {
    return IncomeCategory.INVESTMENT;
  }

  if (matchesAny(text, ["benefit", "pension", "allowance", "arbeitslosengeld"])) {
    return IncomeCategory.BENEFITS;
  }

  if (matchesAny(text, ["refund", "cashback", "reversal"])) {
    return IncomeCategory.REFUND;
  }

  if (matchesAny(text, ["reimbursement", "expense repayment"])) {
    return IncomeCategory.REIMBURSEMENT;
  }

  if (matchesAny(text, ["gift", "birthday"])) {
    return IncomeCategory.GIFT;
  }

  if (matchesAny(text, ["transfer", "internal", "own account"])) {
    return IncomeCategory.TRANSFERS;
  }

  return IncomeCategory.OTHER;
}

function matchesAny(text: string, needles: string[]): boolean {
  return needles.some((needle) => text.includes(needle));
}
