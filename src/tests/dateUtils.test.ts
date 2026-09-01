import { describe, test, expect } from "vitest";
import {
  addMonths,
  getCurrentIsoTimestamp,
  getCurrentMonthKey,
  getCurrentYearKey,
  getIsoWeekKey,
  getIsoWeekLabel,
  getMonthLabel,
  getTodayDateString,
  isSameMonth,
} from "../lib/dateUtils";

describe("dateUtils helpers", () => {
  test("getTodayDateString returns a local date key", () => {
    expect(getTodayDateString(new Date(2025, 0, 9, 15, 30))).toBe("2025-01-09");
  });

  test("getCurrentMonthKey returns a local month key", () => {
    expect(getCurrentMonthKey(new Date(2025, 10, 3, 9, 45))).toBe("2025-11");
  });

  test("returns calendar-year and ISO-week keys", () => {
    expect(getCurrentYearKey(new Date(2025, 10, 3))).toBe("2025");
    expect(getIsoWeekKey("2026-06-01")).toBe("2026-W23");
    expect(getIsoWeekKey("2025-12-29")).toBe("2026-W01");
    expect(getIsoWeekLabel("2026-W23")).toBe("Week 23, 2026");
  });

  test("getMonthLabel formats properly", () => {
    expect(getMonthLabel("2025-11")).toBe("November 2025");
    expect(getMonthLabel(new Date(2025, 0, 1))).toBe("January 2025");
    expect(getMonthLabel("")).toBe(getMonthLabel(getCurrentMonthKey()));
  });

  test("getCurrentIsoTimestamp returns an ISO timestamp", () => {
    expect(getCurrentIsoTimestamp(new Date("2025-04-12T08:30:15.000Z"))).toBe("2025-04-12T08:30:15.000Z");
  });

  test("isSameMonth checks a date key against a month key", () => {
    expect(isSameMonth("2025-03-31", "2025-03")).toBe(true);
    expect(isSameMonth("2025-04-01", "2025-03")).toBe(false);
    expect(isSameMonth("invalid", "2025-03")).toBe(false);
  });

  test("addMonths preserves local date where possible and clamps month-end overflow", () => {
    expect(getTodayDateString(addMonths(new Date(2025, 0, 15), 1))).toBe("2025-02-15");
    expect(getTodayDateString(addMonths(new Date(2025, 0, 31), 1))).toBe("2025-02-28");
  });
});
