import React, { createContext, useContext, useState } from "react";

export type ActiveView =
  | "dashboard"
  | "expenses"
  | "income"
  | "budgets"
  | "goals"
  | "receipts"
  | "profile";
export type ProfileTabIntent =
  | "accounts"
  | "profile"
  | "appearance"
  | "notifications"
  | "accessibility"
  | "privacy"
  | "security"
  | "demo";

export interface AppNavigationContextType {
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  profileTabIntent: ProfileTabIntent | null;
  setProfileTabIntent: (tab: ProfileTabIntent | null) => void;
  openProfileTab: (tab: ProfileTabIntent) => void;
  expenseQuery: string;
  setExpenseQuery: (q: string) => void;
}

const AppNavigationContext = createContext<AppNavigationContextType | undefined>(undefined);

export const AppNavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeView, setActiveView] = useState<ActiveView>("dashboard");
  const [profileTabIntent, setProfileTabIntent] = useState<ProfileTabIntent | null>(null);
  const [expenseQuery, setExpenseQuery] = useState("");

  const openProfileTab = (tab: ProfileTabIntent) => {
    setProfileTabIntent(tab);
    setActiveView("profile");
  };

  return (
    <AppNavigationContext.Provider
      value={{
        activeView,
        setActiveView,
        profileTabIntent,
        setProfileTabIntent,
        openProfileTab,
        expenseQuery,
        setExpenseQuery,
      }}
    >
      {children}
    </AppNavigationContext.Provider>
  );
};

export const useAppNavigation = () => {
  const context = useContext(AppNavigationContext);
  if (context === undefined) {
    throw new Error("useAppNavigation must be used within an AppNavigationProvider");
  }
  return context;
};
