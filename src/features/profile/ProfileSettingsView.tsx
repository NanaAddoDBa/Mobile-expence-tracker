import React, { useEffect } from "react";
import { useFeedback } from "../../app/providers/FeedbackProvider";
import { useAppSettings } from "../../app/providers/AppSettingsProvider";
import { useConnectedAccounts } from "../../app/providers/AccountConnectionProvider";
import { useBudgets } from "../../app/providers/BudgetProvider";
import { useExpenses } from "../../app/providers/ExpenseProvider";
import { useGoals } from "../../app/providers/GoalProvider";
import { useAppNavigation } from "../../app/providers/AppNavigationProvider";
import { useMockAuth } from "../../app/providers/MockAuthProvider";
import { useNotifications } from "../../app/providers/NotificationProvider";
import { Card } from "../../components/ui/Card";
import { NotificationSettings } from "../../domain/profile/profile.types";
import { authApi } from "../../services/api";
import { USES_HTTP_API } from "../../services/api/apiMode";
import {
  clearLocalAppData,
  downloadLocalAppDataExport,
} from "../../services/storage/appLocalDataService";
import { AppearanceSettingsPanel } from "../settings/components/AppearanceSettingsPanel";
import { ExperimentalFeaturesPanel } from "../settings/components/ExperimentalFeaturesPanel";
import { NotificationSettingsPanel } from "../settings/components/NotificationSettingsPanel";
import { AccessibilitySettingsPanel } from "../settings/components/AccessibilitySettingsPanel";
import { PrivacySettingsPanel } from "../settings/components/PrivacySettingsPanel";
import { SecuritySettingsPanel } from "../settings/components/SecuritySettingsPanel";
import { useDemoDataActions } from "../demo/hooks/useDemoDataActions";
import { ConnectedAccountsPanel } from "./components/ConnectedAccountsPanel";
import { PersonalInfoPanel } from "./components/PersonalInfoPanel";
import { ProfileFooterNote } from "./components/ProfileFooterNote";
import { ProfileSettingsTabs } from "./components/ProfileSettingsTabs";
import { useProfileSettings } from "./hooks/useProfileSettings";

export const ProfileSettingsView: React.FC = () => {
  const {
    currentUser,
    updateProfile,
    deleteAccount,
    logout,
  } = useMockAuth();
  const {
    accounts,
    triggerMockImport,
    connectMockAccounts,
    listBankInstitutions,
    startRealBankConnection,
    reconnectAccount,
    removeMockAccount,
  } = useConnectedAccounts();
  const { budgets } = useBudgets();
  const { expenses } = useExpenses();
  const { goals } = useGoals();
  const { notifications } = useNotifications();
  const {
    themeMode,
    accessibilitySettings,
    setThemeMode,
    setAccessibilityPreference,
  } = useAppSettings();
  const { confirmAction, showInfo, showSuccess } = useFeedback();
  const { clearSampleData, loadSampleData, resetSampleData } = useDemoDataActions();
  const { profileTabIntent, setProfileTabIntent } = useAppNavigation();

  const settings = useProfileSettings({
    currentUser,
    accounts,
    updateProfile,
    isServerBacked: USES_HTTP_API,
    triggerMockImport,
    showInfo,
    showSuccess,
  });

  useEffect(() => {
    if (!profileTabIntent) return;

    settings.setActiveTab(profileTabIntent);
    setProfileTabIntent(null);
  }, [profileTabIntent, setProfileTabIntent, settings]);

  const notificationSettings: NotificationSettings = currentUser?.notifications || {
    enableAlerts: true,
    budgetThreshold: 80,
    recurringReminders: true,
    weeklySummaries: false,
  };

  const updateNotificationSettings = (updates: Partial<NotificationSettings>) => {
    if (!currentUser) return;

    void updateProfile({
      notifications: {
        ...notificationSettings,
        ...updates,
      },
    });
    showSuccess(USES_HTTP_API ? "Settings saved." : "Saved locally.");
  };

  const updateThemeMode = (mode: typeof themeMode) => {
    setThemeMode(mode);
    showSuccess("Saved locally.");
  };

  const updateAccessibilitySetting: typeof setAccessibilityPreference = (key, value) => {
    setAccessibilityPreference(key, value);
    showSuccess("Saved locally.");
  };

  const exportData = async () => {
    if (!USES_HTTP_API) {
      downloadLocalAppDataExport();
      showSuccess("Local data export downloaded.");
      return;
    }

    const exportPayload = await authApi.exportAccountData();
    downloadJson(exportPayload, `expense-tracker-export-${new Date().toISOString().slice(0, 10)}.json`);
    showSuccess("Account data export downloaded.");
  };

  const clearLocalData = async () => {
    const confirmed = await confirmAction({
      title: "Clear all local data and restart onboarding?",
      description: "This removes this app's local expenses, budgets, goals, accounts, profile preferences, and notifications from this browser.",
      confirmLabel: "Clear all local data",
      variant: "danger",
    });

    if (!confirmed) return;

    clearLocalAppData();
    showSuccess("Local data cleared. Reloading the app.");
    window.setTimeout(() => window.location.reload(), 500);
  };

  const deleteAccountData = async () => {
    if (!USES_HTTP_API) {
      await clearLocalData();
      return;
    }

    const confirmed = await confirmAction({
      title: "Permanently delete your account?",
      description:
        "This permanently removes your profile, expenses, income, budgets, goals, bank connections, imports, and settings. This cannot be undone.",
      confirmLabel: "Delete account",
      variant: "danger",
    });

    if (!confirmed) return;

    await deleteAccount();
    clearLocalAppData();
    showSuccess("Account and server data deleted.");
  };

  const loadLocalSampleData = async () => {
    await loadSampleData();
    showSuccess("Starter sample data loaded.");
  };

  const resetLocalDemoData = async () => {
    const confirmed = await confirmAction({
      title: "Reset demo data?",
      description: "This replaces local expenses, budgets, goals, and connected accounts with starter sample data.",
      confirmLabel: "Reset data",
      variant: "danger",
    });

    if (!confirmed) return;

    await resetSampleData();
    showSuccess("Demo data reset.");
  };

  const clearLocalDemoData = async () => {
    const confirmed = await confirmAction({
      title: "Clear financial app data?",
      description: "This removes local expenses, budgets, goals, connected accounts, and notifications. Your sign-in and onboarding state stay in place.",
      confirmLabel: "Clear financial data",
      variant: "danger",
    });

    if (!confirmed) return;

    await clearSampleData();
    showSuccess("Local app data cleared.");
  };

  return (
    <div className="space-y-6">
      <ProfileSettingsTabs
        activeTab={settings.activeTab}
        onTabChange={settings.setActiveTab}
      />

      {settings.activeTab === "profile" ? (
        <div className="max-w-md">
          <PersonalInfoPanel
            currentUser={currentUser}
            name={settings.tmpName}
            email={settings.tmpEmail}
            savingProfileSuccess={settings.savingProfileSuccess}
            isServerBacked={USES_HTTP_API}
            onNameChange={settings.setTmpName}
            onEmailChange={settings.setTmpEmail}
            onProfileSave={settings.handleProfileSave}
            onLogout={logout}
          />
        </div>
      ) : (
        <Card className="p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80">
          {settings.activeTab === "accounts" && (
            <ConnectedAccountsPanel
              accounts={accounts}
              onConnectAccounts={connectMockAccounts}
              onListBankInstitutions={listBankInstitutions}
              onStartRealConnection={startRealBankConnection}
              onImportMockExpenses={triggerMockImport}
              onReconnectAccount={reconnectAccount}
              onRemoveAccount={removeMockAccount}
            />
          )}

          {settings.activeTab === "appearance" && (
            <AppearanceSettingsPanel
              themeMode={themeMode}
              onThemeModeChange={updateThemeMode}
            />
          )}

          {settings.activeTab === "notifications" && (
            <NotificationSettingsPanel
              settings={notificationSettings}
              onChange={updateNotificationSettings}
            />
          )}

          {settings.activeTab === "accessibility" && (
            <AccessibilitySettingsPanel
              settings={accessibilitySettings}
              onChange={updateAccessibilitySetting}
            />
          )}

          {settings.activeTab === "privacy" && (
            <PrivacySettingsPanel
              isServerBacked={USES_HTTP_API}
              onExportData={() => {
                void exportData();
              }}
              onDeleteData={() => {
                void deleteAccountData();
              }}
            />
          )}

          {settings.activeTab === "security" && (
            <SecuritySettingsPanel
              emailVerifiedAt={currentUser?.emailVerifiedAt}
              onLogout={logout}
            />
          )}

          {settings.activeTab === "demo" && (
            <ExperimentalFeaturesPanel
              dataStatus={{
                expenses: expenses.length,
                budgets: budgets.length,
                goals: goals.length,
                connectedAccounts: accounts.length,
                notifications: notifications.length,
                receipts: 0,
              }}
              onClearAllLocalData={() => {
                void clearLocalData();
              }}
              onClearDemoData={() => {
                void clearLocalDemoData();
              }}
              onImportMockExpenses={settings.importMockExpenses}
              onLoadSampleData={() => {
                void loadLocalSampleData();
              }}
              onResetDemoData={() => {
                void resetLocalDemoData();
              }}
            />
          )}
        </Card>
      )}

      <ProfileFooterNote />
    </div>
  );
};

function downloadJson(payload: unknown, fileName: string): void {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    })
  );
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}
