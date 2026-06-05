import { describe, test, expect } from "vitest";
import { receiptService } from "../features/receipts/services/receiptService";
import { MockOcrResult } from "../domain/receipts/receipt.types";

describe("receiptService parsing coordinator", () => {
  const ocrResult: MockOcrResult = {
    merchant: "Lidl Store",
    date: "2026-06-02",
    amount: 43.15,
    category: "Food & Grocery",
    detectedItems: [{ name: "Milk", price: 1.5 }],
    confidence: 0.95,
  };

  test("suggests correct category from attachment filename metadata", () => {
    expect(receiptService.suggestCategory("starbucks_coffee_june.png")).toBe("Dining & Cafe");
    expect(receiptService.suggestCategory("lidl_weekly_shop.jpeg")).toBe("Food & Grocery");
    expect(receiptService.suggestCategory("others_random.pdf")).toBe("Others");
  });

  test("maps parsed OCR output to editable receipt review values", () => {
    const values = receiptService.createReviewValues(ocrResult, "lidl_receipt_02_june.png");

    expect(values).toEqual({
      category: "Food & Grocery",
      accountSource: "acct-1",
      paymentMethod: "debit_card",
      notes: "",
    });
  });

  test("creates an expense payload with a receiptId", () => {
    const payload = receiptService.createExpensePayload(
      ocrResult,
      "lidl_receipt_02_june.png",
      {
        category: "Food & Grocery",
        accountSource: "acct-1",
        paymentMethod: "debit_card",
        notes: "",
      },
      "receipt-fixed-id"
    );

    expect(payload.receiptId).toBe("receipt-fixed-id");
    expect(payload.entrySource).toBe("receipt_scan");
    expect(payload.merchant).toBe("Lidl Store");
    expect(payload.amount).toBe(43.15);
    expect(payload.isRecurring).toBe(false);
  });

  test("preserves linked expense metadata from review values", () => {
    const payload = receiptService.createExpensePayload(
      ocrResult,
      "lidl_receipt_02_june.png",
      {
        category: "Shopping",
        accountSource: "acct-connected",
        paymentMethod: "debit_card",
        notes: "Reviewed receipt",
      },
      "receipt-linked-id"
    );

    expect(payload).toMatchObject({
      category: "Shopping",
      accountSource: "acct-connected",
      paymentMethod: "debit_card",
      notes: "Reviewed receipt",
      receiptId: "receipt-linked-id",
      entrySource: "receipt_scan",
    });
  });

  test("validates and maps parsed OCR output to an expense draft model", () => {
    const res = receiptService.validateAndMap(
      ocrResult,
      "lidl_receipt_02_june.png",
      "Food & Grocery",
      "acct-1",
      "debit_card",
      ""
    );

    expect(res.isValid).toBe(true);
    expect(res.mappedExpense).not.toBeNull();
    expect(res.mappedExpense?.merchant).toBe("Lidl Store");
    expect(res.mappedExpense?.amount).toBe(43.15);
    expect(res.mappedExpense?.receiptId).toMatch(/^receipt-lidl-receipt-02-june-png-/);
  });

  test("reports invalid OCR results before creating an expense", () => {
    const validation = receiptService.validateOcrResult({
      merchant: "",
      amount: 0,
      date: "",
      category: "Food & Grocery",
      detectedItems: [],
      confidence: 0.9,
    });

    expect(validation.isValid).toBe(false);
    expect(validation.errors.merchant).toBeDefined();
    expect(validation.errors.amount).toBeDefined();
    expect(validation.errors.date).toBeDefined();
  });
});
