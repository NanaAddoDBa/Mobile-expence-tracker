import React from "react";

interface FormFieldProps {
  children: React.ReactNode;
  error?: string;
  helperText?: string;
  label: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  children,
  error,
  helperText,
  label,
}) => {
  return (
    <label className="block space-y-1">
      <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400">
        {label}
      </span>
      {children}
      {error ? (
        <span className="block text-[11px] font-semibold text-rose-600 dark:text-rose-400">
          {error}
        </span>
      ) : helperText ? (
        <span className="block text-[11px] text-slate-400 dark:text-slate-500">
          {helperText}
        </span>
      ) : null}
    </label>
  );
};
