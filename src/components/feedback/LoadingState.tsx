import React from "react";
import { Loader2 } from "lucide-react";

interface LoadingStateProps {
  label?: string;
  id?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ label = "Loading data details...", id }) => {
  return (
    <div
      id={id}
      className="p-10 flex flex-col items-center justify-center text-center w-full"
    >
      <Loader2 className="w-6 h-6 animate-spin text-indigo-500 dark:text-indigo-400 mb-2" />
      <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 tracking-wide">
        {label}
      </span>
    </div>
  );
};
