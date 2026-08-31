import type {
  ExpenseEntrySource,
  PaymentMethod,
  RecurringFrequency,
} from "../expenses/expense.types";

export type IncomeCategory =
  | "Salary"
  | "Freelance"
  | "Business"
  | "Investment"
  | "Benefits"
  | "Gift"
  | "Refund"
  | "Reimbursement"
  | "Transfers"
  | "Other";

export interface Income {
  id: string;
  source: string;
  description: string;
  amount: number;
  date: string;
  category: IncomeCategory;
  accountSource: string;
  paymentMethod: PaymentMethod;
  isRecurring: boolean;
  recurringFrequency?: RecurringFrequency;
  notes?: string;
  entrySource?: ExpenseEntrySource;
  sourceAccountId?: string;
  importBatchId?: string;
  externalTransactionId?: string;
  recurringTemplateId?: string;
}

export type CreateIncomeModel = Omit<Income, "id">;
export type UpdateIncomeModel = Partial<CreateIncomeModel>;
