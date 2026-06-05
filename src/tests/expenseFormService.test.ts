import { describe, expect, test } from "vitest";
import { ConnectedAccount } from "../domain/accounts/account.types";
import { expenseFormService } from "../features/expenses/services/expenseFormService";

const accounts: ConnectedAccount[] = [
  {
    id: "acct-1",
    institutionName: "Mock Bank",
    name: "Everyday Account",
    type: "checking",
    balance: 1200,
    currency: "EUR",
    isConnected: true,
  },
];

describe("expenseFormService", () => {
  test("maps initial edit data into form values", () => {
    const values = expenseFormService.getInitialValues(
      {
        merchant: "Aldi",
        description: "Groceries",
        amount: 42.5,
        category: "Food & Grocery",
        paymentMethod: "debit_card",
        isRecurring: true,
        recurringFrequency: "weekly",
        date: "2026-06-02",
        notes: "Weekly shop",
      },
      accounts,
      "2026-06-03"
    );

    expect(values).toMatchObject({
      merchant: "Aldi",
      amount: "42.5",
      accountSource: "acct-1",
      recurringFrequency: "weekly",
      date: "2026-06-02",
    });
  });

  test("creates a submit payload from draft values", () => {
    const payload = expenseFormService.toSubmitPayload({
      merchant: "  Aldi  ",
      description: "  Groceries ",
      amount: "24.50",
      category: "Food & Grocery",
      accountSource: "acct-1",
      paymentMethod: "debit_card",
      isRecurring: false,
      recurringFrequency: "monthly",
      date: "2026-06-02",
      notes: "  ",
    });

    expect(payload).toEqual({
      merchant: "Aldi",
      description: "Groceries",
      amount: 24.5,
      category: "Food & Grocery",
      accountSource: "acct-1",
      paymentMethod: "debit_card",
      isRecurring: false,
      recurringFrequency: undefined,
      date: "2026-06-02",
      notes: undefined,
    });
  });

  test("invalid amount shows a validation error", () => {
    const validation = expenseFormService.validateDraft({
      merchant: "Aldi",
      description: "Groceries",
      amount: "0",
      category: "Food & Grocery",
      accountSource: "acct-1",
      paymentMethod: "debit_card",
      isRecurring: false,
      recurringFrequency: "monthly",
      date: "2026-06-02",
      notes: "",
    });

    expect(validation.isValid).toBe(false);
    expect(validation.errors.amount).toBe("Please enter a valid amount greater than 0");
  });

  test("required fields show validation errors", () => {
    const validation = expenseFormService.validateDraft({
      merchant: "",
      description: "",
      amount: "12",
      category: "",
      accountSource: "acct-1",
      paymentMethod: "debit_card",
      isRecurring: false,
      recurringFrequency: "monthly",
      date: "",
      notes: "",
    });

    expect(validation.isValid).toBe(false);
    expect(validation.errors.category).toBe("Category is required");
    expect(validation.errors.date).toBe("A valid calendar date (YYYY-MM-DD) is required");
  });
});
