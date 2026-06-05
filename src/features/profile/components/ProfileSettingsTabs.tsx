import React from "react";
import { Tabs } from "../../../components/ui/Tabs";
import { ProfileSettingsTab } from "../hooks/useProfileSettings";

interface ProfileSettingsTabsProps {
  activeTab: ProfileSettingsTab;
  onTabChange: (tab: ProfileSettingsTab) => void;
}

const tabs: { id: ProfileSettingsTab; label: string }[] = [
  { id: "accounts", label: "Connected Accounts" },
  { id: "profile", label: "Profile" },
  { id: "appearance", label: "Appearance" },
  { id: "notifications", label: "Notifications" },
  { id: "accessibility", label: "Accessibility" },
  { id: "privacy", label: "Privacy" },
  { id: "security", label: "Security" },
  { id: "demo", label: "Demo Tools" },
];

export const ProfileSettingsTabs: React.FC<ProfileSettingsTabsProps> = ({
  activeTab,
  onTabChange,
}) => {
  return (
    <Tabs activeTab={activeTab} items={tabs} onTabChange={onTabChange} />
  );
};
