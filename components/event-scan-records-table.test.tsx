import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  EventScanRecordsTable,
  ScanOutcomeFilterBar,
} from "@/components/event-scan-records-table";
import type { BackendScanRecord } from "@/lib/idnight-backend";

function createRecord(overrides: Partial<BackendScanRecord> = {}): BackendScanRecord {
  return {
    id: "scan-1",
    eventId: "event-1",
    accessSessionId: null,
    documentLookupKey: "lookup-key-1",
    outcome: "Allow",
    score: 0.92,
    latencyMs: 145,
    correlationId: "corr-1",
    validatedAt: "2026-07-03T01:15:30.000Z",
    ...overrides,
  };
}

describe("EventScanRecordsTable", () => {
  it("maps every backend outcome to its Spanish product label and tone", () => {
    render(
      <EventScanRecordsTable
        records={[
          createRecord({ id: "s1", outcome: "Allow" }),
          createRecord({ id: "s2", outcome: "Warning" }),
          createRecord({ id: "s3", outcome: "ManualReview" }),
          createRecord({ id: "s4", outcome: "Deny" }),
          createRecord({ id: "s5", outcome: "NotFound" }),
        ]}
        total={5}
        error={null}
      />,
    );

    expect(screen.getByText("Permitido")).toBeInTheDocument();
    expect(screen.getByText("Advertencia operativa")).toBeInTheDocument();
    expect(screen.getByText("Requiere revisión")).toBeInTheDocument();
    expect(screen.getByText("Rechazado")).toBeInTheDocument();
    expect(screen.getByText("No encontrado en ID-Night")).toBeInTheDocument();
  });

  it("renders time in Argentina local time with an accessible header and a persistent zone caption, plus score and latency", () => {
    render(
      <EventScanRecordsTable records={[createRecord()]} total={1} error={null} />,
    );

    const header = screen.getByRole("columnheader", { name: "Hora local de Argentina" });
    expect(header).toHaveTextContent("Hora");

    expect(
      screen.getByText("Horarios en hora de Argentina (UTC-3)."),
    ).toBeInTheDocument();

    const row = screen.getByText("Permitido").closest("tr");
    expect(row).not.toBeNull();
    // validatedAt is 2026-07-03T01:15:30Z (UTC); AR local time (-03:00) is the
    // previous day at 22:15:30 — output must not depend on the runtime TZ.
    expect(row!.cells[0].textContent).toBe("22:15:30 hs");
    expect(screen.getByText("0.92")).toBeInTheDocument();
    expect(screen.getByText("145 ms")).toBeInTheDocument();
  });

  it("renders a dash when the score is missing", () => {
    render(
      <EventScanRecordsTable
        records={[createRecord({ score: null })]}
        total={1}
        error={null}
      />,
    );

    const row = screen.getByText("Permitido").closest("tr");
    expect(row!.cells[4].textContent).toBe("—");
  });

  it("shows the guard decision badge, reason tooltip, and override badge when present", () => {
    render(
      <EventScanRecordsTable
        records={[
          createRecord({
            outcome: "ManualReview",
            guardDecision: "Accepted",
            guardDecisionReason: "Documento validado en puerta",
            isOverride: true,
          }),
        ]}
        total={1}
        error={null}
      />,
    );

    const row = screen.getByText("Aceptado").closest("tr");
    expect(row).not.toBeNull();
    expect(within(row!).getByText("Anulación")).toBeInTheDocument();
    expect(screen.getByTitle("Documento validado en puerta")).toBeInTheDocument();
  });

  it("shows a muted dash when there is no guard decision", () => {
    render(
      <EventScanRecordsTable records={[createRecord()]} total={1} error={null} />,
    );

    const row = screen.getByText("Permitido").closest("tr");
    expect(row!.cells[3].textContent).toBe("—");
    expect(within(row!).queryByText("Anulación")).not.toBeInTheDocument();
  });

  it("never renders the document lookup key", () => {
    render(
      <EventScanRecordsTable records={[createRecord()]} total={1} error={null} />,
    );

    expect(screen.queryByText("lookup-key-1")).not.toBeInTheDocument();
  });

  it("renders the PRD method label for each of the three door-entry methods", () => {
    render(
      <EventScanRecordsTable
        records={[
          createRecord({ id: "s1", method: "IDNIGHT_VERIFIED" }),
          createRecord({ id: "s2", method: "MANUAL_DNI_CHECK" }),
          createRecord({ id: "s3", method: "GUEST_LIST_DNI_CHECK" }),
        ]}
        total={3}
        error={null}
      />,
    );

    expect(screen.getByText("Ingreso verificado por ID-Night")).toBeInTheDocument();
    expect(screen.getByText("Ingreso manual con DNI físico")).toBeInTheDocument();
    expect(screen.getByText("Ingreso por lista de invitados")).toBeInTheDocument();
  });

  it("renders an em-dash in the method column when method is missing or unrecognized", () => {
    render(
      <EventScanRecordsTable
        records={[
          createRecord({ id: "s1", method: undefined }),
          createRecord({ id: "s2", method: "SOME_FUTURE_TOKEN" }),
        ]}
        total={2}
        error={null}
      />,
    );

    const methodColumnIndex = screen.getByRole("columnheader", { name: "Método" });
    expect(methodColumnIndex).toBeInTheDocument();

    const rows = screen.getAllByText("Permitido").map((el) => el.closest("tr")!);
    // Method sits right after the time column, mirroring the reference mockup.
    const methodCellIndex = 1;
    expect(rows[0].cells[methodCellIndex].textContent).toBe("—");
    expect(rows[1].cells[methodCellIndex].textContent).toBe("—");
  });

  it("renders the operator name, and a muted dash when it is missing", () => {
    render(
      <EventScanRecordsTable
        records={[
          createRecord({ id: "s1", operatorName: "Ana Pérez" }),
          createRecord({ id: "s2", operatorName: null }),
        ]}
        total={2}
        error={null}
      />,
    );

    expect(screen.getByText("Ana Pérez")).toBeInTheDocument();

    const rows = screen.getAllByText("Permitido").map((el) => el.closest("tr")!);
    const operatorCellIndex = 7;
    expect(rows[1].cells[operatorCellIndex].textContent).toBe("—");
  });

  it("prefers the backend result field over the client-side outcome mapping when present", () => {
    render(
      <EventScanRecordsTable
        records={[createRecord({ outcome: "Allow", result: "ALLOWED_WITH_WARNING" })]}
        total={1}
        error={null}
      />,
    );

    expect(screen.getByText("Advertencia operativa")).toBeInTheDocument();
    expect(screen.queryByText("Permitido")).not.toBeInTheDocument();
  });

  it("falls back to the outcome mapping for old records without a result field", () => {
    render(
      <EventScanRecordsTable
        records={[createRecord({ outcome: "Allow", result: undefined })]}
        total={1}
        error={null}
      />,
    );

    expect(screen.getByText("Permitido")).toBeInTheDocument();
  });

  it("does not render any banned PRD §8 vocabulary", () => {
    render(
      <EventScanRecordsTable
        records={[
          createRecord({ method: "IDNIGHT_VERIFIED" }),
          createRecord({ id: "s2", method: "MANUAL_DNI_CHECK" }),
          createRecord({ id: "s3", method: "GUEST_LIST_DNI_CHECK" }),
        ]}
        total={3}
        error={null}
      />,
    );

    const bannedVocabulary = [
      /lista negra/i,
      /persona peligrosa/i,
      /persona problemática/i,
      /culpable detectado/i,
      /identificado automáticamente/i,
      /reconocimiento confirmado por IA/i,
      /risk score/i,
      /reputation score/i,
    ];
    for (const banned of bannedVocabulary) {
      expect(screen.queryByText(banned)).not.toBeInTheDocument();
    }
  });

  it("shows the empty state when there are no records", () => {
    render(<EventScanRecordsTable records={[]} total={0} error={null} />);

    expect(
      screen.getByText("Sin ingresos registrados para este evento."),
    ).toBeInTheDocument();
  });

  it("shows the error panel when loading fails", () => {
    render(
      <EventScanRecordsTable records={[]} total={0} error="backend unavailable" />,
    );

    expect(screen.getByText("No se pudo cargar la vista")).toBeInTheDocument();
    expect(screen.getByText("backend unavailable")).toBeInTheDocument();
  });
});

describe("ScanOutcomeFilterBar", () => {
  it("renders one chip per outcome plus 'Todos' with backend enum values in hrefs", () => {
    render(<ScanOutcomeFilterBar eventId="event-1" />);

    expect(screen.getByRole("link", { name: "Todos" })).toHaveAttribute(
      "href",
      "/venue/events/event-1/entries",
    );
    expect(screen.getByRole("link", { name: "Permitido" })).toHaveAttribute(
      "href",
      "/venue/events/event-1/entries?outcome=Allow",
    );
    expect(screen.getByRole("link", { name: "Advertencia" })).toHaveAttribute(
      "href",
      "/venue/events/event-1/entries?outcome=Warning",
    );
    expect(screen.getByRole("link", { name: "Revisión" })).toHaveAttribute(
      "href",
      "/venue/events/event-1/entries?outcome=ManualReview",
    );
    expect(screen.getByRole("link", { name: "Rechazado" })).toHaveAttribute(
      "href",
      "/venue/events/event-1/entries?outcome=Deny",
    );
    expect(screen.getByRole("link", { name: "No encontrado" })).toHaveAttribute(
      "href",
      "/venue/events/event-1/entries?outcome=NotFound",
    );
  });

  it("marks 'Todos' as current when no outcome filter is active", () => {
    render(<ScanOutcomeFilterBar eventId="event-1" />);

    expect(screen.getByRole("link", { name: "Todos" })).toHaveAttribute(
      "aria-current",
      "true",
    );
    expect(screen.getByRole("link", { name: "Permitido" })).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("marks the active outcome chip as current", () => {
    render(<ScanOutcomeFilterBar eventId="event-1" activeOutcome="Deny" />);

    expect(screen.getByRole("link", { name: "Rechazado" })).toHaveAttribute(
      "aria-current",
      "true",
    );
    expect(screen.getByRole("link", { name: "Todos" })).not.toHaveAttribute("aria-current");
  });
});
