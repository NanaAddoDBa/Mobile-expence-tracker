import React from "react";
import { Sparkles } from "lucide-react";
import { ConnectedAccount } from "../../../domain/accounts/account.types";
import { PaymentMethod } from "../../../domain/expenses/expense.types";
import { InlineMessage } from "../../../components/feedback/InlineMessage";
import { useExpenseForm } from "../hooks/useExpenseForm";
import { ExpenseCategorySelect } from "./ExpenseCategorySelect";
import { PaymentMethodSelect } from "./PaymentMethodSelect";
import { RecurringExpenseFields } from "./RecurringExpenseFields";

type ExpenseFormState = ReturnType<typeof useExpenseForm>;

interface ExpenseFormProps {
  form: ExpenseFormState;
  accounts: ConnectedAccount[];
  categoryOptions: readonly string[];
  paymentMethods: readonly PaymentMethod[];
  submitLabel: string;
}

export const ExpenseForm: React.FC<ExpenseFormProps> = ({
  form,
  accounts,
  categoryOptions,
  paymentMethods,
  submitLabel,
}) => {
  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    form.handleSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {form.errorMessage && <InlineMessage tone="error" message={form.errorMessage} />}

      <div>
        <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
          Store/Merchant
        </label>
        <input
          type="text"
          required
          value={form.merchant}
          onChange={(e) => form.setMerchant(e.target.value)}
          className="w-full text-xs font-semibold px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 rounded-xl text-slate-950 dark:text-white"
          placeholder="E.g., Aldi, Starbucks..."
        />
      </div>

      <div>
        <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
          Brief Description
        </label>
        <input
          type="text"
          value={form.description}
          onChange={(e) => form.setDescription(e.target.value)}
          className="w-full text-xs font-semibold px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 rounded-xl text-slate-950 dark:text-white"
          placeholder="E.g., Friday grocery preps"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Amount (EUR)
          </label>
          <input
            type="number"
            step="0.01"
            required
            value={form.amount}
            onChange={(e) => form.setAmount(e.target.value)}
            className="w-full text-xs font-semibold px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 rounded-xl text-slate-950 dark:text-white font-mono"
            placeholder="0.00"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Spent Date
          </label>
          <input
            type="date"
            required
            value={form.date}
            onChange={(e) => form.setDate(e.target.value)}
            className="w-full text-xs font-semibold px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 rounded-xl text-slate-950 dark:text-white font-sans"
          />
        </div>
      </div>

      {form.magicSuggestion && (
        <div className="p-3 bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            <span className="text-[11px] font-semibold text-slate-600 dark:text-indigo-300">
              Suggested category: <span className="font-bold text-indigo-600 dark:text-indigo-400">{form.magicSuggestion}</span>
            </span>
          </div>
          <button
            type="button"
            onClick={form.applyMagicSuggestion}
            className="text-[10px] bg-indigo-600 hover:bg-indigo-700 text-white dark:bg-indigo-500/25 dark:hover:bg-indigo-500/40 text-[9px] font-extrabold uppercase px-2.5 py-1 rounded-lg tracking-wider transition-colors cursor-pointer"
          >
            Apply suggestion
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <ExpenseCategorySelect
          value={form.category}
          onChange={form.setCategory}
          categoryOptions={categoryOptions}
        />

        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Source Account
          </label>
          <select
            value={form.accountSource}
            onChange={(e) => form.setAccountSource(e.target.value)}
            className="w-full text-xs font-semibold px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 rounded-xl text-slate-950 dark:text-white"
          >
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name} ({account.institutionName})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <PaymentMethodSelect
          value={form.paymentMethod}
          onChange={form.setPaymentMethod}
          paymentMethods={paymentMethods}
        />

        <RecurringExpenseFields
          isRecurring={form.isRecurring}
          recurringFrequency={form.recurringFrequency}
          onRecurringChange={form.setIsRecurring}
          onFrequencyChange={form.setRecurringFrequency}
        />
      </div>

      <div>
        <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
          Notes
        </label>
        <textarea
          value={form.notes}
          onChange={(e) => form.setNotes(e.target.value)}
          rows={2}
          className="w-full text-xs font-semibold px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 rounded-xl text-slate-900 dark:text-white focus:outline-hidden"
          placeholder="Add notes..."
        />
      </div>

      <button
        type="submit"
        className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white text-xs font-bold rounded-xl tracking-wider uppercase transition-colors shrink-0 cursor-pointer"
      >
        {submitLabel}
      </button>
    </form>
  );
};
