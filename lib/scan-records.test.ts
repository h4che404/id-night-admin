import { describe, expect, it } from "vitest";

import { methodUi, resolveScanResultUi } from "@/lib/scan-records";

describe("methodUi", () => {
  it("maps IDNIGHT_VERIFIED to the approved PRD label with a verified tone", () => {
    expect(methodUi("IDNIGHT_VERIFIED")).toEqual({
      label: "Ingreso verificado por ID-Night",
      tone: "verified",
    });
  });

  it("maps MANUAL_DNI_CHECK to the approved PRD label with a manual tone", () => {
    expect(methodUi("MANUAL_DNI_CHECK")).toEqual({
      label: "Ingreso manual con DNI físico",
      tone: "manual",
    });
  });

  it("maps GUEST_LIST_DNI_CHECK to the approved PRD label with an info tone", () => {
    expect(methodUi("GUEST_LIST_DNI_CHECK")).toEqual({
      label: "Ingreso por lista de invitados",
      tone: "info",
    });
  });

  it("returns null for a missing method", () => {
    expect(methodUi(undefined)).toBeNull();
    expect(methodUi(null)).toBeNull();
  });

  it("returns null for an unrecognized method token", () => {
    expect(methodUi("SOME_FUTURE_TOKEN")).toBeNull();
  });
});

describe("resolveScanResultUi", () => {
  it("prefers the backend result field when present", () => {
    expect(resolveScanResultUi({ outcome: "Allow", result: "REJECTED" })).toEqual({
      label: "Rechazado",
      filterLabel: "Rechazado",
      tone: "rejected",
    });
  });

  it("maps ALLOWED_WITH_WARNING to the operational-warning label and tone", () => {
    expect(
      resolveScanResultUi({ outcome: "Allow", result: "ALLOWED_WITH_WARNING" }),
    ).toEqual({
      label: "Advertencia operativa",
      filterLabel: "Advertencia",
      tone: "warning",
    });
  });

  it("falls back to the client-side outcome mapping when result is absent", () => {
    expect(resolveScanResultUi({ outcome: "Deny" })).toEqual({
      label: "Rechazado",
      filterLabel: "Rechazado",
      tone: "rejected",
    });
  });

  it("falls back to the client-side outcome mapping for old records with an unrecognized result", () => {
    expect(resolveScanResultUi({ outcome: "Allow", result: "UNKNOWN" })).toEqual({
      label: "Permitido",
      filterLabel: "Permitido",
      tone: "verified",
    });
  });
});
