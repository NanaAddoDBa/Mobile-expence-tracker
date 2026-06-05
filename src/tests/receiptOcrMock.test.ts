import { afterEach, describe, expect, test, vi } from "vitest";
import { simulateReceiptOcr } from "../lib/receiptOcrMock";

describe("receiptOcrMock", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  test("uses the current date utility for mock scan dates", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2025, 3, 12, 10));

    const scanPromise = simulateReceiptOcr(new File(["receipt"], "starbucks-receipt.png"));
    await vi.advanceTimersByTimeAsync(1400);

    await expect(scanPromise).resolves.toMatchObject({
      merchant: "Starbucks Coffee",
      date: "2025-04-12",
    });
  });
});
