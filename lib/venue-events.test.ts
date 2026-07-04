import { describe, expect, it } from "vitest";

import {
  formatEventDateTime,
  formatEventSchedule,
  formatEventStatusLabel,
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
      "20 jun 2026, 20:00 hs → 21 jun 2026, 02:00 hs",
    );
  });

  it("falls back to an em-dash when the schedule end is missing", () => {
    expect(formatEventSchedule("2026-06-20T23:00:00.000Z", null)).toBe("20 jun 2026, 20:00 hs");
    expect(formatEventSchedule("not-a-date", null)).toBe("—");
  });

  it("translates event status tokens to Spanish labels", () => {
    expect(formatEventStatusLabel("DRAFT")).toBe("Borrador");
    expect(formatEventStatusLabel("upcoming")).toBe("Próximo");
    expect(formatEventStatusLabel("Active")).toBe("Activo");
    expect(formatEventStatusLabel("CANCELLED")).toBe("Cancelado");
    expect(formatEventStatusLabel("finished")).toBe("Finalizado");
  });

  it("humanizes unknown status tokens as a visible fallback", () => {
    expect(formatEventStatusLabel("weird_status")).toBe("Weird Status");
  });
});
