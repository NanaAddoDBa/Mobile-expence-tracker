import React from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import { InlineMessageTone } from "./InlineMessage";

export interface ToastMessageModel {
  id: string;
  tone: InlineMessageTone;
  message: string;
}

interface ToastMessageProps {
  toast: ToastMessageModel;
  onDismiss: (id: string) => void;
}

export const ToastMessage: React.FC<ToastMessageProps> = ({ toast, onDismiss }) => {
  const styles: Record<InlineMessageTone, string> = {
    success: "border-emerald-100 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-300",
    error: "border-rose-100 dark:border-rose-900/40 text-rose-800 dark:text-rose-300",
    warning: "border-amber-100 dark:border-amber-900/40 text-amber-800 dark:text-amber-300",
    info: "border-indigo-100 dark:border-indigo-900/40 text-indigo-800 dark:text-indigo-300",
  };

  const icons: Record<InlineMessageTone, React.ReactNode> = {
    success: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
    error: <AlertCircle className="w-4 h-4 text-rose-500" />,
    warning: <AlertCircle className="w-4 h-4 text-amber-500" />,
    info: <Info className="w-4 h-4 text-indigo-500" />,
  };

  return (
    <div
      role="status"
      className={`w-full rounded-2xl border bg-white dark:bg-slate-900 shadow-lg p-3.5 flex items-start gap-2.5 text-xs ${styles[toast.tone]}`}
    >
      <span className="mt-0.5 shrink-0">{icons[toast.tone]}</span>
      <p className="flex-1 leading-normal font-semibold">{toast.message}</p>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
        aria-label="Dismiss message"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
