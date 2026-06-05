import React from "react";

export type BadgeTone = "success" | "warning" | "error" | "neutral" | "info" | "brand";

interface BadgeProps {
  children: React.ReactNode;
  tone?: BadgeTone;
  className?: string;
  id?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, tone = "neutral", className = "", id }) => {
  const styles = {
    success: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-800/20",
    warning: "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border-amber-200/50 dark:border-amber-800/20",
    error: "bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400 border-rose-200/50 dark:border-rose-800/30",
    neutral: "bg-slate-50 text-slate-600 dark:bg-slate-950/30 dark:text-slate-400 border-slate-200/50 dark:border-slate-800/20",
    info: "bg-sky-50 text-sky-700 dark:bg-sky-950/30 dark:text-sky-400 border-sky-200/50 dark:border-sky-800/20",
    brand: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400 border-indigo-200/50 dark:border-indigo-800/20",
  };

  return (
    <span
      id={id}
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium border leading-none ${styles[tone]} ${className}`}
    >
      {children}
    </span>
  );
};
