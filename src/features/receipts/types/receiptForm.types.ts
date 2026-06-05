import { CreateExpenseModel, PaymentMethod } from "../../../domain/expenses/expense.types";
import { MockOcrResult } from "../../../domain/receipts/receipt.types";

export type ReceiptReviewFormValues = {
  category: string;
  accountSource: string;
  paymentMethod: PaymentMethod;
  notes: string;
};

export type ReceiptReviewSubmitPayload = CreateExpenseModel;

export type ReceiptScanStatus = "idle" | "scanning" | "ready" | "error";

export type ReceiptReviewDraft = {
  ocrResult: MockOcrResult;
  filename: string;
  values: ReceiptReviewFormValues;
};
