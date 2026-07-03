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

  it("renders time in UTC with an explicit column header, plus score and latency", () => {
    render(
      <EventScanRecordsTable records={[createRecord()]} total={1} error={null} />,
    );

    expect(
      screen.getByRole("columnheader", { name: "Hora (UTC)" }),
    ).toBeInTheDocument();

    const row = screen.getByText("Permitido").closest("tr");
    expect(row).not.toBeNull();
    // validatedAt is 01:15:30 UTC; output must not depend on the runtime TZ.
    expect(row!.cells[0].textContent).toBe("01:15:30");
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
    expect(row!.cells[3].textContent).toBe("—");
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
    expect(within(row!).getByText("Override")).toBeInTheDocument();
    expect(screen.getByTitle("Documento validado en puerta")).toBeInTheDocument();
  });

  it("shows a muted dash when there is no guard decision", () => {
    render(
      <EventScanRecordsTable records={[createRecord()]} total={1} error={null} />,
    );

    const row = screen.getByText("Permitido").closest("tr");
    expect(row!.cells[2].textContent).toBe("—");
    expect(within(row!).queryByText("Override")).not.toBeInTheDocument();
  });

  it("never renders the document lookup key", () => {
    render(
      <EventScanRecordsTable records={[createRecord()]} total={1} error={null} />,
    );

    expect(screen.queryByText("lookup-key-1")).not.toBeInTheDocument();
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
