import { describe, expect, test } from "vitest";
import {
  getPaymentMethodLabel,
  normalizePaymentMethod,
  PAYMENT_METHODS,
} from "../domain/expenses/expense.constants";

describe("payment method helpers", () => {
  test("returns display labels for stable payment method IDs", () => {
    expect(PAYMENT_METHODS.map(getPaymentMethodLabel)).toEqual([
      "Cash",
      "Debit card",
      "Credit card",
      "Digital wallet",
      "Bank transfer",
    ]);
  });

  test("normalizes legacy payment method labels to stable IDs", () => {
    expect(normalizePaymentMethod("Cash")).toBe("cash");
    expect(normalizePaymentMethod("Debit Card")).toBe("debit_card");
    expect(normalizePaymentMethod("Debit card")).toBe("debit_card");
    expect(normalizePaymentMethod("Credit Card")).toBe("credit_card");
    expect(normalizePaymentMethod("Credit card")).toBe("credit_card");
    expect(normalizePaymentMethod("Digital Wallet")).toBe("digital_wallet");
    expect(normalizePaymentMethod("Digital wallet")).toBe("digital_wallet");
    expect(normalizePaymentMethod("Wallet")).toBe("digital_wallet");
    expect(normalizePaymentMethod("Bank Transfer")).toBe("bank_transfer");
    expect(normalizePaymentMethod("Bank transfer")).toBe("bank_transfer");
  });

  test("does not preserve connected account as a payment method", () => {
    expect(normalizePaymentMethod("Connected Account")).toBe("debit_card");
  });
});
