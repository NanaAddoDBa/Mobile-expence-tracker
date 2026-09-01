import { BadRequestException } from "@nestjs/common";
import { CurrencyCode } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CashFlowService } from "./cash-flow.service";

describe("CashFlowService", () => {
  function createService(amounts = [300000, 120000, 5000, 5000]) {
    const prisma = {
      income: {
        aggregate: jest
          .fn()
          .mockResolvedValueOnce({
            _sum: { amountMinor: amounts[0] },
            _count: { _all: 2 },
          })
          .mockResolvedValueOnce({ _sum: { amountMinor: amounts[2] } }),
      },
      expense: {
        aggregate: jest
          .fn()
          .mockResolvedValueOnce({
            _sum: { amountMinor: amounts[1] },
            _count: { _all: 4 },
          })
          .mockResolvedValueOnce({ _sum: { amountMinor: amounts[3] } }),
      },
    } as unknown as PrismaService;

    return { prisma, service: new CashFlowService(prisma) };
  }

  it("calculates net cash flow and savings rate without transfers", async () => {
    const { prisma, service } = createService();

    await expect(
      service.getSummary("user-1", {
        from: "2026-08-01",
        to: "2026-08-31",
      }),
    ).resolves.toMatchObject({
      inflowMinor: 300000,
      outflowMinor: 120000,
      netCashFlowMinor: 180000,
      transferInMinor: 5000,
      transferOutMinor: 5000,
      savingsRatePercentage: 60,
      incomeCount: 2,
      expenseCount: 4,
    });
    expect(prisma.income.aggregate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: "user-1",
          currency: CurrencyCode.EUR,
        }),
      }),
    );
    expect(prisma.expense.aggregate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: "user-1",
          currency: CurrencyCode.EUR,
        }),
      }),
    );
  });

  it("returns an unavailable savings rate when there is no income", async () => {
    const { service } = createService([0, 5000, 0, 0]);

    await expect(
      service.getSummary("user-1", {
        from: "2026-08-01",
        to: "2026-08-31",
      }),
    ).resolves.toMatchObject({
      netCashFlowMinor: -5000,
      savingsRatePercentage: null,
    });
  });

  it("rejects a reversed date range", async () => {
    const { service } = createService();

    await expect(
      service.getSummary("user-1", {
        from: "2026-09-01",
        to: "2026-08-31",
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
