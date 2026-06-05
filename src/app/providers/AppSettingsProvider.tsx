import React, { createContext, useContext, useEffect } from "react";
import { useThemeMode } from "../../hooks/useThemeMode";
import {
  AccessibilitySettings,
  DEFAULT_ACCESSIBILITY_SETTINGS,
  ThemeMode,
} from "../../domain/settings/settings.types";
import { useMockAuth } from "./MockAuthProvider";

export interface AppSettingsContextType {
  themeMode: ThemeMode;
  activeTheme: "light" | "dark";
  accessibilitySettings: AccessibilitySettings;
  setThemeMode: (mode: ThemeMode) => void;
  setAccessibilityPreference: <K extends keyof AccessibilitySettings>(
    key: K,
    value: AccessibilitySettings[K]
  ) => void;
}

const AppSettingsContext = createContext<AppSettingsContextType | undefined>(undefined);

export const AppSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { themeMode, activeTheme, setThemeMode } = useThemeMode();
  const auth = useMockAuth();

  const normalizedSettings = {
    ...auth.currentUser?.settings,
    theme: auth.currentUser?.settings?.theme || themeMode,
    currency: auth.currentUser?.settings?.currency || "EUR",
    language: auth.currentUser?.settings?.language || "en-IE",
    accessibility: {
      ...DEFAULT_ACCESSIBILITY_SETTINGS,
      ...auth.currentUser?.settings?.accessibility,
    },
  };

  const userTheme = normalizedSettings.theme;
  const accessibilitySettings = normalizedSettings.accessibility;

  useEffect(() => {
    if (userTheme && userTheme !== themeMode) {
      setThemeMode(userTheme);
    }
  }, [userTheme, themeMode, setThemeMode]);

  const handleSetThemeMode = (mode: ThemeMode) => {
    setThemeMode(mode);
    if (auth.currentUser) {
      auth.updateProfile({
        settings: {
          ...auth.currentUser.settings,
          theme: mode,
        },
      });
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    const root = window.document.documentElement;
    root.classList.toggle("text-size-large", accessibilitySettings.largerText);
    root.classList.toggle("reduce-motion", accessibilitySettings.reduceMotion);
    root.classList.toggle("contrast-high", accessibilitySettings.highContrast);
    root.classList.toggle("layout-comfortable", accessibilitySettings.comfortableLayout);
  }, [accessibilitySettings]);

  const setAccessibilityPreference = <K extends keyof AccessibilitySettings>(
    key: K,
    value: AccessibilitySettings[K]
  ) => {
    if (!auth.currentUser) return;

    auth.updateProfile({
      settings: {
        ...normalizedSettings,
        accessibility: {
          ...accessibilitySettings,
          [key]: value,
        },
      },
    });
  };

  return (
    <AppSettingsContext.Provider
      value={{
        themeMode,
        activeTheme,
        accessibilitySettings,
        setThemeMode: handleSetThemeMode,
        setAccessibilityPreference,
      }}
    >
      {children}
    </AppSettingsContext.Provider>
  );
};

export const useAppSettings = () => {
  const context = useContext(AppSettingsContext);
  if (context === undefined) {
    throw new Error("useAppSettings must be used within an AppSettingsProvider");
  }
  return context;
};
export type { ThemeMode } from "../../domain/settings/settings.types";
