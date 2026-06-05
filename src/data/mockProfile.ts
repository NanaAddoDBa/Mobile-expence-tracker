import { UserProfile } from "../domain/profile/profile.types";

export const INITIAL_PROFILE: UserProfile = {
  id: "usr-0932",
  name: "Demo User",
  email: "demo@example.com",
  avatarUrl: "", // Will render letters fallback if empty
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
    budgetThreshold: 80, // Notify when category exceeds 80%
    recurringReminders: true,
    weeklySummaries: false,
  },
};
