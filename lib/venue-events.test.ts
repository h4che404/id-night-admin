import { describe, expect, it } from "vitest";

import {
  formatEventDateTime,
  formatEventSchedule,
  normalizeEventInstant,
  utcDateTimeInputToIso,
} from "@/lib/venue-events";

describe("venue-events date validation", () => {
  it("treats datetime-local input as an explicit UTC contract", () => {
    expect(utcDateTimeInputToIso("2026-06-20T23:00")).toBe("2026-06-20T23:00:00.000Z");
  });

  it("rejects impossible local calendar dates", () => {
    expect(utcDateTimeInputToIso("2026-02-30T23:00")).toBeNull();
  });

  it("rejects impossible ISO calendar dates with a timezone", () => {
    expect(normalizeEventInstant("2026-02-30T23:00:00.000Z")).toBeNull();
  });

  it("rejects impossible timezone offsets instead of normalizing them", () => {
    expect(normalizeEventInstant("2026-06-20T23:00:00+24:00")).toBeNull();
    expect(normalizeEventInstant("2026-06-20T23:00:00+00:99")).toBeNull();
  });

  it("formats UTC schedule text deterministically", () => {
    expect(formatEventDateTime("2026-06-20T23:00:00.000Z")).toBe("Jun 20, 2026, 11:00 PM UTC");
    expect(formatEventSchedule("2026-06-20T23:00:00.000Z", "2026-06-21T05:00:00.000Z")).toBe(
      "Jun 20, 2026, 11:00 PM UTC → Jun 21, 2026, 5:00 AM UTC",
    );
  });
});
