import React from "react";
import { NotificationSettings } from "../../../domain/profile/profile.types";

interface NotificationSettingsPanelProps {
  settings: NotificationSettings;
  onChange: (updates: Partial<NotificationSettings>) => void;
}

const thresholdOptions = [70, 80, 90, 100];

export const NotificationSettingsPanel: React.FC<NotificationSettingsPanelProps> = ({
  settings,
  onChange,
}) => {
  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-bold text-slate-900 dark:text-white pb-1 border-b border-slate-50 dark:border-slate-800">Alerts</h4>
        <p className="text-xs text-slate-400 mt-1">Choose when local app alerts appear.</p>
      </div>

      <div className="space-y-4">
        <label className="flex items-center justify-between gap-4 p-4 bg-slate-50 dark:bg-slate-800/10 border border-slate-100 dark:border-slate-800/50 rounded-2xl">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Budget alerts</span>
            <p className="text-[10px] text-slate-400">Show local alerts when spending gets close to a budget limit.</p>
          </div>
          <input
            type="checkbox"
            aria-label="Budget alerts"
            checked={settings.enableAlerts}
            onChange={(event) => onChange({ enableAlerts: event.target.checked })}
            className="h-4 w-4"
          />
        </label>

        <label className="flex items-center justify-between gap-4 p-4 bg-slate-50 dark:bg-slate-800/10 border border-slate-100 dark:border-slate-800/50 rounded-2xl">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Alert me when a budget reaches</span>
            <p className="text-[10px] text-slate-400">Show alerts when budget use reaches this level.</p>
          </div>
          <select
            aria-label="Alert me when a budget reaches"
            value={settings.budgetThreshold}
            disabled={!settings.enableAlerts}
            onChange={(event) => onChange({ budgetThreshold: Number(event.target.value) })}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          >
            {thresholdOptions.map((threshold) => (
              <option key={threshold} value={threshold}>
                {threshold}% used
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center justify-between gap-4 p-4 bg-slate-50 dark:bg-slate-800/10 border border-slate-100 dark:border-slate-800/50 rounded-2xl">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Recurring expense reminders</span>
            <p className="text-[10px] text-slate-400">Saved locally. Reminder delivery is not implemented in this frontend version.</p>
          </div>
          <input
            type="checkbox"
            aria-label="Recurring expense reminders"
            checked={settings.recurringReminders}
            onChange={(event) => onChange({ recurringReminders: event.target.checked })}
            className="h-4 w-4"
          />
        </label>

        <label className="flex items-center justify-between gap-4 p-4 bg-slate-50 dark:bg-slate-800/10 border border-slate-100 dark:border-slate-800/50 rounded-2xl">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Weekly spending summary</span>
            <p className="text-[10px] text-slate-400">Saved locally. Weekly summary delivery is not implemented in this frontend version.</p>
          </div>
          <input
            type="checkbox"
            aria-label="Weekly spending summary"
            checked={settings.weeklySummaries}
            onChange={(event) => onChange({ weeklySummaries: event.target.checked })}
            className="h-4 w-4"
          />
        </label>
      </div>
    </div>
  );
};
