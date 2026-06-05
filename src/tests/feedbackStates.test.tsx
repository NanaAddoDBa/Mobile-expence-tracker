import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Receipt } from "lucide-react";
import { describe, expect, test, vi } from "vitest";
import { EmptyState } from "../components/feedback/EmptyState";
import { ErrorState } from "../components/feedback/ErrorState";
import { InlineMessage } from "../components/feedback/InlineMessage";
import { LoadingState } from "../components/feedback/LoadingState";
import { ToastMessage } from "../components/feedback/ToastMessage";

describe("feedback state components", () => {
  test("LoadingState renders user-facing loading text", () => {
    render(<LoadingState label="Loading expenses..." />);

    expect(screen.getByText("Loading expenses...")).toBeInTheDocument();
  });

  test("ErrorState renders retry action", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();

    render(<ErrorState message="We could not load expenses." onRetry={onRetry} />);

    expect(screen.getByText("We could not load expenses.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Retry Operation" }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  test("EmptyState renders action text", async () => {
    const user = userEvent.setup();
    const onAction = vi.fn();

    render(
      <EmptyState
        icon={Receipt}
        title="No receipts yet"
        description="Upload a receipt to test mock scanning."
        actionText="Upload Receipt"
        onAction={onAction}
      />
    );

    expect(screen.getByText("No receipts yet")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Upload Receipt" }));

    expect(onAction).toHaveBeenCalledTimes(1);
  });

  test("InlineMessage and ToastMessage render accessible status messages", async () => {
    const user = userEvent.setup();
    const onDismiss = vi.fn();

    render(
      <>
        <InlineMessage tone="warning" message="Budget is near the limit." />
        <ToastMessage
          toast={{ id: "toast-1", tone: "success", message: "Expense saved." }}
          onDismiss={onDismiss}
        />
      </>
    );

    expect(screen.getByText("Budget is near the limit.")).toBeInTheDocument();
    expect(screen.getByText("Expense saved.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Dismiss message" }));

    expect(onDismiss).toHaveBeenCalledWith("toast-1");
  });
});
