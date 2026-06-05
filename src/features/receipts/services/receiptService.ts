import { MockOcrResult } from "../../../domain/receipts/receipt.types";
import { normalizePaymentMethod } from "../../../domain/expenses/expense.constants";
import { CreateExpenseModel, PaymentMethod } from "../../../domain/expenses/expense.types";
import { suggestCategoryFromFilename, mapOcrToExpense } from "../../../domain/receipts/receipt.rules";
import { validateReceiptOcr } from "../../../lib/validation/receiptValidation";
import {
  ReceiptReviewFormValues,
  ReceiptReviewSubmitPayload,
} from "../types/receiptForm.types";

const SCAN_STATUS_MESSAGES = [
  "Starting receipt scan...",
  "Reading the uploaded receipt...",
  "Finding merchant and receipt details...",
  "Reading amounts and line items...",
  "Receipt scanned.",
];

export const receiptService = {
  getScanStatusMessages(): string[] {
    return SCAN_STATUS_MESSAGES;
  },

  suggestCategory(filename: string): string {
    return suggestCategoryFromFilename(filename);
  },

  createReviewValues(ocrResult: MockOcrResult, filename: string): ReceiptReviewFormValues {
    return {
      category: this.suggestCategory(filename) || ocrResult.category,
      accountSource: "acct-1",
      paymentMethod: "debit_card",
      notes: "",
    };
  },

  generateReceiptId(filename: string, scannedAt: Date = new Date()): string {
    const safeName = filename
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 32) || "receipt";
    return `receipt-${safeName}-${scannedAt.getTime()}`;
  },

  validateOcrResult(ocrResult: Partial<MockOcrResult>) {
    return validateReceiptOcr(ocrResult);
  },

  createExpensePayload(
    ocrResult: MockOcrResult,
    filename: string,
    reviewValues: ReceiptReviewFormValues,
    receiptId?: string
  ): ReceiptReviewSubmitPayload {
    return {
      ...mapOcrToExpense(
        ocrResult,
        filename,
        reviewValues.category,
        reviewValues.accountSource,
        normalizePaymentMethod(reviewValues.paymentMethod),
        reviewValues.notes
      ),
      entrySource: "receipt_scan",
      receiptId: receiptId || this.generateReceiptId(filename),
    };
  },

  validateAndMap(
    ocrResult: MockOcrResult,
    filename: string,
    category: string,
    accountId: string,
    paymentMethod: PaymentMethod,
    notes: string
  ): {
    isValid: boolean;
    errors: Record<string, string>;
    mappedExpense: CreateExpenseModel | null;
  } {
    const validation = this.validateOcrResult(ocrResult);
    if (!validation.isValid) {
      return {
        isValid: false,
        errors: validation.errors,
        mappedExpense: null,
      };
    }

    const expense = this.createExpensePayload(ocrResult, filename, {
      category,
      accountSource: accountId,
      paymentMethod,
      notes,
    });

    return {
      isValid: true,
      errors: {},
      mappedExpense: expense,
    };
  },
};
