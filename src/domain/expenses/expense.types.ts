export type RecurringFrequency = "daily" | "weekly" | "bi-weekly" | "monthly" | "yearly";
export type ExpenseCategory = string;
export type PaymentMethod =
  | "cash"
  | "debit_card"
  | "credit_card"
  | "digital_wallet"
  | "bank_transfer";
export type ExpenseEntrySource = "manual" | "receipt_scan" | "connected_account" | "recurring_forecast";

export interface Expense {
  id: string;
  merchant: string;
  description: string;
  amount: number;
  date: string; // YYYY-MM-DD
  category: ExpenseCategory;
  accountSource: string; // ID of the source account
  paymentMethod: PaymentMethod;
  isRecurring: boolean;
  recurringFrequency?: RecurringFrequency;
  notes?: string;
  receiptId?: string;
  entrySource?: ExpenseEntrySource;
  sourceAccountId?: string;
  importBatchId?: string;
  externalTransactionId?: string;
  recurringTemplateId?: string;
}

export type CreateExpenseModel = Omit<Expense, "id">;
export type UpdateExpenseModel = Partial<CreateExpenseModel>;

export interface RuleSuggestion {
  keywords: readonly string[];
  suggestedCategory: string;
}
