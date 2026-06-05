import { Receipt, ReceiptOcrResult } from "../../domain/receipts/receipt.types";

export function buildReceiptOcrResult(
  overrides: Partial<ReceiptOcrResult> = {}
): ReceiptOcrResult {
  return {
    merchant: "Aldi",
    date: "2026-06-02",
    amount: 42.5,
    category: "Food & Grocery",
    detectedItems: [
      {
        name: "Groceries",
        price: 42.5,
      },
    ],
    confidence: 0.92,
    ...overrides,
  };
}

export function buildReceipt(overrides: Partial<Receipt> = {}): Receipt {
  return {
    id: "receipt-1",
    merchant: "Aldi",
    date: "2026-06-02",
    amount: 42.5,
    category: "Food & Grocery",
    detectedItems: [
      {
        name: "Groceries",
        price: 42.5,
      },
    ],
    ...overrides,
  };
}
