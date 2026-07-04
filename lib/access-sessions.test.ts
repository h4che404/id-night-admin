import { describe, expect, it } from "vitest";
import { accessSessionStatusLabel, accessSessionStatusTone } from "@/lib/access-sessions";

describe("access-sessions utils", () => {
  it("returns the Spanish label for the open status", () => {
    expect(accessSessionStatusLabel("open")).toBe("Abierta");
  });

  it("returns the Spanish label for the closed status", () => {
    expect(accessSessionStatusLabel("closed")).toBe("Cerrada");
  });

  it("returns a humanized fallback for an unknown status token", () => {
    expect(accessSessionStatusLabel("some_new_status")).toBe("Some New Status");
  });

  it("returns success tone for the open status", () => {
    expect(accessSessionStatusTone("open")).toBe("success");
  });

  it("returns neutral tone for the closed status", () => {
    expect(accessSessionStatusTone("closed")).toBe("neutral");
  });

  it("returns neutral tone for an unknown status", () => {
    expect(accessSessionStatusTone("some_new_status")).toBe("neutral");
  });
});
