import React from "react";

interface ExpenseCategorySelectProps {
  value: string;
  onChange: (value: string) => void;
  categoryOptions: readonly string[];
}

export const ExpenseCategorySelect: React.FC<ExpenseCategorySelectProps> = ({
  value,
  onChange,
  categoryOptions,
}) => {
  return (
    <div>
      <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
        Category
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full text-xs font-semibold px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 rounded-xl text-slate-950 dark:text-white"
      >
        {categoryOptions.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
};
