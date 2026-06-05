import { MockOcrResult } from "../../domain/receipts/receipt.types";
import { simulateReceiptOcr } from "../../lib/receiptOcrMock";

export const mockReceiptOcrProvider = {
  async scanReceiptMock(file: File): Promise<MockOcrResult> {
    return simulateReceiptOcr(file);
  },

  async scanReceipt(file: File): Promise<MockOcrResult> {
    return this.scanReceiptMock(file);
  },
};
