import { describe, test, expect } from "vitest";
import { formatCurrency } from "../lib/formatCurrency";

describe("formatCurrency helper", () => {
  test("formats currency correctly", () => {
    // en-IE uses €
    const res = formatCurrency(1234.56, "EUR");
    expect(res).toContain("1,234.56");
    expect(res).toContain("€");
  });

  test("uses fallback value gracefully", () => {
    const res = formatCurrency(50, "XYZ");
    expect(res).toContain("XYZ");
    expect(res).toContain("50.00");
  });
});
