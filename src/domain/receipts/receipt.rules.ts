import { MockOcrResult } from "./receipt.types";
import { Expense, PaymentMethod } from "../expenses/expense.types";

/**
 * Suggests an initial category value matching terms parsed within an attachment's filename.
 */
export function suggestCategoryFromFilename(filename: string): string {
  const norm = (filename || "").toLowerCase();
  
  if (norm.includes("starbucks") || norm.includes("coffee") || norm.includes("cafe") || norm.includes("drink")) {
    return "Dining & Cafe";
  }
  if (norm.includes("zara") || norm.includes("cloth") || norm.includes("wear") || norm.includes("shirt")) {
    return "Shopping";
  }
  if (norm.includes("shell") || norm.includes("fuel") || norm.includes("petrol") || norm.includes("gas") || norm.includes("esso")) {
    return "Transport & Auto";
  }
  if (norm.includes("boots") || norm.includes("pharm") || norm.includes("health") || norm.includes("drug")) {
    return "Healthcare";
  }
  if (norm.includes("lidl") || norm.includes("aldi") || norm.includes("grocery") || norm.includes("supermarket")) {
    return "Food & Grocery";
  }
  
  return "Others";
}

/**
 * Maps parsed OCR receipt parameters and UI choices into a structured new expense object model.
 */
export function mapOcrToExpense(
  ocrResult: MockOcrResult,
  filename: string,
  category: string,
  accountId: string,
  paymentMethod: PaymentMethod,
  notesOption: string
): Omit<Expense, "id"> {
  const finalNotes = notesOption.trim()
    ? notesOption.trim()
    : `Added from mock receipt scan. Match: ${(ocrResult.confidence * 100).toFixed(0)}%.`;

  return {
    merchant: ocrResult.merchant,
    description: `Receipt scan: ${ocrResult.detectedItems.length} items from ${filename}`,
    amount: ocrResult.amount,
    category: category,
    accountSource: accountId,
    paymentMethod: paymentMethod,
    isRecurring: false,
    date: ocrResult.date,
    notes: finalNotes,
  };
}
