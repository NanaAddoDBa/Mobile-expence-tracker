import React from "react";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  id?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionText,
  onAction,
  id,
}) => {
  return (
    <div
      id={id}
      className="p-8 border border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 rounded-2xl flex flex-col items-center justify-center text-center"
    >
      <div className="p-3 bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-xl mb-4">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{title}</h3>
      <p className="text-xs text-slate-400 dark:text-slate-400 mt-1 max-w-sm leading-relaxed">
        {description}
      </p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="mt-4 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white dark:bg-indigo-600 dark:hover:bg-indigo-700 py-2 px-4 rounded-lg transition-all"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};
