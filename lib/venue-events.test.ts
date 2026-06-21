import { describe, expect, it } from "vitest";

import { normalizeEventInstant, utcDateTimeInputToIso } from "@/lib/venue-events";

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
});
