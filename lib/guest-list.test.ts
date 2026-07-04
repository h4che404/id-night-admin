import { describe, expect, it } from "vitest";
import {
  isValidGuestListFile,
  maskDni,
  guestListStatusTone,
  guestListStatusLabel,
  isActiveGuestListStatus,
} from "@/lib/guest-list";

function makeFile(name: string, type: string, size = 100): File {
  return new File(["x".repeat(size)], name, { type });
}

describe("guest-list utils", () => {
  it("accepts .csv by extension", () => {
    expect(isValidGuestListFile(makeFile("guests.csv", ""))).toBe(true);
  });

  it("accepts .xlsx by extension", () => {
    expect(isValidGuestListFile(makeFile("guests.xlsx", ""))).toBe(true);
  });

  it("accepts .csv by MIME type", () => {
    expect(isValidGuestListFile(makeFile("guests.dat", "text/csv"))).toBe(true);
  });

  it("rejects unknown extension and MIME type", () => {
    expect(isValidGuestListFile(makeFile("guests.pdf", "application/pdf"))).toBe(false);
  });

  it("rejects empty files", () => {
    expect(isValidGuestListFile(makeFile("guests.csv", "text/csv", 0))).toBe(false);
  });

  it("masks DNI suffix", () => {
    expect(maskDni("1234")).toBe("****1234");
  });

  it("returns correct tone for each status", () => {
    expect(guestListStatusTone("active")).toBe("success");
    expect(guestListStatusTone("used")).toBe("manual");
    expect(guestListStatusTone("cancelled")).toBe("danger");
  });

  it("returns correct tone regardless of backend casing (PascalCase enum ToString())", () => {
    expect(guestListStatusTone("Active")).toBe("success");
    expect(guestListStatusTone("Used")).toBe("manual");
    expect(guestListStatusTone("Cancelled")).toBe("danger");
  });

  it("gives USED a tone distinct from ACTIVE and CANCELLED", () => {
    const tones = new Set([
      guestListStatusTone("Active"),
      guestListStatusTone("Used"),
      guestListStatusTone("Cancelled"),
    ]);
    expect(tones.size).toBe(3);
  });

  it("returns a neutral-Spanish label for each status, case-insensitively", () => {
    expect(guestListStatusLabel("active")).toBe("Activa");
    expect(guestListStatusLabel("Active")).toBe("Activa");
    expect(guestListStatusLabel("used")).toBe("Utilizada");
    expect(guestListStatusLabel("Used")).toBe("Utilizada");
    expect(guestListStatusLabel("cancelled")).toBe("Cancelada");
    expect(guestListStatusLabel("Cancelled")).toBe("Cancelada");
  });

  it("detects the active status regardless of casing", () => {
    expect(isActiveGuestListStatus("active")).toBe(true);
    expect(isActiveGuestListStatus("Active")).toBe(true);
    expect(isActiveGuestListStatus("Used")).toBe(false);
    expect(isActiveGuestListStatus("Cancelled")).toBe(false);
  });
});
