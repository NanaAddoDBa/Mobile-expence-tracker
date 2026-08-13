/** @vitest-environment jsdom */

import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test, vi } from "vitest";
import { ConnectedAccount } from "../domain/accounts/account.types";
import { UserProfile } from "../domain/profile/profile.types";
import { FeedbackContextType } from "../app/providers/FeedbackProvider";
import { AppearanceSettingsPanel } from "../features/settings/components/AppearanceSettingsPanel";
import { NotificationSettingsPanel } from "../features/settings/components/NotificationSettingsPanel";
import { ConnectedAccountsPanel } from "../features/profile/components/ConnectedAccountsPanel";
import { ProfileSettingsView } from "../features/profile/ProfileSettingsView";
import { ExperimentalFeaturesPanel } from "../features/settings/components/ExperimentalFeaturesPanel";

const mocks = vi.hoisted(() => ({
  logout: vi.fn(),
  setThemeMode: vi.fn(),
  connectMockAccounts: vi.fn(),
  listBankInstitutions: vi.fn(),
  startRealBankConnection: vi.fn(),
  reconnectAccount: vi.fn(),
  removeMockAccount: vi.fn(),
  triggerMockImport: vi.fn(),
  updateProfile: vi.fn(),
  showInfo: vi.fn(),
  showSuccess: vi.fn(),
  confirmAction: vi.fn(),
  clearSampleData: vi.fn(),
  loadSampleData: vi.fn(),
  resetSampleData: vi.fn(),
  clearAllLocalData: vi.fn(),
  setProfileTabIntent: vi.fn(),
}));

const demoDataStatus = {
  expenses: 1,
  budgets: 1,
  goals: 1,
  connectedAccounts: 1,
  notifications: 1,
  receipts: 0,
};

const mockProfile: UserProfile = {
  id: "user-1",
  name: "Demo User",
  email: "demo@example.com",
  settings: {
    theme: "light",
    currency: "EUR",
    language: "en-IE",
    accessibility: {
      largerText: false,
      reduceMotion: false,
      highContrast: false,
      comfortableLayout: false,
    },
  },
  notifications: {
    enableAlerts: true,
    budgetThreshold: 80,
    recurringReminders: true,
    weeklySummaries: false,
  },
};

const mockAccounts: ConnectedAccount[] = [
  {
    id: "acct-1",
    name: "Everyday Checking",
    institutionName: "Mock Bank",
    type: "checking",
    lastFour: "1234",
    balance: 2450,
    currency: "EUR",
    isConnected: true,
    status: "connected",
    accessType: "read_only",
    connectionMode: "mock",
  },
];

vi.mock("../app/providers/MockAuthProvider", () => ({
  useMockAuth: () => ({
    currentUser: mockProfile,
    updateProfile: mocks.updateProfile,
    logout: mocks.logout,
  }),
}));

vi.mock("../app/providers/AccountConnectionProvider", () => ({
  useConnectedAccounts: () => ({
    accounts: mockAccounts,
    connectMockAccounts: mocks.connectMockAccounts,
    listBankInstitutions: mocks.listBankInstitutions,
    startRealBankConnection: mocks.startRealBankConnection,
    reconnectAccount: mocks.reconnectAccount,
    removeMockAccount: mocks.removeMockAccount,
    triggerMockImport: mocks.triggerMockImport,
  }),
}));

vi.mock("../app/providers/AppSettingsProvider", () => ({
  useAppSettings: () => ({
    themeMode: "light",
    accessibilitySettings: {
      largerText: false,
      reduceMotion: false,
      highContrast: false,
      comfortableLayout: false,
    },
    setThemeMode: mocks.setThemeMode,
    setAccessibilityPreference: vi.fn(),
  }),
}));

vi.mock("../app/providers/AppNavigationProvider", () => ({
  useAppNavigation: () => ({
    activeView: "profile",
    setActiveView: vi.fn(),
    profileTabIntent: null,
    setProfileTabIntent: mocks.setProfileTabIntent,
    openProfileTab: vi.fn(),
    expenseQuery: "",
    setExpenseQuery: vi.fn(),
  }),
}));

vi.mock("../app/providers/BudgetProvider", () => ({
  useBudgets: () => ({
    budgets: [{ id: "budget-1", category: "Food & Grocery", limitAmount: 400 }],
  }),
}));

vi.mock("../app/providers/ExpenseProvider", () => ({
  useExpenses: () => ({
    expenses: [{ id: "expense-1" }],
  }),
}));

vi.mock("../app/providers/GoalProvider", () => ({
  useGoals: () => ({
    goals: [{ id: "goal-1" }],
  }),
}));

vi.mock("../app/providers/NotificationProvider", () => ({
  useNotifications: () => ({
    notifications: [{ id: "notification-1" }],
  }),
}));

vi.mock("../app/providers/FeedbackProvider", () => ({
  useFeedback: (): Partial<FeedbackContextType> => ({
    showInfo: mocks.showInfo,
    showSuccess: mocks.showSuccess,
    confirmAction: mocks.confirmAction,
  }),
}));

vi.mock("../features/demo/hooks/useDemoDataActions", () => ({
  useDemoDataActions: () => ({
    clearSampleData: mocks.clearSampleData,
    loadSampleData: mocks.loadSampleData,
    resetSampleData: mocks.resetSampleData,
  }),
}));

describe("profile and settings panels", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  test("ProfileSettingsView renders the main panels", () => {
    render(<ProfileSettingsView />);

    expect(screen.getAllByText("Connected Accounts").length).toBeGreaterThan(0);
    expect(screen.getByRole("tab", { name: "Profile" })).toBeTruthy();
    expect(screen.getByText("Appearance")).toBeTruthy();
    expect(screen.getByRole("tab", { name: "Notifications" })).toBeTruthy();
    expect(screen.getByRole("tab", { name: "Accessibility" })).toBeTruthy();
    expect(screen.getByRole("tab", { name: "Privacy" })).toBeTruthy();
    expect(screen.getByRole("tab", { name: "Security" })).toBeTruthy();
    expect(screen.getByText("Demo Tools")).toBeTruthy();
  });

  test("ProfileSettingsView logout action still works", async () => {
    const user = userEvent.setup();
    render(<ProfileSettingsView />);

    await user.click(screen.getByRole("tab", { name: "Profile" }));
    fireEvent.click(screen.getByRole("button", { name: "Sign Out" }));

    expect(mocks.logout).toHaveBeenCalledTimes(1);
  });

  test("AppearanceSettingsPanel renders Light, Dark, and System options", () => {
    render(<AppearanceSettingsPanel themeMode="light" onThemeModeChange={mocks.setThemeMode} />);

    expect(screen.getByText("Light Mode")).toBeTruthy();
    expect(screen.getByText("Dark Mode")).toBeTruthy();
    expect(screen.getByText("System Default")).toBeTruthy();
    expect(screen.getByText("System follows your browser or device theme.")).toBeTruthy();
  });

  test("NotificationSettingsPanel renders notification controls", () => {
    render(
      <NotificationSettingsPanel
        settings={mockProfile.notifications}
        onChange={mocks.updateProfile}
      />
    );

    expect(screen.getByText("Budget alerts")).toBeTruthy();
    expect(screen.getByText("Alert me when a budget reaches")).toBeTruthy();
    expect(screen.getByRole("combobox", { name: /Alert me when a budget reaches/i })).toHaveValue("80");
  });

  test("ConnectedAccountsPanel renders mock account information", () => {
    render(
      <ConnectedAccountsPanel
        accounts={mockAccounts}
        onImportMockExpenses={mocks.triggerMockImport}
        onConnectAccounts={mocks.connectMockAccounts}
        onStartRealConnection={async () => undefined}
        onReconnectAccount={mocks.reconnectAccount}
        onRemoveAccount={mocks.removeMockAccount}
      />
    );

    expect(screen.getByText("Everyday Checking")).toBeTruthy();
    expect(screen.getByText(/Mock Bank/)).toBeTruthy();
    expect(screen.getByText("Read-only")).toBeTruthy();
  });

  test("ProfileSettingsView renders privacy, security, and accessibility notices on separate tabs", async () => {
    const user = userEvent.setup();

    render(<ProfileSettingsView />);

    await user.click(screen.getByRole("tab", { name: "Security" }));
    expect(screen.getByText("Security controls are mock-only in this frontend version. No real account credentials are stored.")).toBeTruthy();
    expect(screen.getAllByText("Coming later").length).toBeGreaterThan(0);

    await user.click(screen.getByRole("tab", { name: "Privacy" }));
    expect(screen.getByText("This app uses local mock data. Connected account access is simulated, read-only, and never reaches a real bank.")).toBeTruthy();

    await user.click(screen.getByRole("tab", { name: "Accessibility" }));
    expect(screen.getByLabelText("Larger text")).toBeTruthy();
  });

  test("clear local data asks for confirmation", async () => {
    const user = userEvent.setup();
    mocks.confirmAction.mockResolvedValue(false);

    render(<ProfileSettingsView />);

    await user.click(screen.getByRole("tab", { name: "Privacy" }));
    await user.click(screen.getByRole("button", { name: "Clear local data" }));

    expect(mocks.confirmAction).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Clear all local data and restart onboarding?",
        confirmLabel: "Clear all local data",
        variant: "danger",
      })
    );
  });

  test("Demo Tools import action calls the provided local mock import workflow", async () => {
    const user = userEvent.setup();

    render(
      <ExperimentalFeaturesPanel
        dataStatus={demoDataStatus}
        onClearAllLocalData={mocks.clearAllLocalData}
        onClearDemoData={mocks.clearSampleData}
        onImportMockExpenses={mocks.triggerMockImport}
        onLoadSampleData={mocks.loadSampleData}
        onResetDemoData={mocks.resetSampleData}
      />
    );

    await user.click(screen.getByRole("button", { name: "Import Expenses" }));

    expect(mocks.triggerMockImport).toHaveBeenCalledTimes(1);
  });

  test("Demo Tools sample data action calls the provided sample data workflow", async () => {
    const user = userEvent.setup();

    render(
      <ExperimentalFeaturesPanel
        dataStatus={demoDataStatus}
        onClearAllLocalData={mocks.clearAllLocalData}
        onClearDemoData={mocks.clearSampleData}
        onImportMockExpenses={mocks.triggerMockImport}
        onLoadSampleData={mocks.loadSampleData}
        onResetDemoData={mocks.resetSampleData}
      />
    );

    await user.click(screen.getByRole("button", { name: "Load Sample Data" }));

    expect(mocks.loadSampleData).toHaveBeenCalledTimes(1);
  });

  test("Demo Tools reset and clear actions call their workflows", async () => {
    const user = userEvent.setup();

    render(
      <ExperimentalFeaturesPanel
        dataStatus={demoDataStatus}
        onClearAllLocalData={mocks.clearAllLocalData}
        onClearDemoData={mocks.clearSampleData}
        onImportMockExpenses={mocks.triggerMockImport}
        onLoadSampleData={mocks.loadSampleData}
        onResetDemoData={mocks.resetSampleData}
      />
    );

    await user.click(screen.getByRole("button", { name: "Reset Demo Data" }));
    await user.click(screen.getByRole("button", { name: "Clear Financial App Data" }));
    await user.click(screen.getByRole("button", { name: "Clear All Local Data and Restart Onboarding" }));

    expect(mocks.resetSampleData).toHaveBeenCalledTimes(1);
    expect(mocks.clearSampleData).toHaveBeenCalledTimes(1);
    expect(mocks.clearAllLocalData).toHaveBeenCalledTimes(1);
  });
});
