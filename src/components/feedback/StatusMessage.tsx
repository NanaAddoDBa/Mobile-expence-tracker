import React from "react";
import { CheckCircle2, AlertCircle, Info } from "lucide-react";

interface StatusMessageProps {
  type: "success" | "warning" | "info";
  message: string;
  id?: string;
}

export const StatusMessage: React.FC<StatusMessageProps> = ({ type, message, id }) => {
  const styles = {
    success: "bg-emerald-50 dark:bg-emerald-950/10 border-emerald-100 dark:border-emerald-900/30 text-emerald-800 dark:text-emerald-400",
    warning: "bg-amber-50 dark:bg-amber-950/10 border-amber-100 dark:border-amber-900/30 text-amber-800 dark:text-amber-400",
    info: "bg-indigo-50 dark:bg-indigo-950/10 border-indigo-100 dark:border-indigo-900/30 text-indigo-800 dark:text-indigo-400",
  };

  const icons = {
    success: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
    warning: <AlertCircle className="w-4 h-4 text-amber-500" />,
    info: <Info className="w-4 h-4 text-indigo-500" />,
  };

  return (
    <div
      id={id}
      className={`p-3.5 border rounded-xl flex items-start gap-2.5 text-xs ${styles[type]}`}
    >
      <div className="mt-0.5 shrink-0">{icons[type]}</div>
      <p className="leading-normal">{message}</p>
    </div>
  );
};
