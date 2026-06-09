import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { CurrencyCode } from "./enums.dto";
import { MoneyDto } from "./money.dto";

describe("MoneyDto", () => {
  it("accepts integer minor units and a supported currency", async () => {
    const dto = plainToInstance(MoneyDto, {
      amountMinor: 1250,
      currency: CurrencyCode.EUR,
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it("rejects floating-point and NaN amounts", async () => {
    const floatingPointErrors = await validate(
      plainToInstance(MoneyDto, {
        amountMinor: 12.5,
        currency: CurrencyCode.GBP,
      }),
    );
    const nanErrors = await validate(
      plainToInstance(MoneyDto, {
        amountMinor: Number.NaN,
        currency: CurrencyCode.USD,
      }),
    );

    expect(floatingPointErrors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ property: "amountMinor" }),
      ]),
    );
    expect(nanErrors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ property: "amountMinor" }),
      ]),
    );
  });

  it("rejects unsupported currencies", async () => {
    const errors = await validate(
      plainToInstance(MoneyDto, {
        amountMinor: 1250,
        currency: "CAD",
      }),
    );

    expect(errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ property: "currency" }),
      ]),
    );
  });
});
