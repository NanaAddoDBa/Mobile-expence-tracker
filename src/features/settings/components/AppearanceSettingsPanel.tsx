import React from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { ThemeMode } from "../../../domain/settings/settings.types";

interface AppearanceSettingsPanelProps {
  themeMode: ThemeMode;
  onThemeModeChange: (mode: ThemeMode) => void;
}

export const AppearanceSettingsPanel: React.FC<AppearanceSettingsPanelProps> = ({
  themeMode,
  onThemeModeChange,
}) => {
  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-bold text-slate-900 dark:text-white pb-1 border-b border-slate-50 dark:border-slate-800">Theme settings</h4>
        <p className="text-xs text-slate-400 mt-0.5">Choose how the app looks.</p>
        <p className="text-[11px] text-slate-400 mt-1">System follows your browser or device theme.</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <button
          onClick={() => onThemeModeChange("light")}
          className={`p-4 border rounded-2xl flex flex-col items-center justify-center gap-2.5 transition-all cursor-pointer ${
            themeMode === "light"
              ? "border-indigo-600 bg-indigo-50/15 dark:border-indigo-500 dark:bg-indigo-950/10 text-indigo-600 dark:text-indigo-400 font-bold"
              : "border-slate-100 dark:border-slate-800 text-slate-500 hover:bg-slate-50"
          }`}
        >
          <Sun className="w-5 h-5" />
          <span className="text-[10px] uppercase tracking-wider font-semibold">Light Mode</span>
        </button>

        <button
          onClick={() => onThemeModeChange("dark")}
          className={`p-4 border rounded-2xl flex flex-col items-center justify-center gap-2.5 transition-all cursor-pointer ${
            themeMode === "dark"
              ? "border-indigo-600 bg-indigo-50/15 dark:border-indigo-500 dark:bg-indigo-950/10 text-indigo-600 dark:text-indigo-400 font-bold"
              : "border-slate-100 dark:border-slate-800 text-slate-500 hover:bg-slate-50"
          }`}
        >
          <Moon className="w-5 h-5" />
          <span className="text-[10px] uppercase tracking-wider font-semibold">Dark Mode</span>
        </button>

        <button
          onClick={() => onThemeModeChange("system")}
          className={`p-4 border rounded-2xl flex flex-col items-center justify-center gap-2.5 transition-all cursor-pointer ${
            themeMode === "system"
              ? "border-indigo-600 bg-indigo-50/15 dark:border-indigo-500 dark:bg-indigo-950/10 text-indigo-600 dark:text-indigo-400 font-bold"
              : "border-slate-100 dark:border-slate-800 text-slate-500 hover:bg-slate-50"
          }`}
        >
          <Monitor className="w-5 h-5" />
          <span className="text-[10px] uppercase tracking-wider font-semibold">System Default</span>
        </button>
      </div>
    </div>
  );
};
