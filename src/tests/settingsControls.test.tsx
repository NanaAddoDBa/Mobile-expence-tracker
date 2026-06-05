/** @vitest-environment jsdom */

import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test } from "vitest";
import { AppProviders } from "../app/providers/AppProviders";
import { useAppSettings } from "../app/providers/AppSettingsProvider";
import { useMockAuth } from "../app/providers/MockAuthProvider";
import { INITIAL_PROFILE } from "../data/mockProfile";
import { AccessibilitySettingsPanel } from "../features/settings/components/AccessibilitySettingsPanel";
import { NotificationSettingsPanel } from "../features/settings/components/NotificationSettingsPanel";

const NotificationSettingsProbe = () => {
  const { currentUser, updateProfile } = useMockAuth();
  if (!currentUser) return null;

  return (
    <NotificationSettingsPanel
      settings={currentUser.notifications}
      onChange={(updates) =>
        updateProfile({
          notifications: {
            ...currentUser.notifications,
            ...updates,
          },
        })
      }
    />
  );
};

const AccessibilitySettingsProbe = () => {
  const { accessibilitySettings, setAccessibilityPreference } = useAppSettings();

  return (
    <AccessibilitySettingsPanel
      settings={accessibilitySettings}
      onChange={setAccessibilityPreference}
    />
  );
};

describe("settings controls", () => {
  test("notification toggles and budget threshold update profile state", async () => {
    const user = userEvent.setup();
    localStorage.setItem("exp_user_profile", JSON.stringify(INITIAL_PROFILE));

    render(
      <AppProviders>
        <NotificationSettingsProbe />
      </AppProviders>
    );

    const budgetAlerts = screen.getByLabelText("Budget alerts");
    expect(budgetAlerts).toBeChecked();

    await user.selectOptions(
      screen.getByRole("combobox", { name: /Alert me when a budget reaches/i }),
      "90"
    );
    await user.click(budgetAlerts);

    await waitFor(() => {
      const savedProfile = JSON.parse(localStorage.getItem("exp_user_profile") || "{}");
      expect(savedProfile.notifications.enableAlerts).toBe(false);
      expect(savedProfile.notifications.budgetThreshold).toBe(90);
    });
  });

  test("accessibility toggles update root classes and persist locally", async () => {
    const user = userEvent.setup();
    localStorage.setItem("exp_user_profile", JSON.stringify(INITIAL_PROFILE));

    render(
      <AppProviders>
        <AccessibilitySettingsProbe />
      </AppProviders>
    );

    await user.click(screen.getByLabelText("Larger text"));
    await user.click(screen.getByLabelText("Reduce motion"));
    await user.click(screen.getByLabelText("High contrast"));
    await user.click(screen.getByLabelText("Comfortable layout"));

    await waitFor(() => {
      expect(document.documentElement).toHaveClass("text-size-large");
      expect(document.documentElement).toHaveClass("reduce-motion");
      expect(document.documentElement).toHaveClass("contrast-high");
      expect(document.documentElement).toHaveClass("layout-comfortable");
    });

    await waitFor(() => {
      const savedProfile = JSON.parse(localStorage.getItem("exp_user_profile") || "{}");
      expect(savedProfile.settings.accessibility).toMatchObject({
        largerText: true,
        reduceMotion: true,
        highContrast: true,
        comfortableLayout: true,
      });
    });
  });
});
