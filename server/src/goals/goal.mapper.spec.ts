import {
  CurrencyCode,
  Goal,
  GoalStatus,
} from "@prisma/client";
import {
  CurrencyCode as ApiCurrencyCode,
  GoalStatus as ApiGoalStatus,
} from "../common/validation/enums.dto";
import {
  getProgressStatus,
  toGoalCreateInput,
  toGoalResponse,
  toGoalUpdateInput,
} from "./goal.mapper";

describe("goal mapper", () => {
  const storedGoal: Goal = {
    id: "goal-1",
    userId: "user-1",
    name: "Emergency fund",
    targetAmountMinor: 300000,
    currentAmountMinor: 50000,
    currency: CurrencyCode.EUR,
    targetDate: new Date("2026-12-31T00:00:00.000Z"),
    status: GoalStatus.ACTIVE,
    createdAt: new Date("2026-08-01T10:00:00.000Z"),
    updatedAt: new Date("2026-08-01T10:00:00.000Z"),
  };

  it("maps stored Prisma values to API values", () => {
    expect(toGoalResponse(storedGoal)).toMatchObject({
      id: "goal-1",
      name: "Emergency fund",
      targetAmountMinor: 300000,
      currentAmountMinor: 50000,
      currency: "EUR",
      targetDate: "2026-12-31",
      status: "active",
    });
  });

  it("maps create input to user-owned Prisma data", () => {
    expect(
      toGoalCreateInput("user-1", {
        name: " Emergency fund ",
        targetAmountMinor: 300000,
        currentAmountMinor: 50000,
        currency: ApiCurrencyCode.EUR,
        targetDate: "2026-12-31",
      }),
    ).toMatchObject({
      userId: "user-1",
      name: "Emergency fund",
      targetAmountMinor: 300000,
      currentAmountMinor: 50000,
      currency: CurrencyCode.EUR,
      targetDate: new Date("2026-12-31T00:00:00.000Z"),
      status: GoalStatus.ACTIVE,
    });
  });

  it("maps provided status and auto-completed progress", () => {
    expect(
      toGoalUpdateInput({
        status: ApiGoalStatus.PAUSED,
      }),
    ).toEqual({
      status: GoalStatus.PAUSED,
    });

    expect(getProgressStatus(10000, 10000)).toBe(GoalStatus.COMPLETED);
  });
});
