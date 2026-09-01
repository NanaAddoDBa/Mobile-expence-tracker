export type BudgetCategory = string;
export type BudgetPeriod = "daily" | "weekly" | "monthly" | "annual";

export interface Budget {
  id: string;
  category: BudgetCategory;
  limitAmount: number;
  currency?: "EUR";
  period: BudgetPeriod;
  periodKey: string;
}

export type CreateBudgetModel = Omit<Budget, "id">;
export type UpdateBudgetModel = Partial<CreateBudgetModel>;

export type BudgetStatus = "Safe" | "Warning" | "Over Budget";

export interface BudgetStatusDetail {
  category: string;
  limitAmount: number;
  spentAmount: number;
  remainingAmount: number;
  percentageUsed: number;
  status: BudgetStatus;
  period: BudgetPeriod;
  periodKey: string;
}
