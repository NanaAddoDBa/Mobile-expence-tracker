import { ConnectedAccount } from "../../../domain/accounts/account.types";
import { normalizePaymentMethod } from "../../../domain/expenses/expense.constants";
import { PaymentMethod, RecurringFrequency } from "../../../domain/expenses/expense.types";
import { categorizeExpense } from "../../../lib/categorizeExpense";
import { getTodayDateString } from "../../../lib/dateUtils";
import { validateExpense, ValidationResult } from "../../../lib/validation/expenseValidation";
import {
  ExpenseFormInitialData,
  ExpenseFormSubmitPayload,
} from "../types/expenseForm.types";

export interface ExpenseFormDraft {
  merchant: string;
  description: string;
  amount: string;
  category: string;
  accountSource: string;
  paymentMethod: PaymentMethod;
  isRecurring: boolean;
  recurringFrequency: RecurringFrequency;
  date: string;
  notes: string;
}

export const expenseFormService = {
  getInitialValues(
    initialData: ExpenseFormInitialData | undefined,
    accounts: ConnectedAccount[],
    today = getTodayDateString()
  ): ExpenseFormDraft {
    if (initialData) {
      return {
        merchant: initialData.merchant || "",
        description: initialData.description || "",
        amount: String(initialData.amount || ""),
        category: initialData.category || "Others",
        accountSource: initialData.accountSource || accounts[0]?.id || "acct-1",
        paymentMethod: normalizePaymentMethod(initialData.paymentMethod),
        isRecurring: initialData.isRecurring || false,
        recurringFrequency: initialData.recurringFrequency || "monthly",
        date: initialData.date || today,
        notes: initialData.notes || "",
      };
    }

    return {
      merchant: "",
      description: "",
      amount: "",
      category: "Others",
      accountSource: accounts[0]?.id || "acct-1",
      paymentMethod: "debit_card",
      isRecurring: false,
      recurringFrequency: "monthly",
      date: today,
      notes: "",
    };
  },

  getCategorySuggestion(merchant: string, description: string): string | null {
    if (!merchant && !description) {
      return null;
    }

    const suggested = categorizeExpense(merchant, description);
    return suggested && suggested !== "Others" ? suggested : null;
  },

  toSubmitPayload(values: ExpenseFormDraft): ExpenseFormSubmitPayload {
    const parsedAmount = parseFloat(values.amount);

    return {
      merchant: values.merchant.trim() || "Generic Merchant",
      description: values.description.trim(),
      amount: parsedAmount,
      category: values.category,
      accountSource: values.accountSource,
      paymentMethod: normalizePaymentMethod(values.paymentMethod),
      isRecurring: values.isRecurring,
      recurringFrequency: values.isRecurring ? values.recurringFrequency : undefined,
      date: values.date,
      notes: values.notes.trim() || undefined,
    };
  },

  validateDraft(values: ExpenseFormDraft): ValidationResult {
    const payload = this.toSubmitPayload(values);
    const validation = validateExpense(payload);

    if (Number.isNaN(payload.amount) || payload.amount <= 0) {
      return {
        isValid: false,
        errors: {
          ...validation.errors,
          amount: "Please enter a valid amount greater than 0",
        },
      };
    }

    return validation;
  },
};
