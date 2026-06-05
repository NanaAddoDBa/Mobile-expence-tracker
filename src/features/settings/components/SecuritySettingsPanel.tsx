import React from "react";
import { KeyRound, MonitorCheck, ShieldCheck } from "lucide-react";
import { Badge } from "../../../components/ui/Badge";

export const SecuritySettingsPanel: React.FC = () => {
  return (
    <section className="space-y-4">
      <div>
        <h4 className="text-sm font-bold text-slate-900 dark:text-white pb-1 border-b border-slate-50 dark:border-slate-800">Security</h4>
        <p className="text-xs text-slate-400 mt-0.5">Mock security settings for this local demo app.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="p-4 bg-slate-50 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800 rounded-2xl">
          <KeyRound className="w-4 h-4 text-indigo-500 mb-2" />
          <div className="flex items-center justify-between gap-2">
            <h5 className="text-xs font-bold text-slate-900 dark:text-white">Password</h5>
            <Badge tone="warning">Coming later</Badge>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Security controls are mock-only in this frontend version. No real account credentials are stored.</p>
        </div>
        <div className="p-4 bg-slate-50 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800 rounded-2xl">
          <ShieldCheck className="w-4 h-4 text-emerald-500 mb-2" />
          <div className="flex items-center justify-between gap-2">
            <h5 className="text-xs font-bold text-slate-900 dark:text-white">Two-factor authentication</h5>
            <Badge tone="warning">Coming later</Badge>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Two-factor authentication is not available in this mock frontend.</p>
        </div>
        <div className="p-4 bg-slate-50 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800 rounded-2xl">
          <MonitorCheck className="w-4 h-4 text-sky-500 mb-2" />
          <h5 className="text-xs font-bold text-slate-900 dark:text-white">Active sessions</h5>
          <p className="text-[11px] text-slate-400 mt-1">This browser session is the only local demo session.</p>
        </div>
        <div className="p-4 bg-slate-50 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800 rounded-2xl">
          <ShieldCheck className="w-4 h-4 text-amber-500 mb-2" />
          <h5 className="text-xs font-bold text-slate-900 dark:text-white">Data storage notice</h5>
          <p className="text-[11px] text-slate-400 mt-1">Expenses, budgets, goals, and settings are stored locally in this browser.</p>
        </div>
      </div>
    </section>
  );
};
