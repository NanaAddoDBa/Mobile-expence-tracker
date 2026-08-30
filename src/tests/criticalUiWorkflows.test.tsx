import React from "react";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import { useAppNavigation } from "../app/providers/AppNavigationProvider";
import { BudgetCard } from "../components/budgets/BudgetCard";
import { DepositFormModal } from "../components/goals/DepositFormModal";
import { GoalCard } from "../components/goals/GoalCard";
import { ReceiptReviewForm } from "../components/receipts/ReceiptReviewForm";
import { ReceiptScanningTips } from "../components/receipts/ReceiptScanningTips";
import { ReceiptUploadPanel } from "../components/receipts/ReceiptUploadPanel";
import { DashboardView } from "../features/dashboard/DashboardView";
import { BudgetManagerView } from "../features/budgets/BudgetManagerView";
import { ExpenseLedgerView } from "../features/expenses/ExpenseLedgerView";
import { SavingsGoalsView } from "../features/goals/SavingsGoalsView";
import { buildBudget } from "./builders/budgetBuilder";
import { buildConnectedAccount } from "./builders/accountBuilder";
import { buildExpense } from "./builders/expenseBuilder";
import { buildGoal } from "./builders/goalBuilder";
import { buildReceiptOcrResult } from "./builders/receiptBuilder";
import { renderWithProviders } from "./renderWithProviders";
import { getCurrentMonthKey } from "../lib/dateUtils";

const ActiveNavigationProbe = () => {
  const { activeView, expenseQuery } = useAppNavigation();

  return (
    <output aria-label="navigation-state">
      active-view:{activeView};expense-query:{expenseQuery}
    </output>
  );
};

function seedTrackerStorage({
  expenses = [],
  budgets = [],
  goals = [],
  accounts = [],
}: {
  expenses?: ReturnType<typeof buildExpense>[];
  budgets?: ReturnType<typeof buildBudget>[];
  goals?: ReturnType<typeof buildGoal>[];
  accounts?: ReturnType<typeof buildConnectedAccount>[];
}) {
  localStorage.setItem("exp_ledger", JSON.stringify(expenses));
  localStorage.setItem("exp_budgets", JSON.stringify(budgets));
  localStorage.setItem("exp_goals", JSON.stringify(goals));
  localStorage.setItem("exp_accounts", JSON.stringify(accounts));
}

describe("critical UI workflows", () => {
  test("dashboard setup empty state renders when no product data exists", () => {
    seedTrackerStorage({});

    renderWithProviders(
      <>
        <DashboardView />
        <ActiveNavigationProbe />
      </>
    );

    expect(screen.getByRole("heading", { name: "Set up your expense tracker" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Add first expense/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Connect mock account/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Scan receipt/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Create budget/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Load sample data/i })).toBeInTheDocument();
    expect(
      screen.getByText("This app uses mock data and mock services. It does not move money, connect to real banks, or control payments.")
    ).toBeInTheDocument();
  });

  test.each([
    ["Add first expense", "expenses"],
    ["Connect mock account", "profile"],
    ["Scan receipt", "receipts"],
    ["Create budget", "budgets"],
  ])("dashboard setup action %s navigates to %s", async (label, expectedView) => {
    const user = userEvent.setup();
    seedTrackerStorage({});

    renderWithProviders(
      <>
        <DashboardView />
        <ActiveNavigationProbe />
      </>
    );

    await user.click(screen.getByRole("button", { name: new RegExp(label, "i") }));

    expect(screen.getByLabelText("navigation-state")).toHaveTextContent(`active-view:${expectedView}`);
  });

  test("dashboard setup can load sample data without leaving the overview", async () => {
    const user = userEvent.setup();
    seedTrackerStorage({});

    renderWithProviders(
      <>
        <DashboardView />
        <ActiveNavigationProbe />
      </>
    );

    await user.click(screen.getByRole("button", { name: /Load sample data/i }));

    expect(await screen.findByRole("heading", { name: "Expense Overview" })).toBeInTheDocument();
    expect(screen.getByText("Based on 3 expenses")).toBeInTheDocument();
    expect(screen.getByLabelText("navigation-state")).toHaveTextContent("active-view:dashboard");
  });

  test("dashboard search stores the query and opens expenses", async () => {
    const user = userEvent.setup();
    const monthKey = getCurrentMonthKey();
    seedTrackerStorage({
      expenses: [buildExpense({ date: `${monthKey}-02`, merchant: "Aldi" })],
      budgets: [buildBudget()],
    });

    renderWithProviders(
      <>
        <DashboardView />
        <ActiveNavigationProbe />
      </>
    );

    expect(await screen.findByText("Based on 1 expenses")).toBeInTheDocument();

    await user.type(
      screen.getByPlaceholderText("Search merchant, notes or category..."),
      "Aldi"
    );
    await user.click(screen.getByRole("button", { name: "Find" }));

    expect(screen.getByLabelText("navigation-state")).toHaveTextContent("active-view:expenses");
    expect(screen.getByLabelText("navigation-state")).toHaveTextContent("expense-query:Aldi");
  });

  test("expenses empty state renders and opens the add expense dialog", async () => {
    const user = userEvent.setup();
    seedTrackerStorage({ expenses: [] });

    renderWithProviders(<ExpenseLedgerView />);

    expect(screen.getByText("No expenses yet")).toBeInTheDocument();
    expect(
      screen.getByText("Add your first expense, scan a receipt, or connect a mock account.")
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Add Expense" }));

    expect(screen.getByRole("dialog", { name: "Add Expense" })).toBeInTheDocument();
  });

  test("budget empty state opens Add Budget and budget cards show statuses", async () => {
    const user = userEvent.setup();
    seedTrackerStorage({ budgets: [], expenses: [] });

    renderWithProviders(<BudgetManagerView />);

    expect(screen.getByText("No monthly budgets yet")).toBeInTheDocument();

    await user.click(screen.getAllByRole("button", { name: "Add Monthly Budget" })[0]);

    expect(screen.getByRole("dialog", { name: "Add Monthly Budget" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Close dialog" }));
    await user.click(screen.getByRole("button", { name: "Daily" }));
    expect(screen.getByText("No daily budgets yet")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Add Daily Budget" })).not.toHaveLength(0);

    await user.click(screen.getByRole("button", { name: "Weekly" }));
    expect(screen.getByText("No weekly budgets yet")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Add Weekly Budget" })).not.toHaveLength(0);

    await user.click(screen.getByRole("button", { name: "Annual" }));
    expect(screen.getByText("No annual budgets yet")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Add Annual Budget" })).not.toHaveLength(0);

    renderWithFeedback(
      <>
        <BudgetCard
          budgetId="safe"
          budgetDetail={{
            category: "Food & Grocery",
            limitAmount: 400,
            spentAmount: 100,
            remainingAmount: 300,
            percentageUsed: 25,
            status: "Safe",
            period: "monthly",
            periodKey: "2026-06",
          }}
          onEditClick={() => undefined}
          onDeleteClick={() => undefined}
        />
        <BudgetCard
          budgetId="warning"
          budgetDetail={{
            category: "Dining & Cafe",
            limitAmount: 100,
            spentAmount: 85,
            remainingAmount: 15,
            percentageUsed: 85,
            status: "Warning",
            period: "monthly",
            periodKey: "2026-06",
          }}
          onEditClick={() => undefined}
          onDeleteClick={() => undefined}
        />
        <BudgetCard
          budgetId="over"
          budgetDetail={{
            category: "Shopping",
            limitAmount: 100,
            spentAmount: 120,
            remainingAmount: -20,
            percentageUsed: 120,
            status: "Over Budget",
            period: "monthly",
            periodKey: "2026-06",
          }}
          onEditClick={() => undefined}
          onDeleteClick={() => undefined}
        />
      </>
    );

    expect(screen.getByText("In target")).toBeInTheDocument();
    expect(screen.getByText("Critical")).toBeInTheDocument();
    expect(screen.getByText("Exceeded")).toBeInTheDocument();
  });

  test("goals empty state, progress, and manual savings copy render", async () => {
    const user = userEvent.setup();
    seedTrackerStorage({ goals: [] });

    renderWithProviders(<SavingsGoalsView />);

    expect(screen.getByText("No savings goals yet")).toBeInTheDocument();

    await user.click(screen.getAllByRole("button", { name: "Add Goal" })[0]);

    expect(screen.getByRole("dialog", { name: "Create Savings Goal" })).toBeInTheDocument();

    renderWithFeedback(
      <>
        <GoalCard
          goal={buildGoal({ currentAmount: 1500, targetAmount: 3000 })}
          metrics={{ monthsRemaining: 6, suggestedMonthly: 250, remainingAmount: 1500 }}
          percentage={50}
          onDepositOpen={() => undefined}
          onEditOpen={() => undefined}
          onDeleteClick={() => undefined}
        />
        <DepositFormModal
          isOpen
          onClose={() => undefined}
          onSubmit={() => undefined}
          title="Add Savings"
        />
      </>
    );

    expect(screen.getByText("50% Completed")).toBeInTheDocument();
    expect(screen.getByText("Add Savings records money you say you have set aside. The app does not move money.")).toBeInTheDocument();
  });

  test("receipt upload, review, and mock scan notice render", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    renderWithFeedback(
      <>
        <ReceiptUploadPanel
          dragActive={false}
          isScanning={false}
          scanStep=""
          scanResult={null}
          assignedFilename=""
          errorMessage=""
          onDragStateChange={() => undefined}
          onFileSelect={() => undefined}
          onReset={() => undefined}
        />
        <ReceiptScanningTips />
        <ReceiptReviewForm
          scanResult={buildReceiptOcrResult()}
          accounts={[buildConnectedAccount()]}
          categoryOptions={["Food & Grocery", "Shopping"]}
          paymentMethods={["debit_card", "credit_card"]}
          reviewValues={{
            category: "Food & Grocery",
            accountSource: "mock-bank-checking-4820",
            paymentMethod: "debit_card",
            notes: "",
          }}
          onReviewValueChange={() => undefined}
          onSubmit={onSubmit}
        />
      </>
    );

    expect(screen.getByText("Upload Receipt")).toBeInTheDocument();
    expect(screen.getByText("This uses local mock scan data. To test different categories, rename your uploaded files to match keywords:")).toBeInTheDocument();
    expect(screen.getByText("Receipt Details")).toBeInTheDocument();
    expect(screen.getByLabelText("Category")).toHaveValue("Food & Grocery");
    expect(screen.getByLabelText("Connected Account")).toHaveValue("mock-bank-checking-4820");

    await user.click(screen.getByRole("button", { name: "Add Expense" }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});

function renderWithFeedback(ui: React.ReactElement) {
  return renderWithProviders(<>{ui}</>);
}
