/** @vitest-environment jsdom */

import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test } from "vitest";
import App from "../App";

function renderAuthenticatedOnboarding() {
  localStorage.setItem("exp_auth", "true");
  localStorage.setItem("exp_onboarded", "false");

  render(<App />);
}

async function reachFirstActionScreen() {
  const user = userEvent.setup();
  renderAuthenticatedOnboarding();

  await user.click(screen.getByRole("button", { name: "Next" }));
  await user.click(screen.getByRole("button", { name: "Next" }));
  await user.click(screen.getByRole("button", { name: /Choose first step/i }));

  return user;
}

async function expectOnboardingCompleted() {
  await waitFor(() => {
    expect(localStorage.getItem("exp_onboarded")).toBe("true");
  });
}

describe("onboarding first actions", () => {
  test("final first-action screen renders all choices and the mock-only note", async () => {
    await reachFirstActionScreen();

    expect(screen.getByRole("heading", { name: "Choose your first step" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Add first expense/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Connect mock account/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Scan receipt/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Create budget/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Load sample data/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Skip for now" })).toBeInTheDocument();
    expect(
      screen.getByText(
        "This app uses mock data and mock services. It does not move money, connect to real banks, or control payments."
      )
    ).toBeInTheDocument();
  });

  test("Add first expense completes onboarding and opens Expenses", async () => {
    const user = await reachFirstActionScreen();

    await user.click(screen.getByRole("button", { name: /Add first expense/i }));

    expect(await screen.findByRole("heading", { name: "Expenses", level: 2 })).toBeInTheDocument();
    await expectOnboardingCompleted();
  });

  test("Connect mock account completes onboarding and opens Connected Accounts", async () => {
    const user = await reachFirstActionScreen();

    await user.click(screen.getByRole("button", { name: /Connect mock account/i }));

    expect(await screen.findByRole("tab", { name: "Connected Accounts" })).toHaveAttribute(
      "aria-selected",
      "true"
    );
    expect(screen.getByText("No accounts connected yet.")).toBeInTheDocument();
    await expectOnboardingCompleted();
  });

  test("Scan receipt completes onboarding and opens Receipts", async () => {
    const user = await reachFirstActionScreen();

    await user.click(screen.getByRole("button", { name: /Scan receipt/i }));

    expect(await screen.findByRole("heading", { name: "Receipt Scan" })).toBeInTheDocument();
    await expectOnboardingCompleted();
  });

  test("Create budget completes onboarding and opens Budgets", async () => {
    const user = await reachFirstActionScreen();

    await user.click(screen.getByRole("button", { name: /Create budget/i }));

    expect(await screen.findByRole("heading", { name: "Budget Manager" })).toBeInTheDocument();
    await expectOnboardingCompleted();
  });

  test("Load sample data completes onboarding and opens Expense Overview", async () => {
    const user = await reachFirstActionScreen();

    await user.click(screen.getByRole("button", { name: /Load sample data/i }));

    expect(await screen.findByRole("heading", { name: "Expense Overview" })).toBeInTheDocument();
    expect(screen.getByText("Based on 3 expenses")).toBeInTheDocument();
    await expectOnboardingCompleted();
  });

  test("Skip for now completes onboarding and opens the dashboard setup state", async () => {
    const user = await reachFirstActionScreen();

    await user.click(screen.getByRole("button", { name: "Skip for now" }));

    expect(await screen.findByRole("heading", { name: "Set up your expense tracker" })).toBeInTheDocument();
    await expectOnboardingCompleted();
  });
});
