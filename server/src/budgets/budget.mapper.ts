import {
  Budget,
  BudgetPeriod as PrismaBudgetPeriod,
  CurrencyCode as PrismaCurrencyCode,
  ExpenseCategory as PrismaExpenseCategory,
  Prisma,
} from "@prisma/client";
import {
  BudgetPeriod,
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
  period: BudgetPeriod;
  periodKey: string;
  createdAt: Date;
  updatedAt: Date;
}

const periodToPrisma: Record<BudgetPeriod, PrismaBudgetPeriod> = {
  [BudgetPeriod.DAILY]: PrismaBudgetPeriod.DAILY,
  [BudgetPeriod.WEEKLY]: PrismaBudgetPeriod.WEEKLY,
  [BudgetPeriod.MONTHLY]: PrismaBudgetPeriod.MONTHLY,
  [BudgetPeriod.ANNUAL]: PrismaBudgetPeriod.ANNUAL,
};

const periodFromPrisma: Record<PrismaBudgetPeriod, BudgetPeriod> = {
  [PrismaBudgetPeriod.DAILY]: BudgetPeriod.DAILY,
  [PrismaBudgetPeriod.WEEKLY]: BudgetPeriod.WEEKLY,
  [PrismaBudgetPeriod.MONTHLY]: BudgetPeriod.MONTHLY,
  [PrismaBudgetPeriod.ANNUAL]: BudgetPeriod.ANNUAL,
};

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
    period: periodFromPrisma[budget.period],
    periodKey: budget.periodKey,
    createdAt: budget.createdAt,
    updatedAt: budget.updatedAt,
  };
}

export function toBudgetCreateInput(
  userId: string,
  input: CreateBudgetDto,
  period: BudgetPeriod,
  periodKey: string,
): Prisma.BudgetUncheckedCreateInput {
  return {
    userId,
    category: categoryToPrisma[input.category],
    limitAmountMinor: input.limitAmountMinor,
    currency: PrismaCurrencyCode.EUR,
    period: periodToPrisma[period],
    periodKey,
  };
}

export function toBudgetUpdateInput(
  input: UpdateBudgetDto,
  period: BudgetPeriod,
  periodKey: string,
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

  data.period = periodToPrisma[period];
  data.periodKey = periodKey;

  return data;
}

export function toPrismaBudgetCategory(
  category: ExpenseCategory,
): PrismaExpenseCategory {
  return categoryToPrisma[category];
}

export function toPrismaBudgetPeriod(
  period: BudgetPeriod,
): PrismaBudgetPeriod {
  return periodToPrisma[period];
}

export function fromPrismaBudgetPeriod(
  period: PrismaBudgetPeriod,
): BudgetPeriod {
  return periodFromPrisma[period];
}
