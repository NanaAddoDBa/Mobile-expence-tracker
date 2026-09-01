/**
 * Returns today's date in local YYYY-MM-DD format.
 */
export function getTodayDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Returns current month key in local YYYY-MM format.
 */
export function getCurrentMonthKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

/**
 * Returns the calendar year in YYYY format.
 */
export function getCurrentYearKey(date: Date = new Date()): string {
  return String(date.getFullYear());
}

/**
 * Returns an ISO week key in YYYY-Www format for a local date or YYYY-MM-DD value.
 */
export function getIsoWeekKey(date: Date | string = new Date()): string {
  let target: Date;

  if (typeof date === "string") {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return "";
    const [year, month, day] = date.split("-").map(Number);
    target = new Date(Date.UTC(year, month - 1, day));
    if (target.toISOString().slice(0, 10) !== date) return "";
  } else {
    target = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  }

  const day = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + 4 - day);
  const isoYear = target.getUTCFullYear();
  const yearStart = new Date(Date.UTC(isoYear, 0, 1));
  const week = Math.ceil(
    ((target.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7,
  );

  return `${isoYear}-W${String(week).padStart(2, "0")}`;
}

/**
 * Formats an ISO week key as a concise user-facing label.
 */
export function getIsoWeekLabel(weekKey: string): string {
  const match = /^(\d{4})-W(\d{2})$/.exec(weekKey);
  return match ? `Week ${Number(match[2])}, ${match[1]}` : weekKey;
}

/**
 * Formats a YYYY-MM key, YYYY-MM-DD string, or Date to a labeled month.
 */
export function getMonthLabel(monthKeyOrDate?: string | Date): string {
  if (monthKeyOrDate instanceof Date) {
    return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(monthKeyOrDate);
  }

  const target = monthKeyOrDate || getCurrentMonthKey();
  const parts = target.split("-");
  if (parts.length < 2) {
    return target;
  }

  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  if (Number.isNaN(year) || Number.isNaN(month)) {
    return target;
  }

  const d = new Date(year, month, 1);
  return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(d);
}

/**
 * Returns an ISO timestamp for createdAt/updatedAt-style fields.
 */
export function getCurrentIsoTimestamp(date: Date = new Date()): string {
  return date.toISOString();
}

/**
 * Checks whether a local YYYY-MM-DD date belongs to a YYYY-MM month key.
 */
export function isSameMonth(dateString: string, monthKey: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString) || !/^\d{4}-\d{2}$/.test(monthKey)) {
    return false;
  }

  return dateString.slice(0, 7) === monthKey;
}

/**
 * Checks whether a local YYYY-MM-DD date belongs to an ISO YYYY-Www week.
 */
export function isSameIsoWeek(dateString: string, weekKey: string): boolean {
  return getIsoWeekKey(dateString) === weekKey;
}

/**
 * Adds months in local time and clamps overflowing month-end dates.
 */
export function addMonths(date: Date, count: number): Date {
  const result = new Date(date.getTime());
  const originalDay = result.getDate();

  result.setDate(1);
  result.setMonth(result.getMonth() + count);

  const daysInTargetMonth = new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate();
  result.setDate(Math.min(originalDay, daysInTargetMonth));

  return result;
}
