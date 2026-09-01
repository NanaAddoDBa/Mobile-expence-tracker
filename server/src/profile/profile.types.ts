import { CurrencyCode, UserSettings, UserStatus } from "@prisma/client";

export interface ProfileSettingsResponse {
  theme: string;
  currency: CurrencyCode;
  language: string;
  accessibility: {
    largerText: boolean;
    reduceMotion: boolean;
    highContrast: boolean;
    comfortableLayout: boolean;
  };
}

export interface ProfileNotificationSettingsResponse {
  enableAlerts: boolean;
  budgetThreshold: number;
  recurringReminders: boolean;
  weeklySummaries: boolean;
}

export interface UserProfileResponse {
  id: string;
  email: string;
  name: string;
  status: UserStatus;
  emailVerifiedAt: string | null;
  createdAt: string;
  settings: ProfileSettingsResponse;
  notifications: ProfileNotificationSettingsResponse;
}

export function toProfileSettingsResponse(
  settings: UserSettings,
): Pick<UserProfileResponse, "settings" | "notifications"> {
  return {
    settings: {
      theme: settings.themePreference,
      currency: settings.baseCurrency,
      language: settings.language,
      accessibility: {
        largerText: settings.largerText,
        reduceMotion: settings.reduceMotion,
        highContrast: settings.highContrast,
        comfortableLayout: settings.comfortableLayout,
      },
    },
    notifications: {
      enableAlerts: settings.budgetAlertsEnabled,
      budgetThreshold: settings.budgetAlertThreshold,
      recurringReminders: settings.recurringRemindersEnabled,
      weeklySummaries: settings.weeklySummaryEnabled,
    },
  };
}
