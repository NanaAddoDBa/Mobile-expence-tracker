import type { PaymentMethod } from "./expense.types";

export const CATEGORY_OPTIONS = [
  "Food & Grocery",
  "Dining & Cafe",
  "Transport & Auto",
  "Housing & Utilities",
  "Entertainment & Leisure",
  "Shopping",
  "Healthcare",
  "Education & Kids",
  "Travel & Holiday",
  "Others",
] as const;

export const PAYMENT_METHODS = [
  "cash",
  "debit_card",
  "credit_card",
  "digital_wallet",
  "bank_transfer",
] as const satisfies readonly PaymentMethod[];

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: "Cash",
  debit_card: "Debit card",
  credit_card: "Credit card",
  digital_wallet: "Digital wallet",
  bank_transfer: "Bank transfer",
};

const PAYMENT_METHOD_ALIASES: Record<string, PaymentMethod> = {
  cash: "cash",
  debit_card: "debit_card",
  "debit card": "debit_card",
  credit_card: "credit_card",
  "credit card": "credit_card",
  digital_wallet: "digital_wallet",
  "digital wallet": "digital_wallet",
  wallet: "digital_wallet",
  bank_transfer: "bank_transfer",
  "bank transfer": "bank_transfer",
  connected_account: "debit_card",
  "connected account": "debit_card",
};

export function getPaymentMethodLabel(paymentMethod: PaymentMethod): string {
  return PAYMENT_METHOD_LABELS[paymentMethod];
}

export function normalizePaymentMethod(value: unknown): PaymentMethod {
  if (typeof value !== "string") {
    return "debit_card";
  }

  const normalized = value.trim().toLowerCase();
  const snakeCase = normalized.replace(/[\s-]+/g, "_");

  return PAYMENT_METHOD_ALIASES[normalized] || PAYMENT_METHOD_ALIASES[snakeCase] || "debit_card";
}
