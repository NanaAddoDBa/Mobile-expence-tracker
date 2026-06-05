import { MockOcrResult } from "../../domain/receipts/receipt.types";
import { ValidationResult } from "./expenseValidation";

export function validateReceiptOcr(ocr: Partial<MockOcrResult>): ValidationResult {
  const errors: Record<string, string> = {};

  if (!ocr.merchant || !ocr.merchant.trim()) {
    errors.merchant = "Merchant is missing from the receipt scan";
  }

  if (ocr.amount === undefined || isNaN(ocr.amount) || ocr.amount <= 0) {
    errors.amount = "Receipt amount is missing or invalid";
  }

  if (!ocr.date) {
    errors.date = "Receipt date is missing";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
