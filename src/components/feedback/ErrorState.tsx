import React from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
  id?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ message, onRetry, id }) => {
  return (
    <div
      id={id}
      className="p-6 border border-rose-100 dark:border-rose-950/30 bg-rose-50/20 dark:bg-rose-950/5 rounded-2xl flex flex-col items-center justify-center text-center"
    >
      <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 text-rose-500 rounded-xl mb-3">
        <AlertTriangle className="w-5 h-5" />
      </div>
      <h3 className="text-xs font-bold text-rose-800 dark:text-rose-400">An Error Occurred</h3>
      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
        {message}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-3 flex items-center gap-1.5 text-[10px] font-bold text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 px-3 py-1.5 rounded-lg transition-all"
        >
          <RotateCcw className="w-3 h-3" /> Retry Operation
        </button>
      )}
    </div>
  );
};
