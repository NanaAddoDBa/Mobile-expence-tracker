import React from "react";
import { PlusCircle } from "lucide-react";
import { ConnectedAccount } from "../../domain/accounts/account.types";
import { getPaymentMethodLabel, normalizePaymentMethod } from "../../domain/expenses/expense.constants";
import { PaymentMethod } from "../../domain/expenses/expense.types";
import { ReceiptOcrResult } from "../../domain/receipts/receipt.types";
import { formatCurrency } from "../../lib/formatCurrency";
import { ReceiptReviewFormValues } from "../../features/receipts/types/receiptForm.types";

interface OcrClassificationFormProps {
  ocrResult: ReceiptOcrResult;
  accounts: ConnectedAccount[];
  categoryOptions: string[];
  paymentMethods: readonly PaymentMethod[];
  formCategory: ReceiptReviewFormValues["category"];
  setFormCategory: (c: ReceiptReviewFormValues["category"]) => void;
  formAccount: ReceiptReviewFormValues["accountSource"];
  setFormAccount: (a: ReceiptReviewFormValues["accountSource"]) => void;
  formPaymentMethod: ReceiptReviewFormValues["paymentMethod"];
  setFormPaymentMethod: (p: ReceiptReviewFormValues["paymentMethod"]) => void;
  formNotes: ReceiptReviewFormValues["notes"];
  setFormNotes: (n: ReceiptReviewFormValues["notes"]) => void;
  onSubmit: () => void;
}

export const OcrClassificationForm: React.FC<OcrClassificationFormProps> = ({
  ocrResult,
  accounts,
  categoryOptions,
  paymentMethods,
  formCategory,
  setFormCategory,
  formAccount,
  setFormAccount,
  formPaymentMethod,
  setFormPaymentMethod,
  formNotes,
  setFormNotes,
  onSubmit,
}) => {
  const categoryId = React.useId();
  const accountId = React.useId();
  const paymentMethodId = React.useId();
  const notesId = React.useId();

  return (
    <div className="space-y-4">
      <div>
        <span className="text-[10px] text-slate-400 font-bold uppercase block leading-none">Review Details</span>
        <div className="grid grid-cols-2 gap-4 mt-3">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/20 border border-slate-100 rounded-xl">
            <span className="text-[9px] text-slate-400 font-bold uppercase leading-none">Merchant</span>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block mt-1.5 truncate">
              {ocrResult.merchant}
            </span>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-800/20 border border-slate-100 rounded-xl">
            <span className="text-[9px] text-slate-400 font-bold uppercase leading-none">Total</span>
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 block mt-1.5 font-mono">
              {formatCurrency(ocrResult.amount)}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor={categoryId} className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Category
          </label>
          <select
            id={categoryId}
            value={formCategory}
            onChange={(e) => setFormCategory(e.target.value)}
            className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 rounded-xl text-slate-900 dark:text-slate-100"
          >
            {categoryOptions.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor={accountId} className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Connected Account
          </label>
          <select
            id={accountId}
            value={formAccount}
            onChange={(e) => setFormAccount(e.target.value)}
            className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 rounded-xl text-slate-900 dark:text-slate-100"
          >
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.name} ({acc.institutionName})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor={paymentMethodId} className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
          Payment Type
        </label>
        <select
          id={paymentMethodId}
          value={formPaymentMethod}
          onChange={(e) => setFormPaymentMethod(normalizePaymentMethod(e.target.value))}
          className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 rounded-xl text-slate-900 dark:text-slate-100"
        >
          {paymentMethods.map((m) => (
            <option key={m} value={m}>
              {getPaymentMethodLabel(m)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor={notesId} className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
          Notes
        </label>
        <input
          id={notesId}
          type="text"
          value={formNotes}
          onChange={(e) => setFormNotes(e.target.value)}
          placeholder="Add notes or item details..."
          className="w-full text-xs font-semibold px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 rounded-xl text-slate-950 dark:text-white"
        />
      </div>

      <button
        onClick={onSubmit}
        className="w-full flex items-center justify-center gap-2.5 py-3 font-bold bg-indigo-700 hover:bg-indigo-600 text-white rounded-xl text-xs transition-colors shadow-xs cursor-pointer"
      >
        <PlusCircle className="w-4.5 h-4.5" /> Add Expense
      </button>
    </div>
  );
};
