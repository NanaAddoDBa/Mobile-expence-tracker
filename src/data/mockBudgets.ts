import { Budget } from "../domain/budgets/budget.types";

export const INITIAL_BUDGETS: Budget[] = [
  { id: "b-1", category: "Food & Grocery", limitAmount: 350.00 },
  { id: "b-2", category: "Dining & Cafe", limitAmount: 180.00 },
  { id: "b-3", category: "Transport & Auto", limitAmount: 250.00 },
  { id: "b-4", category: "Housing & Utilities", limitAmount: 1350.00 },
  { id: "b-5", category: "Entertainment & Leisure", limitAmount: 120.00 },
  { id: "b-6", category: "Shopping", limitAmount: 200.00 },
  { id: "b-7", category: "Healthcare", limitAmount: 80.00 },
  { id: "b-8", category: "Travel & Holiday", limitAmount: 400.00 },
  { id: "b-9", category: "Education & Kids", limitAmount: 100.00 },
  { id: "b-10", category: "Others", limitAmount: 100.00 },
];
