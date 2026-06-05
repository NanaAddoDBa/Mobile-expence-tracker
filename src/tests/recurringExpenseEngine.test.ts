import { afterEach, describe, expect, test, vi } from "vitest";
import { Expense } from "../domain/expenses/expense.types";
import { generateForecastedExpenses } from "../lib/recurringExpenseEngine";

const recurringExpense: Expense = {
  id: "expense-1",
  merchant: "Gym",
  description: "Membership",
  amount: 35,
  date: "2025-08-01",
  category: "Healthcare",
  accountSource: "acct-1",
  paymentMethod: "debit_card",
  isRecurring: true,
  recurringFrequency: "daily",
};

describe("recurringExpenseEngine", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  test("uses the current date utility when no reference date is provided", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2025, 7, 2, 12));

    const forecasts = generateForecastedExpenses([recurringExpense], 1);

    expect(forecasts[0]).toMatchObject({
      date: "2025-08-02",
      status: "due-today",
    });
  });

  test("uses an injected reference date for deterministic forecasts", () => {
    const forecasts = generateForecastedExpenses(
      [
        {
          ...recurringExpense,
          date: "2025-07-10",
          recurringFrequency: "monthly",
        },
      ],
      31,
      "2025-08-09"
    );

    expect(forecasts[0]).toMatchObject({
      date: "2025-08-10",
      status: "upcoming",
    });
  });
});
