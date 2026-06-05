import React from "react";

interface EmptyStateProps {
  action?: React.ReactNode;
  description: string;
  icon?: React.ReactNode;
  title: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  action,
  description,
  icon,
  title,
}) => {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 px-4 py-12 text-center dark:border-slate-800">
      {icon && <div className="mb-3 text-slate-300 dark:text-slate-700">{icon}</div>}
      <h4 className="text-sm font-bold text-slate-900 dark:text-white">{title}</h4>
      <p className="mt-1 max-w-sm text-xs leading-relaxed text-slate-400 dark:text-slate-500">
        {description}
      </p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
};
