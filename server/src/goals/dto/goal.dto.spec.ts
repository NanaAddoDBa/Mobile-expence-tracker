import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { CreateGoalDto } from "./create-goal.dto";
import { UpdateGoalDto } from "./update-goal.dto";

describe("Goal DTOs", () => {
  it("accepts a valid savings goal", async () => {
    const dto = plainToInstance(CreateGoalDto, {
      name: "Emergency fund",
      targetAmountMinor: 300000,
      currentAmountMinor: 50000,
      currency: "EUR",
      targetDate: "2026-12-31",
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it("rejects invalid amounts, unsupported currency, and invalid dates", async () => {
    const errors = await validate(
      plainToInstance(CreateGoalDto, {
        name: "",
        targetAmountMinor: 0,
        currentAmountMinor: -1,
        currency: "GBP",
        targetDate: "not-a-date",
      }),
    );

    expect(errors.map((error) => error.property)).toEqual(
      expect.arrayContaining([
        "name",
        "targetAmountMinor",
        "currentAmountMinor",
        "currency",
        "targetDate",
      ]),
    );
  });

  it("validates only provided update fields", async () => {
    const dto = plainToInstance(UpdateGoalDto, {
      currentAmountMinor: 75000,
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
  });
});
