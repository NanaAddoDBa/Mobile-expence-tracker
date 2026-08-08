/** @vitest-environment jsdom */

import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test, vi } from "vitest";
import { FeedbackProvider } from "../app/providers/FeedbackProvider";
import { ConnectedAccount } from "../domain/accounts/account.types";
import { Expense } from "../domain/expenses/expense.types";
import { ConnectedAccountsPanel } from "../features/profile/components/ConnectedAccountsPanel";
import { ExpenseTable } from "../features/expenses/components/ExpenseTable";

const connectedAccount: ConnectedAccount = {
  id: "mock-bank-checking-4820",
  providerId: "mock-bank",
  name: "Everyday Checking",
  type: "checking",
  institutionName: "Mock Bank",
  lastFour: "4820",
  balance: 4250.75,
  currency: "EUR",
  isConnected: true,
  status: "connected",
  accessType: "read_only",
  connectionMode: "mock",
  importedExpenseCount: 2,
};

const importedExpense: Expense = {
  id: "expense-1",
  merchant: "Aldi",
  description: "Imported grocery expense",
  amount: 42.35,
  date: "2026-06-02",
  category: "Food & Grocery",
  accountSource: "mock-bank-checking-4820",
  sourceAccountId: "mock-bank-checking-4820",
  paymentMethod: "debit_card",
  isRecurring: false,
  entrySource: "connected_account",
  externalTransactionId: "mock-bank-checking-4820-tx-001",
};

const receiptExpense: Expense = {
  id: "expense-2",
  merchant: "Lidl",
  description: "Receipt expense",
  amount: 18.9,
  date: "2026-06-02",
  category: "Food & Grocery",
  accountSource: "wallet",
  paymentMethod: "debit_card",
  isRecurring: false,
  entrySource: "receipt_scan",
  receiptId: "receipt-1",
};

describe("connected account workflow", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  test("ConnectedAccounts empty state renders when no accounts exist", () => {
    render(
      <FeedbackProvider>
        <ConnectedAccountsPanel
          accounts={[]}
          onConnectAccounts={() => undefined}
          onStartRealConnection={async () => undefined}
          onImportMockExpenses={async () => undefined}
          onReconnectAccount={async () => undefined}
          onRemoveAccount={() => undefined}
        />
      </FeedbackProvider>
    );

    expect(screen.getByText("No accounts connected yet.")).toBeTruthy();
    expect(screen.getByText("Connect a read-only mock account to import expenses.")).toBeTruthy();
  });

  test("connect account flow moves through consent, provider, auth, account selection, and success", async () => {
    const onConnectAccounts = vi.fn();

    render(
      <FeedbackProvider>
        <ConnectedAccountsPanel
          accounts={[]}
          onConnectAccounts={onConnectAccounts}
          onStartRealConnection={async () => undefined}
          onImportMockExpenses={async () => undefined}
          onReconnectAccount={async () => undefined}
          onRemoveAccount={() => undefined}
        />
      </FeedbackProvider>
    );

    fireEvent.click(screen.getAllByRole("button", { name: "Connect account" })[0]);
    expect(screen.getByText("Read-only mock connection")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    await waitFor(() => expect(screen.getByText("Choose provider")).toBeTruthy());

    fireEvent.click(screen.getByRole("button", { name: /Mock Bank/ }));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(await screen.findByText(/simulates secure bank authorization/i)).toBeTruthy();
    await waitFor(() => expect(screen.getByText("Select accounts")).toBeTruthy());
    expect(screen.queryByRole("checkbox")).toBeNull();
    expect(screen.getByRole("button", { name: /Everyday Checking/ })).toHaveAttribute(
      "aria-pressed",
      "true"
    );

    fireEvent.click(screen.getByRole("button", { name: "Connect selected" }));

    expect(onConnectAccounts).toHaveBeenCalledWith("mock-bank", ["mock-bank-checking-4820"]);
    expect(screen.getByText("Account connected")).toBeTruthy();
  });

  test("real connection flow picks a bank before starting provider consent", async () => {
    const user = userEvent.setup();
    const onListBankInstitutions = vi.fn().mockResolvedValue([
      {
        id: "REVOLUT_REVOGB21",
        name: "Revolut",
        bic: "REVOGB21",
        countries: ["DE"],
      },
      {
        id: "SANDBOXFINANCE_SFIN0000",
        name: "Sandbox Finance",
        bic: "SFIN0000",
        countries: ["DE"],
      },
    ]);
    const onStartRealConnection = vi.fn().mockResolvedValue(undefined);

    render(
      <FeedbackProvider>
        <ConnectedAccountsPanel
          accounts={[]}
          realApiMode
          onConnectAccounts={() => undefined}
          onListBankInstitutions={onListBankInstitutions}
          onStartRealConnection={onStartRealConnection}
          onImportMockExpenses={async () => undefined}
          onReconnectAccount={async () => undefined}
          onRemoveAccount={() => undefined}
        />
      </FeedbackProvider>
    );

    await user.click(screen.getAllByRole("button", { name: "Connect account" })[0]);

    expect(await screen.findByText("Select bank")).toBeTruthy();
    expect(onListBankInstitutions).toHaveBeenCalledWith("DE");
    expect(await screen.findByText("Revolut")).toBeTruthy();

    await user.type(screen.getByPlaceholderText("Search by bank name or BIC"), "revo");
    await user.click(screen.getByRole("button", { name: /Revolut/ }));
    await user.click(screen.getByRole("button", { name: "Continue to bank" }));

    expect(onStartRealConnection).toHaveBeenCalledWith({
      institutionId: "REVOLUT_REVOGB21",
      country: "DE",
      userLanguage: "EN",
    });
  });

  test("connected account card shows read-only status", () => {
    render(
      <FeedbackProvider>
        <ConnectedAccountsPanel
          accounts={[{ ...connectedAccount, type: "checking" }]}
          onConnectAccounts={() => undefined}
          onStartRealConnection={async () => undefined}
          onImportMockExpenses={async () => undefined}
          onReconnectAccount={async () => undefined}
          onRemoveAccount={() => undefined}
        />
      </FeedbackProvider>
    );

    expect(screen.getByText("Everyday Checking")).toBeTruthy();
    expect(screen.getByText("Read-only")).toBeTruthy();
    expect(screen.getByText(/Checking account/)).toBeTruthy();
    expect(screen.queryByText(/checking_account/)).toBeNull();
  });

  test("import expenses action calls the provided import workflow", async () => {
    const user = userEvent.setup();
    const onImportMockExpenses = vi.fn().mockResolvedValue(undefined);

    render(
      <FeedbackProvider>
        <ConnectedAccountsPanel
          accounts={[connectedAccount]}
          onConnectAccounts={() => undefined}
          onStartRealConnection={async () => undefined}
          onImportMockExpenses={onImportMockExpenses}
          onReconnectAccount={async () => undefined}
          onRemoveAccount={() => undefined}
        />
      </FeedbackProvider>
    );

    await user.click(screen.getByRole("button", { name: "Import expenses" }));

    expect(onImportMockExpenses).toHaveBeenCalledWith("mock-bank-checking-4820");
  });

  test("reconnect action calls the provided reconnect workflow", async () => {
    const user = userEvent.setup();
    const onReconnectAccount = vi.fn().mockResolvedValue(undefined);

    render(
      <FeedbackProvider>
        <ConnectedAccountsPanel
          accounts={[{ ...connectedAccount, status: "needs_reconnect", isConnected: false }]}
          onConnectAccounts={() => undefined}
          onStartRealConnection={async () => undefined}
          onImportMockExpenses={async () => undefined}
          onReconnectAccount={onReconnectAccount}
          onRemoveAccount={() => undefined}
        />
      </FeedbackProvider>
    );

    await user.click(screen.getByRole("button", { name: "Reconnect" }));
    expect(screen.getByText("Access needs to be refreshed before importing.")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Continue reconnect" }));

    expect(onReconnectAccount).toHaveBeenCalledWith("mock-bank-checking-4820");
  });

  test("remove account requires confirmation", async () => {
    const user = userEvent.setup();
    const onRemoveAccount = vi.fn();

    render(
      <FeedbackProvider>
        <ConnectedAccountsPanel
          accounts={[connectedAccount]}
          onConnectAccounts={() => undefined}
          onStartRealConnection={async () => undefined}
          onImportMockExpenses={async () => undefined}
          onReconnectAccount={async () => undefined}
          onRemoveAccount={onRemoveAccount}
        />
      </FeedbackProvider>
    );

    await user.click(screen.getByRole("button", { name: /Remove account/i }));

    expect(screen.getByRole("dialog", { name: "Remove connected account?" })).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Remove" }));

    expect(onRemoveAccount).toHaveBeenCalledWith("mock-bank-checking-4820");
  });

  test("expense rows show source badges", () => {
    render(
      <FeedbackProvider>
        <ExpenseTable
          filteredExpenses={[importedExpense, receiptExpense]}
          onEditClick={() => undefined}
          onDeleteClick={() => undefined}
        />
      </FeedbackProvider>
    );

    expect(screen.getByText("Imported")).toBeTruthy();
    expect(screen.getByText("Receipt")).toBeTruthy();
  });
});
