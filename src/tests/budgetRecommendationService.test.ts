import { describe, test, expect } from "vitest";
import { budgetRecommendationService } from "../features/budgets/services/budgetRecommendationService";
import { Expense } from "../domain/expenses/expense.types";
import { Budget } from "../domain/budgets/budget.types";

describe("budgetRecommendationService insights rules", () => {
  test("suggests custom insights for high spending", () => {
    const budgets: Budget[] = [{
      id: "b1",
      category: "Dining & Cafe",
      limitAmount: 50,
      period: "monthly",
      periodKey: "2026-06",
    }];
    const expenses: Expense[] = [
      {
        id: "e1",
        merchant: "Resto",
        description: "Dinner out",
        amount: 45,
        date: "2026-06-02",
        category: "Dining & Cafe",
        accountSource: "acct-1",
        paymentMethod: "credit_card",
        isRecurring: false,
      },
    ];

    const recs = budgetRecommendationService.getRecommendations(expenses, budgets, "2026-06");
    expect(recs.some((r) => r.includes("dining and cafe"))).toBe(true);
  });
});
