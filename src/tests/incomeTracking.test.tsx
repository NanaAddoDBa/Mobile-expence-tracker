/** @vitest-environment jsdom */

import React from "react";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test } from "vitest";
import { IncomeLedgerView } from "../features/incomes/IncomeLedgerView";
import { renderWithProviders } from "./renderWithProviders";

describe("income tracking", () => {
  test("adds income and updates the cash-flow summary", async () => {
    const user = userEvent.setup();
    renderWithProviders(<IncomeLedgerView />);

    expect(screen.getByRole("heading", { name: "Income" })).toBeInTheDocument();
    await user.click(screen.getAllByRole("button", { name: "Add Income" })[0]);
    await user.type(screen.getByLabelText("Income source"), "Example Employer");
    await user.type(screen.getByLabelText("Description"), "Monthly salary");
    await user.type(screen.getByLabelText("Amount (EUR)"), "3000");
    await user.click(screen.getByRole("button", { name: "Save Income" }));

    expect(await screen.findByText("Example Employer")).toBeInTheDocument();
    expect(await screen.findByText("+€3,000.00")).toBeInTheDocument();
    expect(await screen.findByText("100.0%")).toBeInTheDocument();
  });
});
