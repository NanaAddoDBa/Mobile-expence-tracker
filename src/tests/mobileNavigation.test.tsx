/** @vitest-environment jsdom */

import React from "react";
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import { DashboardLayout } from "../components/layout/DashboardLayout";

const setActiveView = vi.fn();

vi.mock("../app/providers/AppNavigationProvider", () => ({
  useAppNavigation: () => ({
    activeView: "expenses",
    setActiveView,
    expenseQuery: "",
    setExpenseQuery: vi.fn(),
  }),
}));

vi.mock("../app/providers/MockAuthProvider", () => ({
  useMockAuth: () => ({
    currentUser: {
      id: "user-1",
      name: "Demo User",
      email: "demo@example.com",
      settings: {
        currency: "EUR",
        language: "en",
        theme: "light",
        accessibility: {
          largerText: false,
          reduceMotion: false,
          highContrast: false,
          comfortableLayout: false,
        },
      },
      notifications: {
        budgetThreshold: 80,
        enableAlerts: true,
        recurringReminders: true,
        weeklySummaries: false,
      },
    },
    logout: vi.fn(),
  }),
}));

vi.mock("../app/providers/NotificationProvider", () => ({
  useNotifications: () => ({
    notifications: [],
    markNotificationAsRead: vi.fn(),
    clearAllNotifications: vi.fn(),
  }),
}));

describe("mobile navigation", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  test("mobile bottom navigation renders compact expected items", () => {
    render(
      <DashboardLayout>
        <div>Content</div>
      </DashboardLayout>
    );

    const bottomNav = screen.getByLabelText("Mobile primary navigation");

    expect(within(bottomNav).getByRole("button", { name: "Overview" })).toBeTruthy();
    expect(within(bottomNav).getByRole("button", { name: "Expenses" })).toBeTruthy();
    expect(within(bottomNav).getByRole("button", { name: "Budgets" })).toBeTruthy();
    expect(within(bottomNav).getByRole("button", { name: "Receipts" })).toBeTruthy();
    expect(within(bottomNav).getByRole("button", { name: "Profile" })).toBeTruthy();
    expect(within(bottomNav).queryByRole("button", { name: "Goals" })).toBeNull();
  });
});
