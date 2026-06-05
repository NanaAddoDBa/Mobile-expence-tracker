/** @vitest-environment jsdom */

import React from "react";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, test } from "vitest";
import { useExpenses } from "../app/providers/ExpenseProvider";
import { CreateExpenseModel } from "../domain/expenses/expense.types";
import { renderWithProviders } from "./renderWithProviders";

const baseExpensePayload: CreateExpenseModel = {
  merchant: "Corner Shop",
  description: "Snacks",
  amount: 12,
  date: "2026-06-02",
  category: "Food & Grocery",
  accountSource: "wallet",
  paymentMethod: "digital_wallet",
  isRecurring: false,
};

function buildExpensePayload(overrides: Partial<CreateExpenseModel> = {}): CreateExpenseModel {
  return {
    ...baseExpensePayload,
    ...overrides,
  };
}

const ExpenseSourceProbe: React.FC<{ expense: CreateExpenseModel }> = ({ expense }) => {
  const { addExpense, expenses } = useExpenses();
  const latestExpense = expenses[0];

  return (
    <>
      <button type="button" onClick={() => addExpense(expense)}>
        Add expense
      </button>
      <span data-testid="merchant">{latestExpense?.merchant || ""}</span>
      <span data-testid="entry-source">{latestExpense?.entrySource || ""}</span>
      <span data-testid="receipt-id">{latestExpense?.receiptId || ""}</span>
      <span data-testid="source-account-id">{latestExpense?.sourceAccountId || ""}</span>
      <span data-testid="import-batch-id">{latestExpense?.importBatchId || ""}</span>
      <span data-testid="external-transaction-id">
        {latestExpense?.externalTransactionId || ""}
      </span>
      <span data-testid="recurring-template-id">{latestExpense?.recurringTemplateId || ""}</span>
    </>
  );
};

describe("ExpenseProvider source metadata", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test("defaults manually added expenses to manual source metadata", async () => {
    renderWithProviders(
      <ExpenseSourceProbe expense={buildExpensePayload({ merchant: "Manual Shop" })} />
    );

    fireEvent.click(screen.getByRole("button", { name: "Add expense" }));

    await waitFor(() => {
      expect(screen.getByTestId("merchant")).toHaveTextContent("Manual Shop");
    });
    expect(screen.getByTestId("entry-source")).toHaveTextContent("manual");
  });

  test("preserves receipt scan metadata when adding a receipt-created expense", async () => {
    renderWithProviders(
      <ExpenseSourceProbe
        expense={buildExpensePayload({
          merchant: "Receipt Shop",
          entrySource: "receipt_scan",
          receiptId: "receipt-fixed-id",
        })}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Add expense" }));

    await waitFor(() => {
      expect(screen.getByTestId("merchant")).toHaveTextContent("Receipt Shop");
    });
    expect(screen.getByTestId("entry-source")).toHaveTextContent("receipt_scan");
    expect(screen.getByTestId("receipt-id")).toHaveTextContent("receipt-fixed-id");
  });

  test("preserves connected account metadata when adding imported expenses", async () => {
    renderWithProviders(
      <ExpenseSourceProbe
        expense={buildExpensePayload({
          merchant: "Imported Shop",
          entrySource: "connected_account",
          sourceAccountId: "account-1",
          importBatchId: "batch-1",
          externalTransactionId: "external-1",
        })}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Add expense" }));

    await waitFor(() => {
      expect(screen.getByTestId("merchant")).toHaveTextContent("Imported Shop");
    });
    expect(screen.getByTestId("entry-source")).toHaveTextContent("connected_account");
    expect(screen.getByTestId("source-account-id")).toHaveTextContent("account-1");
    expect(screen.getByTestId("import-batch-id")).toHaveTextContent("batch-1");
    expect(screen.getByTestId("external-transaction-id")).toHaveTextContent("external-1");
  });

  test("preserves recurring forecast metadata when adding forecast expenses", async () => {
    renderWithProviders(
      <ExpenseSourceProbe
        expense={buildExpensePayload({
          merchant: "Forecast Bill",
          entrySource: "recurring_forecast",
          recurringTemplateId: "template-1",
          isRecurring: true,
          recurringFrequency: "monthly",
        })}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Add expense" }));

    await waitFor(() => {
      expect(screen.getByTestId("merchant")).toHaveTextContent("Forecast Bill");
    });
    expect(screen.getByTestId("entry-source")).toHaveTextContent("recurring_forecast");
    expect(screen.getByTestId("recurring-template-id")).toHaveTextContent("template-1");
  });
});
