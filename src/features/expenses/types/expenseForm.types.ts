import { Expense, PaymentMethod, RecurringFrequency } from "../../../domain/expenses/expense.types";

export type ExpenseFormValues = {
  merchant: string;
  description: string;
  amount: number;
  category: string;
  accountSource: string;
  paymentMethod: PaymentMethod;
  isRecurring: boolean;
  recurringFrequency?: RecurringFrequency;
  date: string;
  notes?: string;
};

export type ExpenseFormSubmitPayload = ExpenseFormValues;

export type ExpenseFormInitialData = Partial<
  Pick<
    Expense,
    | "merchant"
    | "description"
    | "amount"
    | "category"
    | "accountSource"
    | "paymentMethod"
    | "isRecurring"
    | "recurringFrequency"
    | "date"
    | "notes"
  >
>;
