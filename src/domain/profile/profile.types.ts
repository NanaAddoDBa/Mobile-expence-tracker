import { AppSettings } from "../settings/settings.types";
export type { AppSettings } from "../settings/settings.types";

export interface NotificationSettings {
  enableAlerts: boolean;
  budgetThreshold: number; // e.g., 80 for 80% usage
  recurringReminders: boolean;
  weeklySummaries: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  emailVerifiedAt?: string | null;
  avatarUrl?: string;
  settings: AppSettings;
  notifications: NotificationSettings;
}
