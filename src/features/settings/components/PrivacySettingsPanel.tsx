import React from "react";
import { Download, ShieldCheck, Trash2 } from "lucide-react";

interface PrivacySettingsPanelProps {
  onExportData: () => void;
  onClearLocalData: () => void;
}

export const PrivacySettingsPanel: React.FC<PrivacySettingsPanelProps> = ({
  onExportData,
  onClearLocalData,
}) => {
  return (
    <section className="space-y-4">
      <div>
        <h4 className="text-sm font-bold text-slate-900 dark:text-white pb-1 border-b border-slate-50 dark:border-slate-800">Privacy</h4>
        <p className="text-xs text-slate-400 mt-0.5">Clear information about local mock data.</p>
      </div>

      <div className="space-y-3">
        <div className="p-4 bg-slate-50 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800 rounded-2xl flex gap-3">
          <ShieldCheck className="w-4 h-4 text-indigo-500 mt-0.5" />
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            This app uses local mock data. Connected account access is simulated, read-only, and never reaches a real bank.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onExportData}
            className="inline-flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
          >
            <Download className="w-3 h-3" /> Export data
          </button>
          <button
            type="button"
            onClick={onClearLocalData}
            className="inline-flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400"
          >
            <Trash2 className="w-3 h-3" /> Clear local data
          </button>
        </div>
      </div>
    </section>
  );
};
