import React from "react";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";

export type InlineMessageTone = "success" | "error" | "warning" | "info";

interface InlineMessageProps {
  tone: InlineMessageTone;
  message: string;
}

export const InlineMessage: React.FC<InlineMessageProps> = ({ tone, message }) => {
  const styles: Record<InlineMessageTone, string> = {
    success: "bg-emerald-50 dark:bg-emerald-950/10 border-emerald-100 dark:border-emerald-900/30 text-emerald-800 dark:text-emerald-400",
    error: "bg-rose-50 dark:bg-rose-950/10 border-rose-100 dark:border-rose-900/30 text-rose-800 dark:text-rose-400",
    warning: "bg-amber-50 dark:bg-amber-950/10 border-amber-100 dark:border-amber-900/30 text-amber-800 dark:text-amber-400",
    info: "bg-indigo-50 dark:bg-indigo-950/10 border-indigo-100 dark:border-indigo-900/30 text-indigo-800 dark:text-indigo-400",
  };

  const icons: Record<InlineMessageTone, React.ReactNode> = {
    success: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
    error: <AlertCircle className="w-4 h-4 text-rose-500" />,
    warning: <AlertCircle className="w-4 h-4 text-amber-500" />,
    info: <Info className="w-4 h-4 text-indigo-500" />,
  };

  return (
    <div role="status" className={`p-3 border rounded-xl flex items-start gap-2.5 text-xs ${styles[tone]}`}>
      <span className="mt-0.5 shrink-0">{icons[tone]}</span>
      <p className="leading-normal">{message}</p>
    </div>
  );
};
