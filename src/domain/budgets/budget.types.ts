export type BudgetCategory = string;

export interface Budget {
  id: string;
  category: BudgetCategory;
  limitAmount: number;
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
}
