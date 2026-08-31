import React, { useState } from "react";
import { ProfileTabIntent } from "../../../app/providers/AppNavigationProvider";
import { ConnectedAccount } from "../../../domain/accounts/account.types";
import { UserProfile } from "../../../domain/profile/profile.types";

export type ProfileSettingsTab = ProfileTabIntent;

interface UseProfileSettingsOptions {
  currentUser: UserProfile | null;
  accounts: ConnectedAccount[];
  updateProfile: (profile: Partial<UserProfile>) => Promise<void>;
  isServerBacked: boolean;
  triggerMockImport: (accountId: string) => Promise<void>;
  showInfo: (message: string) => void;
  showSuccess: (message: string) => void;
}

export function useProfileSettings({
  currentUser,
  accounts,
  updateProfile,
  isServerBacked,
  triggerMockImport,
  showInfo,
  showSuccess,
}: UseProfileSettingsOptions) {
  const [activeTab, setActiveTab] = useState<ProfileSettingsTab>("accounts");
  const [tmpName, setTmpName] = useState(currentUser?.name || "Demo User");
  const [tmpEmail, setTmpEmail] = useState(currentUser?.email || "demo@example.com");
  const [savingProfileSuccess, setSavingProfileSuccess] = useState(false);

  const handleProfileSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!tmpName.trim() || !tmpEmail.trim()) return;

    await updateProfile({
      name: tmpName.trim(),
      ...(isServerBacked ? {} : { email: tmpEmail.trim() }),
    });

    setSavingProfileSuccess(true);
    window.setTimeout(() => setSavingProfileSuccess(false), 2500);
  };

  const importMockExpenses = () => {
    const connectedAccounts = accounts.filter((account) => account.isConnected);
    if (connectedAccounts.length === 0) {
      showInfo("Connect a read-only mock account before importing expenses.");
      return;
    }

    connectedAccounts.forEach((account) => {
      void triggerMockImport(account.id);
    });
    showSuccess("Mock expenses imported. Check your overview or expenses.");
  };

  return {
    activeTab,
    setActiveTab,
    tmpName,
    setTmpName,
    tmpEmail,
    setTmpEmail,
    savingProfileSuccess,
    handleProfileSave,
    importMockExpenses,
  };
}
