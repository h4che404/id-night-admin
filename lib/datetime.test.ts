import { describe, expect, it } from "vitest";

import {
  formatDateAr,
  formatDateTimeAr,
  formatTimeAr,
  formatTimeWithSecondsAr,
} from "@/lib/datetime";

/*
 * Fixed UTC instants pinned to their expected America/Argentina/Buenos_Aires
 * (-03:00, no DST) renderings. Every formatter passes an explicit timeZone,
 * so these assertions must hold regardless of the runner's local TZ — see
 * ADR-1/ADR-3/ADR-8 in design v2 (sdd/panel-es-ar/design).
 */
const FIXED_INSTANT = "2026-07-04T23:00:00Z"; // 20:00 hs in Buenos Aires
const CROSS_MIDNIGHT_INSTANT = "2026-07-05T01:30:00Z"; // 22:30 hs the day before, in Buenos Aires

describe("formatDateAr", () => {
  it("renders the AR calendar date", () => {
    expect(formatDateAr(FIXED_INSTANT)).toBe("4 jul 2026");
  });

  it("rolls the date back one day for a cross-midnight UTC instant", () => {
    expect(formatDateAr(CROSS_MIDNIGHT_INSTANT)).toBe("4 jul 2026");
  });

  it("returns an em-dash for invalid input", () => {
    expect(formatDateAr("not-a-date")).toBe("—");
  });

  it("returns an em-dash for empty input", () => {
    expect(formatDateAr("")).toBe("—");
    expect(formatDateAr(null)).toBe("—");
    expect(formatDateAr(undefined)).toBe("—");
  });
});

describe("formatTimeAr", () => {
  it("renders the AR clock time with the 'hs' suffix, no seconds", () => {
    expect(formatTimeAr(FIXED_INSTANT)).toBe("20:00 hs");
  });

  it("shifts the hour across the UTC midnight boundary", () => {
    expect(formatTimeAr(CROSS_MIDNIGHT_INSTANT)).toBe("22:30 hs");
  });

  it("asserts the AR-hour invariant (20, never the raw UTC hour 23)", () => {
    const result = formatTimeAr(FIXED_INSTANT);
    expect(result).toMatch(/^20:00 hs$/);
    expect(result).not.toContain("23:00");
  });

  it("returns an em-dash for invalid or empty input", () => {
    expect(formatTimeAr("not-a-date")).toBe("—");
    expect(formatTimeAr("")).toBe("—");
  });
});

describe("formatTimeWithSecondsAr", () => {
  it("renders the AR clock time with seconds and the 'hs' suffix (audit precision)", () => {
    expect(formatTimeWithSecondsAr(FIXED_INSTANT)).toBe("20:00:00 hs");
  });

  it("returns an em-dash for invalid or empty input", () => {
    expect(formatTimeWithSecondsAr("not-a-date")).toBe("—");
    expect(formatTimeWithSecondsAr("")).toBe("—");
  });
});

describe("formatDateTimeAr", () => {
  it("renders the combined AR date and time with the 'hs' suffix", () => {
    expect(formatDateTimeAr(FIXED_INSTANT)).toBe("4 jul 2026, 20:00 hs");
  });

  it("renders the cross-midnight instant on the AR-shifted previous day", () => {
    expect(formatDateTimeAr(CROSS_MIDNIGHT_INSTANT)).toBe("4 jul 2026, 22:30 hs");
  });

  it("asserts invariants: AR hour 20 (not UTC 23), 'hs' present, correct day", () => {
    const result = formatDateTimeAr(FIXED_INSTANT);
    expect(result).toContain("20:00");
    expect(result).not.toContain("23:00");
    expect(result).toContain("hs");
    expect(result).toContain("4 jul 2026");
  });

  it("matches the full-string snapshot (allowed to update on ICU bumps)", () => {
    expect(formatDateTimeAr(FIXED_INSTANT)).toMatchSnapshot();
  });

  it("returns an em-dash for invalid or empty input", () => {
    expect(formatDateTimeAr("not-a-date")).toBe("—");
    expect(formatDateTimeAr("")).toBe("—");
    expect(formatDateTimeAr(null)).toBe("—");
    expect(formatDateTimeAr(undefined)).toBe("—");
  });
});
