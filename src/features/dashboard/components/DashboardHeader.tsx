import React from "react";
import { DashboardSearch } from "./DashboardSearch";

interface DashboardHeaderProps {
  currentMonthLabelFull: string;
  onSearch: (query: string) => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  currentMonthLabelFull,
  onSearch,
}) => {
  return (
    <div className="col-span-12 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-6 shadow-xs">
      <div>
        <h2 className="text-xl font-bold text-slate-950 dark:text-white tracking-tight">
          Expense Overview
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Your spending for <span className="font-semibold text-slate-700 dark:text-slate-300">{currentMonthLabelFull}</span>
        </p>
      </div>

      <DashboardSearch onSearch={onSearch} />
    </div>
  );
};
