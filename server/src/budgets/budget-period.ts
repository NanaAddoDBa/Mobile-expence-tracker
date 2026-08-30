import { BadRequestException } from "@nestjs/common";
import { BudgetPeriod } from "../common/validation/enums.dto";

const MONTH_KEY_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;
const DAY_KEY_PATTERN = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
const WEEK_KEY_PATTERN = /^\d{4}-W(0[1-9]|[1-4]\d|5[0-3])$/;
const YEAR_KEY_PATTERN = /^\d{4}$/;

export function getCurrentBudgetPeriodKey(
  period: BudgetPeriod,
  referenceDate = new Date(),
): string {
  const year = referenceDate.getUTCFullYear();
  const month = String(referenceDate.getUTCMonth() + 1).padStart(2, "0");

  if (period === BudgetPeriod.DAILY) {
    const day = String(referenceDate.getUTCDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  if (period === BudgetPeriod.WEEKLY) {
    return getIsoWeekKey(referenceDate);
  }

  if (period === BudgetPeriod.ANNUAL) {
    return String(year);
  }

  return `${year}-${month}`;
}

export function inferBudgetPeriod(periodKey: string): BudgetPeriod {
  if (DAY_KEY_PATTERN.test(periodKey)) {
    return BudgetPeriod.DAILY;
  }

  if (WEEK_KEY_PATTERN.test(periodKey)) {
    return BudgetPeriod.WEEKLY;
  }

  if (MONTH_KEY_PATTERN.test(periodKey)) {
    return BudgetPeriod.MONTHLY;
  }

  if (YEAR_KEY_PATTERN.test(periodKey)) {
    return BudgetPeriod.ANNUAL;
  }

  throw new BadRequestException("Invalid budget period key");
}

export function validateBudgetPeriodKey(
  period: BudgetPeriod,
  periodKey: string,
): void {
  const validators: Record<BudgetPeriod, (key: string) => boolean> = {
    [BudgetPeriod.DAILY]: isValidDayKey,
    [BudgetPeriod.WEEKLY]: isValidWeekKey,
    [BudgetPeriod.MONTHLY]: (key) => MONTH_KEY_PATTERN.test(key),
    [BudgetPeriod.ANNUAL]: (key) => YEAR_KEY_PATTERN.test(key),
  };
  const isValid = validators[period](periodKey);

  if (!isValid) {
    const expectedFormats: Record<BudgetPeriod, string> = {
      [BudgetPeriod.DAILY]: "YYYY-MM-DD",
      [BudgetPeriod.WEEKLY]: "YYYY-Www",
      [BudgetPeriod.MONTHLY]: "YYYY-MM",
      [BudgetPeriod.ANNUAL]: "YYYY",
    };
    throw new BadRequestException(
      `${period} budget periodKey must use ${expectedFormats[period]}`,
    );
  }
}

function isValidWeekKey(periodKey: string): boolean {
  if (!WEEK_KEY_PATTERN.test(periodKey)) {
    return false;
  }

  const [yearText, weekText] = periodKey.split("-W");
  const year = Number(yearText);
  const week = Number(weekText);
  const januaryFourth = new Date(Date.UTC(year, 0, 4));
  const januaryFourthDay = januaryFourth.getUTCDay() || 7;
  const monday = new Date(januaryFourth);
  monday.setUTCDate(
    januaryFourth.getUTCDate() - januaryFourthDay + 1 + (week - 1) * 7,
  );

  return getIsoWeekKey(monday) === periodKey;
}

function getIsoWeekKey(referenceDate: Date): string {
  const date = new Date(Date.UTC(
    referenceDate.getUTCFullYear(),
    referenceDate.getUTCMonth(),
    referenceDate.getUTCDate(),
  ));
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const isoYear = date.getUTCFullYear();
  const yearStart = new Date(Date.UTC(isoYear, 0, 1));
  const week = Math.ceil(
    ((date.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7,
  );

  return `${isoYear}-W${String(week).padStart(2, "0")}`;
}

function isValidDayKey(periodKey: string): boolean {
  if (!DAY_KEY_PATTERN.test(periodKey)) {
    return false;
  }

  const parsedDate = new Date(`${periodKey}T00:00:00.000Z`);
  return !Number.isNaN(parsedDate.getTime()) &&
    parsedDate.toISOString().slice(0, 10) === periodKey;
}
