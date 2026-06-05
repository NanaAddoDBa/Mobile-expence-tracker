import { useState, useEffect } from "react";
import { ThemeMode } from "../domain/settings/settings.types";
export type { ThemeMode } from "../domain/settings/settings.types";

export function useThemeMode() {
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("exp_theme");
      if (saved === "light" || saved === "dark" || saved === "system") {
        return saved;
      }
    }
    return "light";
  });

  const [activeTheme, setActiveTheme] = useState<"light" | "dark">("light");

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
    if (typeof window !== "undefined") {
      localStorage.setItem("exp_theme", mode);
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    const root = window.document.documentElement;

    const applyTheme = (theme: "light" | "dark") => {
      if (theme === "dark") {
        root.classList.remove("light");
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
        root.classList.add("light");
      }
      setActiveTheme(theme);
    };

    const initialTheme = themeMode === "system"
      ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
      : themeMode;

    applyTheme(initialTheme);

    if (themeMode === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      
      const handleChange = (e: MediaQueryListEvent) => {
        const nextTheme = e.matches ? "dark" : "light";
        applyTheme(nextTheme);
      };

      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener("change", handleChange);
      } else {
        mediaQuery.addListener(handleChange);
      }

      return () => {
        if (mediaQuery.removeEventListener) {
          mediaQuery.removeEventListener("change", handleChange);
        } else {
          mediaQuery.removeListener(handleChange);
        }
      };
    }
  }, [themeMode]);

  return { themeMode, activeTheme, setThemeMode };
}
