/** @vitest-environment jsdom */

import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test, vi } from "vitest";
import { FeedbackProvider, useFeedback } from "../app/providers/FeedbackProvider";
import { ConfirmDialog } from "../components/feedback/ConfirmDialog";
import { ExpenseTable } from "../components/expenses/ExpenseTable";
import { Modal } from "../components/ui/Modal";
import { Expense } from "../domain/expenses/expense.types";

const sampleExpense: Expense = {
  id: "expense-1",
  merchant: "Aldi",
  description: "Groceries",
  amount: 24.5,
  date: "2025-04-12",
  category: "Food & Grocery",
  accountSource: "acct-1",
  paymentMethod: "debit_card",
  isRecurring: false,
};

const ShowSuccessButton = () => {
  const { showSuccess } = useFeedback();

  return (
    <button type="button" onClick={() => showSuccess("Expense saved")}>
      Show success
    </button>
  );
};

describe("feedback components", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  test("ConfirmDialog renders title and description", () => {
    render(
      <ConfirmDialog
        isOpen
        title="Delete expense?"
        description="This will remove the expense."
        onConfirm={() => undefined}
        onCancel={() => undefined}
      />
    );

    expect(screen.getByText("Delete expense?")).toBeTruthy();
    expect(screen.getByText("This will remove the expense.")).toBeTruthy();
    expect(screen.getByRole("dialog", { name: "Delete expense?" })).toBeTruthy();
  });

  test("ConfirmDialog calls confirm callback", () => {
    const onConfirm = vi.fn();

    render(
      <ConfirmDialog
        isOpen
        title="Delete expense?"
        confirmLabel="Delete"
        onConfirm={onConfirm}
        onCancel={() => undefined}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  test("ConfirmDialog calls cancel callback", () => {
    const onCancel = vi.fn();

    render(
      <ConfirmDialog
        isOpen
        title="Delete expense?"
        cancelLabel="Keep"
        onConfirm={() => undefined}
        onCancel={onCancel}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Keep" }));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  test("ConfirmDialog closes with Escape", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();

    render(
      <ConfirmDialog
        isOpen
        title="Clear local data?"
        onConfirm={() => undefined}
        onCancel={onCancel}
      />
    );

    await user.keyboard("{Escape}");

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  test("Modal exposes an accessible dialog name and close button", () => {
    const onClose = vi.fn();

    render(
      <Modal isOpen title="Add Expense" onClose={onClose}>
        <p>Form content</p>
      </Modal>
    );

    expect(screen.getByRole("dialog", { name: "Add Expense" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Close dialog" }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test("FeedbackProvider shows a success message", () => {
    render(
      <FeedbackProvider>
        <ShowSuccessButton />
      </FeedbackProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: "Show success" }));

    expect(screen.getByText("Expense saved")).toBeTruthy();
  });

  test("expense table shows friendly payment method labels", () => {
    render(
      <FeedbackProvider>
        <ExpenseTable
          filteredExpenses={[sampleExpense]}
          onEditClick={() => undefined}
          onDeleteClick={() => undefined}
        />
      </FeedbackProvider>
    );

    expect(screen.getByText("Debit card")).toBeTruthy();
    expect(screen.queryByText("debit_card")).toBeNull();
  });

  test("expense deletion uses app confirmation before deleting", async () => {
    const onDeleteClick = vi.fn();
    const nativeConfirm = vi.spyOn(window, "confirm");

    render(
      <FeedbackProvider>
        <ExpenseTable
          filteredExpenses={[sampleExpense]}
          onEditClick={() => undefined}
          onDeleteClick={onDeleteClick}
        />
      </FeedbackProvider>
    );

    fireEvent.click(screen.getByTitle("Delete expense"));

    expect(nativeConfirm).not.toHaveBeenCalled();
    expect(screen.getByText("Delete expense?")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() => {
      expect(onDeleteClick).toHaveBeenCalledWith("expense-1");
    });
  });
});
