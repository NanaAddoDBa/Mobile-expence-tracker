import React from "react";
import { getPaymentMethodLabel, normalizePaymentMethod } from "../../../domain/expenses/expense.constants";
import { PaymentMethod } from "../../../domain/expenses/expense.types";

interface PaymentMethodSelectProps {
  value: PaymentMethod;
  onChange: (value: PaymentMethod) => void;
  paymentMethods: readonly PaymentMethod[];
}

export const PaymentMethodSelect: React.FC<PaymentMethodSelectProps> = ({
  value,
  onChange,
  paymentMethods,
}) => {
  return (
    <div>
      <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
        Payment Type
      </label>
      <select
        value={value}
        onChange={(e) => onChange(normalizePaymentMethod(e.target.value))}
        className="w-full text-xs font-semibold px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 rounded-xl text-slate-900 dark:text-white"
      >
        {paymentMethods.map((paymentMethod) => (
          <option key={paymentMethod} value={paymentMethod}>
            {getPaymentMethodLabel(paymentMethod)}
          </option>
        ))}
      </select>
    </div>
  );
};
