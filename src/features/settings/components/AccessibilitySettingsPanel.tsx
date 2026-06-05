import React from "react";
import { AccessibilitySettings } from "../../../domain/settings/settings.types";

interface AccessibilitySettingsPanelProps {
  settings: AccessibilitySettings;
  onChange: <K extends keyof AccessibilitySettings>(
    key: K,
    value: AccessibilitySettings[K]
  ) => void;
}

const options: {
  key: keyof AccessibilitySettings;
  label: string;
  description: string;
}[] = [
  {
    key: "largerText",
    label: "Larger text",
    description: "Increase the app base text size.",
  },
  {
    key: "reduceMotion",
    label: "Reduce motion",
    description: "Minimize local animations and transitions.",
  },
  {
    key: "highContrast",
    label: "High contrast",
    description: "Apply a stronger root contrast mode.",
  },
  {
    key: "comfortableLayout",
    label: "Comfortable layout",
    description: "Use a slightly roomier reading rhythm.",
  },
];

export const AccessibilitySettingsPanel: React.FC<AccessibilitySettingsPanelProps> = ({
  settings,
  onChange,
}) => {
  return (
    <section className="space-y-4">
      <div>
        <h4 className="text-sm font-bold text-slate-900 dark:text-white pb-1 border-b border-slate-50 dark:border-slate-800">Accessibility</h4>
        <p className="text-xs text-slate-400 mt-0.5">Local display preferences for easier scanning.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {options.map((option) => (
          <label key={option.key} className="flex items-center justify-between gap-3 p-3 bg-slate-50 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800 rounded-xl">
            <span>
              <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300">{option.label}</span>
              <span className="mt-1 block text-[10px] text-slate-400">{option.description}</span>
            </span>
            <input
              type="checkbox"
              aria-label={option.label}
              checked={settings[option.key]}
              onChange={(event) => onChange(option.key, event.target.checked)}
              className="h-4 w-4"
            />
          </label>
        ))}
      </div>
    </section>
  );
};
