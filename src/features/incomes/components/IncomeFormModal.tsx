import React, { useEffect, useState } from "react";
import { Modal } from "../../../components/ui/Modal";
import { FormField } from "../../../components/ui/FormField";
import { Button } from "../../../components/ui/Button";
import {
  PAYMENT_METHODS,
  getPaymentMethodLabel,
} from "../../../domain/expenses/expense.constants";
import type {
  PaymentMethod,
  RecurringFrequency,
} from "../../../domain/expenses/expense.types";
import { INCOME_CATEGORY_OPTIONS } from "../../../domain/incomes/income.constants";
import type { Income } from "../../../domain/incomes/income.types";
import { getTodayDateString } from "../../../lib/dateUtils";

interface IncomeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (income: Omit<Income, "id">) => void;
  initialData?: Income | null;
}

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold text-slate-950 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white";

export const IncomeFormModal: React.FC<IncomeFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) => {
  const [source, setSource] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(getTodayDateString());
  const [category, setCategory] = useState<Income["category"]>("Salary");
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>("bank_transfer");
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringFrequency, setRecurringFrequency] =
    useState<RecurringFrequency>("monthly");
  const [notes, setNotes] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setSource(initialData?.source ?? "");
    setDescription(initialData?.description ?? "");
    setAmount(initialData ? String(initialData.amount) : "");
    setDate(initialData?.date ?? getTodayDateString());
    setCategory(initialData?.category ?? "Salary");
    setPaymentMethod(initialData?.paymentMethod ?? "bank_transfer");
    setIsRecurring(initialData?.isRecurring ?? false);
    setRecurringFrequency(initialData?.recurringFrequency ?? "monthly");
    setNotes(initialData?.notes ?? "");
    setErrorMessage("");
  }, [initialData, isOpen]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const parsedAmount = Number(amount);

    if (!source.trim()) {
      setErrorMessage("Enter the source of this income.");
      return;
    }
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setErrorMessage("Enter an amount greater than zero.");
      return;
    }
    if (!date) {
      setErrorMessage("Choose the date the income was received.");
      return;
    }

    onSubmit({
      source: source.trim(),
      description: description.trim(),
      amount: Math.round(parsedAmount * 100) / 100,
      date,
      category,
      accountSource: initialData?.accountSource ?? "manual",
      paymentMethod,
      isRecurring,
      recurringFrequency: isRecurring ? recurringFrequency : undefined,
      notes: notes.trim() || undefined,
      entrySource: initialData?.entrySource ?? "manual",
      sourceAccountId: initialData?.sourceAccountId,
      importBatchId: initialData?.importBatchId,
      externalTransactionId: initialData?.externalTransactionId,
      recurringTemplateId: initialData?.recurringTemplateId,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? "Edit Income" : "Add Income"}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <p className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-400">
            {errorMessage}
          </p>
        )}

        <FormField label="Income source">
          <input
            className={inputClass}
            value={source}
            onChange={(event) => setSource(event.target.value)}
            placeholder="Employer, client, investment..."
            maxLength={120}
            required
          />
        </FormField>

        <FormField label="Description">
          <input
            className={inputClass}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="August salary, project invoice..."
            maxLength={240}
          />
        </FormField>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Amount (EUR)">
            <input
              className={`${inputClass} font-mono`}
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="0.00"
              required
            />
          </FormField>
          <FormField label="Received date">
            <input
              className={inputClass}
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              required
            />
          </FormField>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Category">
            <select
              className={inputClass}
              value={category}
              onChange={(event) =>
                setCategory(event.target.value as Income["category"])
              }
            >
              {INCOME_CATEGORY_OPTIONS.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Payment method">
            <select
              className={inputClass}
              value={paymentMethod}
              onChange={(event) =>
                setPaymentMethod(event.target.value as PaymentMethod)
              }
            >
              {PAYMENT_METHODS.map((option) => (
                <option key={option} value={option}>
                  {getPaymentMethodLabel(option)}
                </option>
              ))}
            </select>
          </FormField>
        </div>

        <label className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-300">
          <input
            type="checkbox"
            checked={isRecurring}
            onChange={(event) => setIsRecurring(event.target.checked)}
            className="h-4 w-4 accent-indigo-600"
          />
          Recurring income
        </label>

        {isRecurring && (
          <FormField label="Frequency">
            <select
              className={inputClass}
              value={recurringFrequency}
              onChange={(event) =>
                setRecurringFrequency(event.target.value as RecurringFrequency)
              }
            >
              <option value="weekly">Weekly</option>
              <option value="bi-weekly">Every two weeks</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </FormField>
        )}

        <FormField label="Notes">
          <textarea
            className={inputClass}
            rows={2}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            maxLength={1000}
            placeholder="Optional notes"
          />
        </FormField>

        <Button type="submit" className="w-full">
          {initialData ? "Save Changes" : "Save Income"}
        </Button>
      </form>
    </Modal>
  );
};
