import React, { useState, useEffect } from "react";
import { Modal } from "../ui/Modal";
import { BudgetFormSubmitPayload } from "../../features/budgets/types/budgetForm.types";
import { InlineMessage } from "../feedback/InlineMessage";

interface BudgetFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: BudgetFormSubmitPayload) => void;
  unbudgetedCategories?: string[];
  initialCategory?: string;
  initialLimitAmount?: number;
  isEdit: boolean;
  title: string;
}

export const BudgetFormModal: React.FC<BudgetFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  unbudgetedCategories = [],
  initialCategory = "",
  initialLimitAmount,
  isEdit,
  title,
}) => {
  const [category, setCategory] = useState("");
  const [limitAmount, setLimitAmount] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (isOpen) {
      if (isEdit) {
        setCategory(initialCategory);
        setLimitAmount(initialLimitAmount ? String(initialLimitAmount) : "");
      } else {
        setCategory(unbudgetedCategories[0] || "Others");
        setLimitAmount("");
      }
      setErrorMessage("");
    }
  }, [isOpen, isEdit, initialCategory, initialLimitAmount, unbudgetedCategories]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(limitAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorMessage("Please specify a valid limit amount greater than 0");
      return;
    }
    setErrorMessage("");
    onSubmit({
      category,
      limitAmount: parsedAmount,
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && <InlineMessage tone="error" message={errorMessage} />}

        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Category
          </label>
          {isEdit ? (
            <input
              type="text"
              readOnly
              value={category}
              className="w-full text-xs font-semibold px-3 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed"
            />
          ) : (
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full text-xs font-semibold px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 rounded-xl text-slate-950 dark:text-white"
            >
              {unbudgetedCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          )}
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Limit Amount (€)
          </label>
          <input
            type="number"
            step="0.01"
            required
            value={limitAmount}
            onChange={(e) => setLimitAmount(e.target.value)}
            className="w-full text-xs font-semibold px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 rounded-xl text-slate-900 dark:text-white font-mono"
            placeholder="0.00"
          />
        </div>

        <button
          type="submit"
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl tracking-wider uppercase transition-colors shrink-0 cursor-pointer"
        >
          {isEdit ? "Update Budget" : "Create Budget"}
        </button>
      </form>
    </Modal>
  );
};
