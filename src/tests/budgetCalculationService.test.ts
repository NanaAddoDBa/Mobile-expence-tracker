import { describe, test, expect } from "vitest";
import { budgetCalculationService } from "../features/budgets/services/budgetCalculationService";
import { Expense } from "../domain/expenses/expense.types";
import { Budget } from "../domain/budgets/budget.types";

const mockBudgets: Budget[] = [
  {
    id: "b1",
    category: "Dining & Cafe",
    limitAmount: 100,
    period: "monthly",
    periodKey: "2026-06",
  },
];

const mockExpenses: Expense[] = [
  {
    id: "e1",
    merchant: "Starbucks",
    description: "cappuccino with croissant",
    amount: 15,
    date: "2026-06-01",
    category: "Dining & Cafe",
    accountSource: "a1",
    paymentMethod: "digital_wallet",
    isRecurring: false,
  },
  {
    id: "e2",
    merchant: "Nando's",
    description: "family deal lunch pack",
    amount: 70,
    date: "2026-06-02",
    category: "Dining & Cafe",
    accountSource: "a1",
    paymentMethod: "digital_wallet",
    isRecurring: false,
  },
];

describe("budgetCalculationService", () => {
  test("calculates safe status and only includes current-month expenses", () => {
    const usage = budgetCalculationService.getUsageDetails(
      [
        ...mockExpenses,
        {
          id: "e-old",
          merchant: "Old Cafe",
          description: "Prior month",
          amount: 90,
          date: "2026-05-29",
          category: "Dining & Cafe",
          accountSource: "a1",
          paymentMethod: "digital_wallet",
          isRecurring: false,
        },
      ],
      [{
        id: "b1",
        category: "Dining & Cafe",
        limitAmount: 200,
        period: "monthly",
        periodKey: "2026-06",
      }],
      "2026-06"
    );

    expect(usage[0].spentAmount).toBe(85);
    expect(usage[0].remainingAmount).toBe(115);
    expect(usage[0].percentageUsed).toBe(42.5);
    expect(usage[0].status).toBe("Safe");
  });

  test("calculates category totals and warning status (85% used)", () => {
    const usage = budgetCalculationService.getUsageDetails(mockExpenses, mockBudgets, "2026-06");
    expect(usage).toHaveLength(1);
    expect(usage[0].spentAmount).toBe(85);
    expect(usage[0].remainingAmount).toBe(15);
    expect(usage[0].percentageUsed).toBe(85);
    expect(usage[0].status).toBe("Warning");
  });

  test("calculates over budget status (110% used) when another expense added", () => {
    const overExpenses: Expense[] = [
      ...mockExpenses,
      {
        id: "e3",
        merchant: "Cafe Nero",
        description: "Matcha latte glass",
        amount: 25,
        date: "2026-06-03",
        category: "Dining & Cafe",
        accountSource: "a1",
        paymentMethod: "digital_wallet",
        isRecurring: false,
      },
    ];
    const usage = budgetCalculationService.getUsageDetails(overExpenses, mockBudgets, "2026-06");
    expect(usage[0].status).toBe("Over Budget");
    expect(usage[0].spentAmount).toBe(110);
  });

  test("calculates an overall budget summary", () => {
    const summary = budgetCalculationService.calculateOverallBudgetSummary(
      mockExpenses,
      mockBudgets,
      "2026-06"
    );

    expect(summary.totalLimitAmount).toBe(100);
    expect(summary.totalSpentAmount).toBe(85);
    expect(summary.totalRemainingAmount).toBe(15);
    expect(summary.percentageUsed).toBe(85);
    expect(summary.warningCount).toBe(1);
  });

  test("calculates daily usage from only the selected date", () => {
    const dailyBudget: Budget = {
      id: "daily-1",
      category: "Dining & Cafe",
      limitAmount: 20,
      period: "daily",
      periodKey: "2026-06-01",
    };

    const usage = budgetCalculationService.getBudgetUsageForPeriod(
      mockExpenses,
      [...mockBudgets, dailyBudget],
      "daily",
      "2026-06-01",
    );

    expect(usage).toHaveLength(1);
    expect(usage[0]).toMatchObject({
      spentAmount: 15,
      remainingAmount: 5,
      percentageUsed: 75,
      period: "daily",
      periodKey: "2026-06-01",
    });
  });

  test("calculates weekly usage from only the selected ISO week", () => {
    const weeklyBudget: Budget = {
      id: "weekly-1",
      category: "Dining & Cafe",
      limitAmount: 100,
      period: "weekly",
      periodKey: "2026-W23",
    };
    const usage = budgetCalculationService.getBudgetUsageForPeriod(
      [
        ...mockExpenses,
        {
          ...mockExpenses[0],
          id: "previous-week",
          date: "2026-05-31",
          amount: 50,
        },
      ],
      [weeklyBudget],
      "weekly",
      "2026-W23",
    );

    expect(usage[0]).toMatchObject({
      spentAmount: 85,
      period: "weekly",
      periodKey: "2026-W23",
    });
  });

  test("calculates annual usage from only the selected calendar year", () => {
    const annualBudget: Budget = {
      id: "annual-1",
      category: "Dining & Cafe",
      limitAmount: 1000,
      period: "annual",
      periodKey: "2026",
    };
    const usage = budgetCalculationService.getBudgetUsageForPeriod(
      [
        ...mockExpenses,
        {
          ...mockExpenses[0],
          id: "previous-year",
          date: "2025-12-31",
          amount: 500,
        },
      ],
      [annualBudget],
      "annual",
      "2026",
    );

    expect(usage[0]).toMatchObject({
      spentAmount: 85,
      period: "annual",
      periodKey: "2026",
    });
  });
});
