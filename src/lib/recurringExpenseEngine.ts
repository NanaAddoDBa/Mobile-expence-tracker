import { Expense, RecurringFrequency } from "../domain/expenses/expense.types";
import { addMonths, getTodayDateString } from "./dateUtils";

export interface ForecastedExpense {
  id: string; // e.g., forecast-originalId-YYYY-MM-DD
  originalId: string;
  merchant: string;
  category: string;
  amount: number;
  date: string; // forecasted date YYYY-MM-DD
  frequency: RecurringFrequency;
  status: "upcoming" | "due-today" | "overdue";
}

/**
 * Generates future planning/forecast occurrences of recurring expenses
 * from the reference date up to a specific number of days.
 */
export function generateForecastedExpenses(
  expenses: Expense[],
  daysToForecast: number = 30,
  referenceDateStr: string = getTodayDateString()
): ForecastedExpense[] {
  const referenceDate = new Date(referenceDateStr);
  const endDate = new Date(referenceDate.getTime() + daysToForecast * 24 * 60 * 60 * 1000);

  const forecasts: ForecastedExpense[] = [];
  const recurringExpenses = expenses.filter((e) => e.isRecurring && e.recurringFrequency);

  for (const exp of recurringExpenses) {
    const freq = exp.recurringFrequency!;
    const startDate = new Date(exp.date);

    // If starting date is beyond the horizon, skip
    if (startDate > endDate) continue;

    const currentOccurrenceDate = new Date(startDate.getTime());

    // Advance occurrence until we are in the forecast window (after startDate)
    // We want to generate forecasted occurrences in the future.
    let safetyCounter = 0;
    while (safetyCounter < 50) {
      safetyCounter++;
      // Increment based on recurrence
      switch (freq) {
        case "daily":
          currentOccurrenceDate.setDate(currentOccurrenceDate.getDate() + 1);
          break;
        case "weekly":
          currentOccurrenceDate.setDate(currentOccurrenceDate.getDate() + 7);
          break;
        case "bi-weekly":
          currentOccurrenceDate.setDate(currentOccurrenceDate.getDate() + 14);
          break;
        case "monthly":
          currentOccurrenceDate.setTime(addMonths(currentOccurrenceDate, 1).getTime());
          break;
        case "yearly":
          currentOccurrenceDate.setFullYear(currentOccurrenceDate.getFullYear() + 1);
          break;
      }

      if (currentOccurrenceDate > endDate) {
        break;
      }

      // We only forecast occurrences that happen ON or AFTER the reference date
      if (currentOccurrenceDate >= referenceDate) {
        const dateStr = getTodayDateString(currentOccurrenceDate);

        // Status calculation based on difference from reference date
        const timeDiff = currentOccurrenceDate.getTime() - referenceDate.getTime();
        const diffDays = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

        let status: "upcoming" | "due-today" | "overdue" = "upcoming";
        if (diffDays === 0) {
          status = "due-today";
        } else if (diffDays < 0) {
          status = "overdue";
        }

        forecasts.push({
          id: `forecast-${exp.id}-${dateStr}`,
          originalId: exp.id,
          merchant: exp.merchant,
          category: exp.category,
          amount: exp.amount,
          date: dateStr,
          frequency: freq,
          status,
        });
      }
    }
  }

  // Sort by date ascending
  return forecasts.sort((a, b) => a.date.localeCompare(b.date));
}
