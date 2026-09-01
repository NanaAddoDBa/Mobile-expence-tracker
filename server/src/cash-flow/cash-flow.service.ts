import { BadRequestException, Injectable } from "@nestjs/common";
import {
  CurrencyCode,
  ExpenseCategory,
  IncomeCategory,
} from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CashFlowQueryDto } from "./dto/cash-flow-query.dto";

export interface CashFlowSummary {
  currency: CurrencyCode;
  periodStart: string;
  periodEnd: string;
  inflowMinor: number;
  outflowMinor: number;
  netCashFlowMinor: number;
  transferInMinor: number;
  transferOutMinor: number;
  savingsRatePercentage: number | null;
  incomeCount: number;
  expenseCount: number;
}

@Injectable()
export class CashFlowService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(
    userId: string,
    query: CashFlowQueryDto,
  ): Promise<CashFlowSummary> {
    const period = this.resolvePeriod(query);
    const date = {
      gte: parseDateOnly(period.periodStart),
      lte: endOfDateOnly(period.periodEnd),
    };

    const [income, expenses, transferIn, transferOut] = await Promise.all([
      this.prisma.income.aggregate({
        where: {
          userId,
          currency: CurrencyCode.EUR,
          date,
          category: { not: IncomeCategory.TRANSFERS },
        },
        _sum: { amountMinor: true },
        _count: { _all: true },
      }),
      this.prisma.expense.aggregate({
        where: {
          userId,
          currency: CurrencyCode.EUR,
          date,
          category: { not: ExpenseCategory.TRANSFERS },
        },
        _sum: { amountMinor: true },
        _count: { _all: true },
      }),
      this.prisma.income.aggregate({
        where: {
          userId,
          currency: CurrencyCode.EUR,
          date,
          category: IncomeCategory.TRANSFERS,
        },
        _sum: { amountMinor: true },
      }),
      this.prisma.expense.aggregate({
        where: {
          userId,
          currency: CurrencyCode.EUR,
          date,
          category: ExpenseCategory.TRANSFERS,
        },
        _sum: { amountMinor: true },
      }),
    ]);

    const inflowMinor = income._sum.amountMinor ?? 0;
    const outflowMinor = expenses._sum.amountMinor ?? 0;
    const netCashFlowMinor = inflowMinor - outflowMinor;

    return {
      currency: CurrencyCode.EUR,
      periodStart: period.periodStart,
      periodEnd: period.periodEnd,
      inflowMinor,
      outflowMinor,
      netCashFlowMinor,
      transferInMinor: transferIn._sum.amountMinor ?? 0,
      transferOutMinor: transferOut._sum.amountMinor ?? 0,
      savingsRatePercentage:
        inflowMinor === 0
          ? null
          : Math.round((netCashFlowMinor / inflowMinor) * 1000) / 10,
      incomeCount: income._count._all,
      expenseCount: expenses._count._all,
    };
  }

  private resolvePeriod(query: CashFlowQueryDto): {
    periodStart: string;
    periodEnd: string;
  } {
    const now = new Date();
    const defaultStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
    );
    const defaultEnd = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0),
    );
    const periodStart = query.from ?? formatDateOnly(defaultStart);
    const periodEnd = query.to ?? formatDateOnly(defaultEnd);

    if (periodStart > periodEnd) {
      throw new BadRequestException("The start date must be on or before the end date");
    }

    return { periodStart, periodEnd };
  }
}

function parseDateOnly(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

function endOfDateOnly(value: string): Date {
  return new Date(`${value}T23:59:59.999Z`);
}

function formatDateOnly(value: Date): string {
  return value.toISOString().slice(0, 10);
}
