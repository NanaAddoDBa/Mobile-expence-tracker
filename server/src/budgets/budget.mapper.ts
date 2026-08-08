import {
  Budget,
  CurrencyCode as PrismaCurrencyCode,
  ExpenseCategory as PrismaExpenseCategory,
  Prisma,
} from "@prisma/client";
import {
  CurrencyCode,
  ExpenseCategory,
} from "../common/validation/enums.dto";
import { CreateBudgetDto } from "./dto/create-budget.dto";
import { UpdateBudgetDto } from "./dto/update-budget.dto";

export interface BudgetResponse {
  id: string;
  category: ExpenseCategory;
  limitAmountMinor: number;
  currency: CurrencyCode;
  monthKey: string;
  createdAt: Date;
  updatedAt: Date;
}

const categoryToPrisma: Record<ExpenseCategory, PrismaExpenseCategory> = {
  [ExpenseCategory.HOUSING]: PrismaExpenseCategory.HOUSING,
  [ExpenseCategory.GROCERIES]: PrismaExpenseCategory.GROCERIES,
  [ExpenseCategory.TRANSPORT]: PrismaExpenseCategory.TRANSPORT,
  [ExpenseCategory.UTILITIES]: PrismaExpenseCategory.UTILITIES,
  [ExpenseCategory.DINING]: PrismaExpenseCategory.DINING,
  [ExpenseCategory.ENTERTAINMENT]: PrismaExpenseCategory.ENTERTAINMENT,
  [ExpenseCategory.HEALTH]: PrismaExpenseCategory.HEALTH,
  [ExpenseCategory.SHOPPING]: PrismaExpenseCategory.SHOPPING,
  [ExpenseCategory.EDUCATION]: PrismaExpenseCategory.EDUCATION,
  [ExpenseCategory.SUBSCRIPTIONS]: PrismaExpenseCategory.SUBSCRIPTIONS,
  [ExpenseCategory.TRANSFERS]: PrismaExpenseCategory.TRANSFERS,
  [ExpenseCategory.TRAVEL]: PrismaExpenseCategory.TRAVEL,
  [ExpenseCategory.OTHER]: PrismaExpenseCategory.OTHER,
};

const categoryFromPrisma: Record<PrismaExpenseCategory, ExpenseCategory> = {
  [PrismaExpenseCategory.HOUSING]: ExpenseCategory.HOUSING,
  [PrismaExpenseCategory.GROCERIES]: ExpenseCategory.GROCERIES,
  [PrismaExpenseCategory.TRANSPORT]: ExpenseCategory.TRANSPORT,
  [PrismaExpenseCategory.UTILITIES]: ExpenseCategory.UTILITIES,
  [PrismaExpenseCategory.DINING]: ExpenseCategory.DINING,
  [PrismaExpenseCategory.ENTERTAINMENT]: ExpenseCategory.ENTERTAINMENT,
  [PrismaExpenseCategory.HEALTH]: ExpenseCategory.HEALTH,
  [PrismaExpenseCategory.SHOPPING]: ExpenseCategory.SHOPPING,
  [PrismaExpenseCategory.EDUCATION]: ExpenseCategory.EDUCATION,
  [PrismaExpenseCategory.SUBSCRIPTIONS]: ExpenseCategory.SUBSCRIPTIONS,
  [PrismaExpenseCategory.TRANSFERS]: ExpenseCategory.TRANSFERS,
  [PrismaExpenseCategory.TRAVEL]: ExpenseCategory.TRAVEL,
  [PrismaExpenseCategory.OTHER]: ExpenseCategory.OTHER,
};

export function toBudgetResponse(budget: Budget): BudgetResponse {
  return {
    id: budget.id,
    category: categoryFromPrisma[budget.category],
    limitAmountMinor: budget.limitAmountMinor,
    currency: budget.currency as CurrencyCode,
    monthKey: budget.monthKey,
    createdAt: budget.createdAt,
    updatedAt: budget.updatedAt,
  };
}

export function toBudgetCreateInput(
  userId: string,
  input: CreateBudgetDto,
  monthKey: string,
): Prisma.BudgetUncheckedCreateInput {
  return {
    userId,
    category: categoryToPrisma[input.category],
    limitAmountMinor: input.limitAmountMinor,
    currency: PrismaCurrencyCode.EUR,
    monthKey,
  };
}

export function toBudgetUpdateInput(
  input: UpdateBudgetDto,
): Prisma.BudgetUncheckedUpdateInput {
  const data: Prisma.BudgetUncheckedUpdateInput = {};

  if (input.category !== undefined) {
    data.category = categoryToPrisma[input.category];
  }

  if (input.limitAmountMinor !== undefined) {
    data.limitAmountMinor = input.limitAmountMinor;
  }

  if (input.currency !== undefined) {
    data.currency = PrismaCurrencyCode.EUR;
  }

  if (input.monthKey !== undefined) {
    data.monthKey = input.monthKey;
  }

  return data;
}

export function toPrismaBudgetCategory(
  category: ExpenseCategory,
): PrismaExpenseCategory {
  return categoryToPrisma[category];
}
