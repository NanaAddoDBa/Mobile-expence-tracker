import { Budget } from "../domain/budgets/budget.types";

export type SampleBudgetTemplate = Omit<Budget, "periodKey">;

export const INITIAL_BUDGETS: SampleBudgetTemplate[] = [
  { id: "b-1", category: "Food & Grocery", limitAmount: 350.00, period: "monthly" },
  { id: "b-2", category: "Dining & Cafe", limitAmount: 180.00, period: "monthly" },
  { id: "b-3", category: "Transport & Auto", limitAmount: 250.00, period: "monthly" },
  { id: "b-4", category: "Housing & Utilities", limitAmount: 1350.00, period: "monthly" },
  { id: "b-5", category: "Entertainment & Leisure", limitAmount: 120.00, period: "monthly" },
  { id: "b-6", category: "Shopping", limitAmount: 200.00, period: "monthly" },
  { id: "b-7", category: "Healthcare", limitAmount: 80.00, period: "monthly" },
  { id: "b-8", category: "Travel & Holiday", limitAmount: 400.00, period: "monthly" },
  { id: "b-9", category: "Education & Kids", limitAmount: 100.00, period: "monthly" },
  { id: "b-10", category: "Others", limitAmount: 100.00, period: "monthly" },
];
