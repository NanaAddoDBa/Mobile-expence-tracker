import type { IncomeCategory } from "./income.types";

export const INCOME_CATEGORY_OPTIONS = [
  "Salary",
  "Freelance",
  "Business",
  "Investment",
  "Benefits",
  "Gift",
  "Refund",
  "Reimbursement",
  "Transfers",
  "Other",
] as const satisfies readonly IncomeCategory[];

export function toApiIncomeCategory(category: IncomeCategory): string {
  return category.toLowerCase();
}

export function toFrontendIncomeCategory(value: string): IncomeCategory {
  const category = INCOME_CATEGORY_OPTIONS.find(
    (option) => option.toLowerCase() === value.trim().toLowerCase(),
  );
  return category ?? "Other";
}
