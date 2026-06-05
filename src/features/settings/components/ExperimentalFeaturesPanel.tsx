import React from "react";
import { Database, Zap } from "lucide-react";

export interface DemoDataStatus {
  expenses: number;
  budgets: number;
  goals: number;
  connectedAccounts: number;
  notifications: number;
  receipts: number;
}

interface ExperimentalFeaturesPanelProps {
  dataStatus: DemoDataStatus;
  onClearAllLocalData: () => void;
  onClearDemoData: () => void;
  onImportMockExpenses: () => void;
  onLoadSampleData: () => void;
  onResetDemoData: () => void;
}

export const ExperimentalFeaturesPanel: React.FC<ExperimentalFeaturesPanelProps> = ({
  dataStatus,
  onClearAllLocalData,
  onClearDemoData,
  onImportMockExpenses,
  onLoadSampleData,
  onResetDemoData,
}) => {
  const dataStatusItems: Array<[string, number]> = [
    ["Expenses", dataStatus.expenses],
    ["Budgets", dataStatus.budgets],
    ["Goals", dataStatus.goals],
    ["Connected accounts", dataStatus.connectedAccounts],
    ["Notifications", dataStatus.notifications],
    ["Receipts", dataStatus.receipts],
  ];

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-bold text-slate-900 dark:text-white pb-1 border-b border-slate-50 dark:border-slate-800">Demo Tools</h4>
        <p className="text-xs text-slate-400 mt-0.5">Load local sample data or import expenses from connected mock accounts.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {dataStatusItems.map(([label, value]) => (
          <div
            key={label}
            className="rounded-2xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-800/30"
          >
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
            <p className="mt-1 text-lg font-extrabold text-slate-900 dark:text-white">{value}</p>
          </div>
        ))}
      </div>

      <div className="p-4 bg-slate-50 dark:bg-slate-800 border border-slate-100 rounded-2xl space-y-4">
        <div>
          <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Sample data</h5>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-normal">
            Load starter sample data, reset it, clear financial app data, or import from connected accounts.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={onLoadSampleData}
            className="flex items-center gap-1.5 py-2 px-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors shrink-0 cursor-pointer dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100"
          >
            <Database className="w-3.5 h-3.5" /> Load Sample Data
          </button>
          <button
            onClick={onResetDemoData}
            className="flex items-center gap-1.5 py-2 px-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors shrink-0 cursor-pointer dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600"
          >
            <Zap className="w-3.5 h-3.5" /> Reset Demo Data
          </button>
          <button
            onClick={onClearDemoData}
            className="flex items-center gap-1.5 py-2 px-3.5 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold rounded-xl text-xs transition-colors shrink-0 cursor-pointer dark:bg-rose-950/20 dark:text-rose-400"
          >
            Clear Financial App Data
          </button>
          <button
            onClick={onClearAllLocalData}
            className="flex items-center gap-1.5 py-2 px-3.5 bg-white hover:bg-slate-100 text-slate-600 font-bold rounded-xl text-xs transition-colors shrink-0 cursor-pointer dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            Clear All Local Data and Restart Onboarding
          </button>
          <button
            onClick={onImportMockExpenses}
            className="flex items-center gap-1.5 py-2 px-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition-colors shrink-0 cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5" /> Import Expenses
          </button>
        </div>
      </div>

      <p className="rounded-xl bg-slate-50 p-3 text-[10px] leading-relaxed text-slate-500 dark:bg-slate-800/30 dark:text-slate-400">
        Clear Financial App Data removes local expenses, budgets, goals, connected accounts, and notifications while keeping mock sign-in and onboarding. Clear All Local Data and Restart Onboarding also resets sign-in and onboarding.
      </p>
    </div>
  );
};
