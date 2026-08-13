import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { CreateExpenseDto } from "./create-expense.dto";
import { UpdateExpenseDto } from "./update-expense.dto";

describe("Expense DTOs", () => {
  it("accepts a valid manual recurring expense", async () => {
    const dto = plainToInstance(CreateExpenseDto, {
      merchant: "Corner Market",
      description: "Weekly groceries",
      amountMinor: 2475,
      currency: "EUR",
      date: "2026-06-02",
      category: "groceries",
      paymentMethod: "debit_card",
      isRecurring: true,
      recurringFrequency: "weekly",
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it("rejects non-positive amounts and unsupported currencies", async () => {
    const errors = await validate(
      plainToInstance(CreateExpenseDto, {
        merchant: "Corner Market",
        amountMinor: 0,
        currency: "GBP",
        date: "2026-06-02",
        category: "groceries",
        paymentMethod: "debit_card",
      }),
    );

    expect(errors.map((error) => error.property)).toEqual(
      expect.arrayContaining(["amountMinor", "currency"]),
    );
  });

  it("validates only provided update fields", async () => {
    const dto = plainToInstance(UpdateExpenseDto, {
      amountMinor: 3500,
      notes: "Updated note",
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
  });
});
