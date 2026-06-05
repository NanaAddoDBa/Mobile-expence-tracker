import React, { useState, useEffect } from "react";
import { Modal } from "../ui/Modal";
import {
  GoalFormInitialData,
  GoalFormSubmitPayload,
} from "../../features/goals/types/goalForm.types";
import { InlineMessage } from "../feedback/InlineMessage";

interface GoalFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: GoalFormSubmitPayload) => void;
  initialData?: GoalFormInitialData;
  title: string;
}

export const GoalFormModal: React.FC<GoalFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  title,
}) => {
  const defaultDateStr = `${new Date().getFullYear()}-12-31`;
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [currentAmount, setCurrentAmount] = useState("");
  const [targetDate, setTargetDate] = useState(defaultDateStr);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setName(initialData.name || "");
        setTargetAmount(String(initialData.targetAmount || ""));
        setCurrentAmount(String(initialData.currentAmount || "0"));
        setTargetDate(initialData.targetDate || defaultDateStr);
      } else {
        setName("");
        setTargetAmount("");
        setCurrentAmount("0");
        setTargetDate(defaultDateStr);
      }
      setErrorMessage("");
    }
  }, [isOpen, initialData, defaultDateStr]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedTarget = parseFloat(targetAmount);
    const parsedCurrent = parseFloat(currentAmount);

    if (isNaN(parsedTarget) || parsedTarget <= 0) {
      setErrorMessage("Please specify a valid target amount greater than 0");
      return;
    }
    if (isNaN(parsedCurrent) || parsedCurrent < 0) {
      setErrorMessage("Please specify a valid initial amount");
      return;
    }

    setErrorMessage("");
    onSubmit({
      name: name.trim() || "Generic Savings Goal",
      targetAmount: parsedTarget,
      currentAmount: parsedCurrent,
      targetDate,
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && <InlineMessage tone="error" message={errorMessage} />}

        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Goal Name
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full text-xs font-semibold px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 rounded-xl text-slate-950 dark:text-white"
            placeholder="E.g., Emergency Reserve Fund, Car Repair..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Target Amount (€)
            </label>
            <input
              type="number"
              step="10"
              required
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              className="w-full text-xs font-semibold px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 rounded-xl text-slate-950 dark:text-white font-mono"
              placeholder="5000"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Target Date
            </label>
            <input
              type="date"
              required
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full text-xs font-semibold px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 rounded-xl text-slate-950 dark:text-white"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Current Savings (€)
          </label>
          <input
            type="number"
            step="10"
            value={currentAmount}
            onChange={(e) => setCurrentAmount(e.target.value)}
            className="w-full text-xs font-semibold px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 rounded-xl text-slate-950 dark:text-white font-mono"
            placeholder="0"
          />
        </div>

        <button
          type="submit"
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl tracking-wider uppercase transition-colors shrink-0 cursor-pointer"
        >
          {initialData ? "Save Changes" : "Create Savings Goal"}
        </button>
      </form>
    </Modal>
  );
};
