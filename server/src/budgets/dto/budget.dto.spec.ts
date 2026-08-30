import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { CreateBudgetDto } from "./create-budget.dto";
import { UpdateBudgetDto } from "./update-budget.dto";

describe("Budget DTOs", () => {
  it("accepts all supported budget periods", async () => {
    const dto = plainToInstance(CreateBudgetDto, {
      category: "travel",
      limitAmountMinor: 40000,
      currency: "EUR",
      period: "monthly",
      periodKey: "2026-08",
    });
    const dailyDto = plainToInstance(CreateBudgetDto, {
      category: "travel",
      limitAmountMinor: 2500,
      currency: "EUR",
      period: "daily",
      periodKey: "2026-08-30",
    });
    const weeklyDto = plainToInstance(CreateBudgetDto, {
      category: "travel",
      limitAmountMinor: 12000,
      currency: "EUR",
      period: "weekly",
      periodKey: "2026-W35",
    });
    const annualDto = plainToInstance(CreateBudgetDto, {
      category: "travel",
      limitAmountMinor: 150000,
      currency: "EUR",
      period: "annual",
      periodKey: "2026",
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
    await expect(validate(dailyDto)).resolves.toHaveLength(0);
    await expect(validate(weeklyDto)).resolves.toHaveLength(0);
    await expect(validate(annualDto)).resolves.toHaveLength(0);
  });

  it("rejects non-positive amounts, unsupported currency, and invalid period keys", async () => {
    const errors = await validate(
      plainToInstance(CreateBudgetDto, {
        category: "travel",
        limitAmountMinor: 0,
        currency: "GBP",
        period: "quarterly",
        periodKey: "2026-13",
      }),
    );

    expect(errors.map((error) => error.property)).toEqual(
      expect.arrayContaining(["limitAmountMinor", "currency", "period", "periodKey"]),
    );
  });

  it("validates only provided update fields", async () => {
    const dto = plainToInstance(UpdateBudgetDto, {
      limitAmountMinor: 45000,
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
  });
});
