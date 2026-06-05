export type ThemeMode = "light" | "dark" | "system";

export interface AccessibilitySettings {
  largerText: boolean;
  reduceMotion: boolean;
  highContrast: boolean;
  comfortableLayout: boolean;
}

export interface AppSettings {
  theme: ThemeMode;
  currency: string;
  language: string;
  accessibility: AccessibilitySettings;
}

export const DEFAULT_ACCESSIBILITY_SETTINGS: AccessibilitySettings = {
  largerText: false,
  reduceMotion: false,
  highContrast: false,
  comfortableLayout: false,
};
