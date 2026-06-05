/** @vitest-environment jsdom */

import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import { Button } from "../components/ui/Button";
import { EmptyState } from "../components/ui/EmptyState";
import { FormField } from "../components/ui/FormField";
import { Modal } from "../components/ui/Modal";
import { Tabs } from "../components/ui/Tabs";

describe("shared UI primitives", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    document.body.style.overflow = "unset";
  });

  test("Button variants render with stable labels", () => {
    render(
      <div>
        <Button variant="primary">Save</Button>
        <Button variant="danger">Delete</Button>
      </div>
    );

    expect(screen.getByRole("button", { name: "Save" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Delete" })).toBeTruthy();
  });

  test("Modal has accessible dialog role and title", () => {
    render(
      <Modal isOpen title="Edit expense" onClose={() => undefined}>
        Form content
      </Modal>
    );

    expect(screen.getByRole("dialog", { name: "Edit expense" })).toBeTruthy();
  });

  test("Tabs show selected state and handle tab changes", () => {
    const onTabChange = vi.fn();

    render(
      <Tabs
        activeTab="one"
        onTabChange={onTabChange}
        items={[
          { id: "one", label: "One" },
          { id: "two", label: "Two" },
        ]}
      />
    );

    expect(screen.getByRole("tab", { name: "One" }).getAttribute("aria-selected")).toBe("true");

    fireEvent.click(screen.getByRole("tab", { name: "Two" }));

    expect(onTabChange).toHaveBeenCalledWith("two");
  });

  test("EmptyState renders title, description, and action", () => {
    render(
      <EmptyState
        title="No expenses yet"
        description="Add your first expense."
        action={<Button>Add Expense</Button>}
      />
    );

    expect(screen.getByText("No expenses yet")).toBeTruthy();
    expect(screen.getByText("Add your first expense.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Add Expense" })).toBeTruthy();
  });

  test("FormField renders label, helper text, and error text", () => {
    render(
      <div>
        <FormField label="Amount" helperText="Use numbers only">
          <input />
        </FormField>
        <FormField label="Merchant" error="Merchant is required">
          <input />
        </FormField>
      </div>
    );

    expect(screen.getByText("Amount")).toBeTruthy();
    expect(screen.getByText("Use numbers only")).toBeTruthy();
    expect(screen.getByText("Merchant is required")).toBeTruthy();
  });
});
