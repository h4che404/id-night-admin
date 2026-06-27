import { describe, expect, it } from "vitest";
import { isValidGuestListFile, maskDni, guestListStatusTone } from "@/lib/guest-list";

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
    expect(guestListStatusTone("used")).toBe("neutral");
    expect(guestListStatusTone("cancelled")).toBe("danger");
  });
});
