export interface DetectedReceiptItem {
  name: string;
  price: number;
}

export interface MockOcrResult {
  merchant: string;
  date: string; // YYYY-MM-DD
  amount: number;
  category: string;
  detectedItems: DetectedReceiptItem[];
  confidence: number;
}

export type ReceiptOcrResult = MockOcrResult;
export type ReceiptScanStatus = "idle" | "scanning" | "success" | "error";

export interface Receipt {
  id: string;
  merchant: string;
  date: string;
  amount: number;
  category: string;
  detectedItems: DetectedReceiptItem[];
}
