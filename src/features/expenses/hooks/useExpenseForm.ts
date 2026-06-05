import { useState, useEffect } from "react";
import { ConnectedAccount } from "../../../domain/accounts/account.types";
import { PaymentMethod, RecurringFrequency } from "../../../domain/expenses/expense.types";
import {
  ExpenseFormInitialData,
  ExpenseFormSubmitPayload,
} from "../types/expenseForm.types";
import { expenseFormService, ExpenseFormDraft } from "../services/expenseFormService";

export function useExpenseForm(
  onSubmit: (data: ExpenseFormSubmitPayload) => void,
  initialData: ExpenseFormInitialData | undefined,
  accounts: ConnectedAccount[],
  isOpen: boolean
) {
  const [merchant, setMerchant] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [category, setCategory] = useState("Food & Grocery");
  const [accountSource, setAccountSource] = useState("acct-1");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("debit_card");
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringFrequency, setRecurringFrequency] = useState<RecurringFrequency>("monthly");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [magicSuggestion, setMagicSuggestion] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const values = expenseFormService.getInitialValues(initialData, accounts);
    setMerchant(values.merchant);
    setDescription(values.description);
    setAmount(values.amount);
    setDate(values.date);
    setCategory(values.category);
    setAccountSource(values.accountSource);
    setPaymentMethod(values.paymentMethod);
    setIsRecurring(values.isRecurring);
    setRecurringFrequency(values.recurringFrequency);
    setNotes(values.notes);
    setErrors({});
    setMagicSuggestion(null);
  }, [isOpen, initialData, accounts]);

  useEffect(() => {
    setMagicSuggestion(expenseFormService.getCategorySuggestion(merchant, description));
  }, [merchant, description]);

  const getDraft = (): ExpenseFormDraft => ({
    merchant,
    description,
    amount,
    date,
    category,
    accountSource,
    paymentMethod,
    isRecurring,
    recurringFrequency,
    notes,
  });

  const applyMagicSuggestion = () => {
    if (magicSuggestion) {
      setCategory(magicSuggestion);
      setMagicSuggestion(null);
    }
  };

  const handleSubmit = (): boolean => {
    const draft = getDraft();
    const validation = expenseFormService.validateDraft(draft);

    if (!validation.isValid) {
      setErrors(validation.errors);
      return false;
    }

    onSubmit(expenseFormService.toSubmitPayload(draft));
    setErrors({});
    return true;
  };

  return {
    merchant,
    setMerchant,
    description,
    setDescription,
    amount,
    setAmount,
    date,
    setDate,
    category,
    setCategory,
    accountSource,
    setAccountSource,
    paymentMethod,
    setPaymentMethod,
    isRecurring,
    setIsRecurring,
    recurringFrequency,
    setRecurringFrequency,
    notes,
    setNotes,
    errors,
    errorMessage: errors.amount || "",
    magicSuggestion,
    applyMagicSuggestion,
    handleSubmit,
  };
}
