import React from "react";
import { AppProviders } from "./app/providers/AppProviders";
import { useFeedback } from "./app/providers/FeedbackProvider";
import { useAppNavigation } from "./app/providers/AppNavigationProvider";
import { useMockAuth } from "./app/providers/MockAuthProvider";
import { ErrorBoundary } from "./components/feedback/ErrorBoundary";
import { AuthScreen } from "./features/auth/AuthScreen";
import {
  type OnboardingFirstAction,
  OnboardingScreen,
} from "./features/onboarding/OnboardingScreen";
import { DashboardLayout } from "./components/layout/DashboardLayout";
import { useDemoDataActions } from "./features/demo/hooks/useDemoDataActions";

// Sub views mapping
import { DashboardView } from "./features/dashboard/DashboardView";
import { ExpenseLedgerView } from "./features/expenses/ExpenseLedgerView";
import { IncomeLedgerView } from "./features/incomes/IncomeLedgerView";
import { BudgetManagerView } from "./features/budgets/BudgetManagerView";
import { SavingsGoalsView } from "./features/goals/SavingsGoalsView";
import { ReceiptScannerView } from "./features/receipts/ReceiptScannerView";
import { ProfileSettingsView } from "./features/profile/ProfileSettingsView";

function AppContent() {
  const {
    isAuthenticated,
    isOnboarded,
    currentUser,
    completeOnboarding,
    login,
    signup,
  } = useMockAuth();
  const { activeView, setActiveView } = useAppNavigation();
  const { showSuccess } = useFeedback();
  const { loadSampleData } = useDemoDataActions();

  const completeOnboardingWithAction = (action: OnboardingFirstAction) => {
    const firstActionView = {
      "add-expense": "expenses",
      "connect-account": "profile",
      "scan-receipt": "receipts",
      "create-budget": "budgets",
      "load-sample-data": "dashboard",
      skip: "dashboard",
    } as const;

    if (action === "load-sample-data") {
      void loadSampleData();
      showSuccess("Starter sample data loaded.");
    }

    setActiveView(firstActionView[action]);
    completeOnboarding();
  };

  // If user is not authenticated, load interactive credential access
  if (!isAuthenticated) {
    return <AuthScreen onLogin={login} onSignup={signup} />;
  }

  // If authenticated but sandbox onboarding disclosures have not been approved, display Onboarding
  if (!isOnboarded) {
    return (
      <OnboardingScreen
        onComplete={completeOnboardingWithAction}
        userName={currentUser?.name || "Demo User"}
      />
    );
  }

  return (
    <DashboardLayout>
      {activeView === "dashboard" && <DashboardView />}
      {activeView === "expenses" && <ExpenseLedgerView />}
      {activeView === "income" && <IncomeLedgerView />}
      {activeView === "budgets" && <BudgetManagerView />}
      {activeView === "goals" && <SavingsGoalsView />}
      {activeView === "receipts" && <ReceiptScannerView />}
      {activeView === "profile" && <ProfileSettingsView />}
    </DashboardLayout>
  );
}

export default function App() {
  return (
    <AppProviders>
      <ErrorBoundary>
        <AppContent />
      </ErrorBoundary>
    </AppProviders>
  );
}
