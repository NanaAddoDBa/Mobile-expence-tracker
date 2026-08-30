import {
  Budget,
  BudgetPeriod,
  CurrencyCode,
  ExpenseCategory,
} from "@prisma/client";
import {
  BudgetPeriod as ApiBudgetPeriod,
  CurrencyCode as ApiCurrencyCode,
  ExpenseCategory as ApiExpenseCategory,
} from "../common/validation/enums.dto";
import {
  toBudgetCreateInput,
  toBudgetResponse,
  toBudgetUpdateInput,
} from "./budget.mapper";

describe("budget mapper", () => {
  const storedBudget: Budget = {
    id: "budget-1",
    userId: "user-1",
    category: ExpenseCategory.TRAVEL,
    limitAmountMinor: 40000,
    currency: CurrencyCode.EUR,
    period: BudgetPeriod.MONTHLY,
    periodKey: "2026-08",
    createdAt: new Date("2026-08-01T10:00:00.000Z"),
    updatedAt: new Date("2026-08-01T10:00:00.000Z"),
  };

  it("maps stored Prisma values to API values", () => {
    expect(toBudgetResponse(storedBudget)).toMatchObject({
      id: "budget-1",
      category: "travel",
      limitAmountMinor: 40000,
      currency: "EUR",
      period: "monthly",
      periodKey: "2026-08",
    });
  });

  it("maps create input to user-owned Prisma data", () => {
    expect(
      toBudgetCreateInput(
        "user-1",
        {
          category: ApiExpenseCategory.TRAVEL,
          limitAmountMinor: 40000,
          currency: ApiCurrencyCode.EUR,
          period: ApiBudgetPeriod.MONTHLY,
          periodKey: "2026-08",
        },
        ApiBudgetPeriod.MONTHLY,
        "2026-08",
      ),
    ).toMatchObject({
      userId: "user-1",
      category: ExpenseCategory.TRAVEL,
      limitAmountMinor: 40000,
      currency: CurrencyCode.EUR,
      period: BudgetPeriod.MONTHLY,
      periodKey: "2026-08",
    });
  });

  it("maps only provided update fields", () => {
    expect(
      toBudgetUpdateInput({
        limitAmountMinor: 45000,
      }, ApiBudgetPeriod.MONTHLY, "2026-08"),
    ).toEqual({
      limitAmountMinor: 45000,
      period: BudgetPeriod.MONTHLY,
      periodKey: "2026-08",
    });
  });
});
