import React from "react";
import { ArrowRight, Info } from "lucide-react";
import {
  DashboardSetupGuidance,
  DashboardSetupGuidanceAction,
} from "../services/dashboardSummaryService";
import { Card } from "../../../components/ui/Card";

interface DashboardSetupGuidancePanelProps {
  guidance: DashboardSetupGuidance[];
  onAction: (action: DashboardSetupGuidanceAction) => void;
}

export const DashboardSetupGuidancePanel: React.FC<DashboardSetupGuidancePanelProps> = ({
  guidance,
  onAction,
}) => {
  if (guidance.length === 0) return null;

  return (
    <Card className="col-span-12 border border-indigo-100 dark:border-indigo-900/40 bg-indigo-50/40 dark:bg-indigo-950/10 p-4">
      <div className="grid gap-3 md:grid-cols-2">
        {guidance.map((item) => (
          <div key={item.id} className="flex items-start justify-between gap-4 rounded-xl bg-white/70 p-3 dark:bg-slate-900/60">
            <div className="flex gap-3">
              <span className="mt-0.5 rounded-lg bg-indigo-100 p-2 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400">
                <Info className="h-4 w-4" />
              </span>
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white">{item.title}</h3>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                  {item.description}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onAction(item.action)}
              className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-[10px] font-bold text-white transition-colors hover:bg-indigo-500"
            >
              {item.actionLabel}
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>
    </Card>
  );
};
