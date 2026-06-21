import { describe, expect, it } from "vitest";
import {
  accessSessionResultTone,
  accessSessionMethodLabel,
  formatAccessSessionDate,
} from "@/lib/access-sessions";

describe("access-sessions utils", () => {
  it("returns success tone for ALLOWED", () => {
    expect(accessSessionResultTone("ALLOWED")).toBe("success");
  });

  it("returns warning tone for ALLOWED_WITH_WARNING", () => {
    expect(accessSessionResultTone("ALLOWED_WITH_WARNING")).toBe("warning");
  });

  it("returns danger tone for REJECTED", () => {
    expect(accessSessionResultTone("REJECTED")).toBe("danger");
  });

  it("returns neutral tone for unknown result", () => {
    expect(accessSessionResultTone("UNKNOWN")).toBe("neutral");
  });

  it("returns human-readable label for known method", () => {
    expect(accessSessionMethodLabel("IDNIGHT_VERIFIED")).toBe("ID Night verified");
    expect(accessSessionMethodLabel("MANUAL_DNI_CHECK")).toBe("Manual DNI check");
    expect(accessSessionMethodLabel("GUEST_LIST_DNI_CHECK")).toBe("Guest list DNI check");
  });

  it("returns raw value for unknown method", () => {
    expect(accessSessionMethodLabel("SOME_NEW_METHOD")).toBe("SOME_NEW_METHOD");
  });

  it("formats a valid ISO date", () => {
    const result = formatAccessSessionDate("2026-06-21T02:00:00.000Z");
    expect(typeof result).toBe("string");
    expect(result).not.toBe("Invalid date");
  });

  it("returns Invalid date for bad input", () => {
    expect(formatAccessSessionDate("not-a-date")).toBe("Invalid date");
  });
});
