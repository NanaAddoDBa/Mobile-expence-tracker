import { Expense } from "../../../domain/expenses/expense.types";
import { normalizePaymentMethod } from "../../../domain/expenses/expense.constants";
import { isSameMonth } from "../../../lib/dateUtils";

export interface ExpenseFilterOptions {
  query: string;
  category: string;
  paymentMethod: string;
  month: string;
  recurrence: string;
  accountSource: string;
  sortBy?: "date-desc" | "date-asc" | "amount-desc" | "amount-asc";
}

export const expenseFilterService = {
  filter(expenses: Expense[], options: Partial<ExpenseFilterOptions>): Expense[] {
    const query = (options.query || "").toLowerCase().trim();
    const category = options.category || "";
    const paymentMethod = options.paymentMethod || "";
    const month = options.month || "";
    const recurrence = options.recurrence || "";
    const accountSource = options.accountSource || "";
    const sortBy = options.sortBy;

    let result = [...expenses];

    if (query) {
      result = result.filter(
        (exp) =>
          exp.merchant.toLowerCase().includes(query) ||
          exp.category.toLowerCase().includes(query) ||
          exp.description.toLowerCase().includes(query) ||
          (exp.notes && exp.notes.toLowerCase().includes(query))
      );
    }

    if (category && !isAllFilter(category)) {
      result = result.filter((exp) => exp.category.toLowerCase() === category.toLowerCase());
    }

    if (paymentMethod && !isAllFilter(paymentMethod)) {
      const normalizedPaymentMethod = normalizePaymentMethod(paymentMethod);
      result = result.filter(
        (exp) => normalizePaymentMethod(exp.paymentMethod) === normalizedPaymentMethod
      );
    }

    if (month && !isAllFilter(month)) {
      result = result.filter((exp) => exp.date && isSameMonth(exp.date, month));
    }

    if (recurrence && !isAllFilter(recurrence)) {
      result = result.filter((exp) => {
        if (recurrence === "Recurring") {
          return exp.isRecurring;
        }
        if (recurrence === "Non-recurring") {
          return !exp.isRecurring;
        }
        return true;
      });
    }

    if (accountSource && !isAllFilter(accountSource)) {
      result = result.filter((exp) => exp.accountSource === accountSource);
    }

    if (sortBy) {
      result.sort((a, b) => {
        if (sortBy === "date-desc") {
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        }
        if (sortBy === "date-asc") {
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        }
        if (sortBy === "amount-desc") {
          return b.amount - a.amount;
        }
        if (sortBy === "amount-asc") {
          return a.amount - b.amount;
        }
        return 0;
      });
    }

    return result;
  },
};

function isAllFilter(value: string): boolean {
  return value.toLowerCase() === "all";
}
