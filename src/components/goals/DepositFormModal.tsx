import React, { useState, useEffect } from "react";
import { Modal } from "../ui/Modal";
import { GoalSavingsSubmitPayload } from "../../features/goals/types/goalForm.types";
import { InlineMessage } from "../feedback/InlineMessage";

interface DepositFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (amount: GoalSavingsSubmitPayload) => void;
  title: string;
}

export const DepositFormModal: React.FC<DepositFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  title,
}) => {
  const [amount, setAmount] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (isOpen) {
      setAmount("");
      setErrorMessage("");
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorMessage("Please specify a valid contribution amount greater than 0");
      return;
    }
    setErrorMessage("");
    onSubmit(parsedAmount);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && <InlineMessage tone="error" message={errorMessage} />}

        <div className="p-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl text-xs text-slate-400">
          Add Savings records money you say you have set aside. The app does not move money.
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Savings Amount (EUR)
          </label>
          <input
            type="number"
            step="10"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full text-xs font-semibold px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 rounded-xl text-slate-950 dark:text-white"
            placeholder="E.g., 200"
            autoFocus
          />
        </div>

        <button
          type="submit"
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl tracking-wider uppercase transition-colors shrink-0 cursor-pointer"
        >
          Add Savings
        </button>
      </form>
    </Modal>
  );
};
