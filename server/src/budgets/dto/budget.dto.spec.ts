import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { CreateBudgetDto } from "./create-budget.dto";
import { UpdateBudgetDto } from "./update-budget.dto";

describe("Budget DTOs", () => {
  it("accepts a valid monthly travel budget", async () => {
    const dto = plainToInstance(CreateBudgetDto, {
      category: "travel",
      limitAmountMinor: 40000,
      currency: "EUR",
      monthKey: "2026-08",
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it("rejects non-positive amounts, unsupported currency, and invalid month keys", async () => {
    const errors = await validate(
      plainToInstance(CreateBudgetDto, {
        category: "travel",
        limitAmountMinor: 0,
        currency: "GBP",
        monthKey: "2026-13",
      }),
    );

    expect(errors.map((error) => error.property)).toEqual(
      expect.arrayContaining(["limitAmountMinor", "currency", "monthKey"]),
    );
  });

  it("validates only provided update fields", async () => {
    const dto = plainToInstance(UpdateBudgetDto, {
      limitAmountMinor: 45000,
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
  });
});
