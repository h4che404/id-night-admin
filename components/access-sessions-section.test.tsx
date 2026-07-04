import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AccessSessionsSection } from "@/components/access-sessions-section";
import type { BackendAccessSession } from "@/lib/idnight-backend";

function createSession(overrides: Partial<BackendAccessSession> = {}): BackendAccessSession {
  return {
    id: "session-1",
    venueId: "venue-1",
    eventId: "event-1",
    operatorId: "operator-1",
    status: "open",
    openedAt: "2026-07-04T23:00:00.000Z",
    closedAt: null,
    ...overrides,
  };
}

describe("AccessSessionsSection", () => {
  it("renders the Spanish status label for open and closed sessions, never the raw token", () => {
    render(
      <AccessSessionsSection
        initialSessions={[
          createSession({ id: "s1", status: "open" }),
          createSession({
            id: "s2",
            status: "closed",
            closedAt: "2026-07-05T01:30:00.000Z",
          }),
        ]}
        initialError={null}
        events={[{ id: "event-1", name: "Friday Opening" }]}
      />,
    );

    // "Abierta"/"Cerrada" also appear as filter <option> text, so scope the
    // raw-token assertion to the table rows rendered from initialSessions.
    const table = screen.getByRole("table");
    expect(within(table).getByText("Abierta")).toBeInTheDocument();
    expect(within(table).getByText("Cerrada")).toBeInTheDocument();
    expect(within(table).queryByText("open")).not.toBeInTheDocument();
    expect(within(table).queryByText("closed")).not.toBeInTheDocument();
  });

  it("renders opened/closed dates deterministically in Argentina time regardless of runner TZ", () => {
    // Fixed UTC instant per design ADR-8: 2026-07-04T23:00:00Z is 20:00 hs in
    // America/Argentina/Buenos_Aires (UTC-3, no DST). This is the exact class
    // of instant that the old no-timeZone Intl call rendered inconsistently
    // depending on the server/runner's local TZ.
    render(
      <AccessSessionsSection
        initialSessions={[
          createSession({
            id: "s1",
            status: "open",
            openedAt: "2026-07-04T23:00:00.000Z",
            closedAt: "2026-07-05T01:30:00.000Z",
          }),
        ]}
        initialError={null}
        events={[]}
      />,
    );

    expect(screen.getByText("4 jul 2026, 20:00 hs")).toBeInTheDocument();
    expect(screen.getByText("4 jul 2026, 22:30 hs")).toBeInTheDocument();
  });

  it("renders an em dash for a session that has not closed yet", () => {
    render(
      <AccessSessionsSection
        initialSessions={[createSession({ id: "s1", closedAt: null })]}
        initialError={null}
        events={[]}
      />,
    );

    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("renders Spanish filters and the empty state when there are no sessions", () => {
    render(<AccessSessionsSection initialSessions={[]} initialError={null} events={[]} />);

    expect(screen.getByText("Estado")).toBeInTheDocument();
    expect(screen.getByText("Todos los estados")).toBeInTheDocument();
    expect(screen.getByText("Abierta")).toBeInTheDocument();
    expect(screen.getByText("Cerrada")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Aplicar filtros" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Limpiar" })).toBeInTheDocument();

    expect(screen.getByText("No se encontraron sesiones")).toBeInTheDocument();
    expect(
      screen.getByText("Probá ajustar los filtros o volvé a intentar más tarde."),
    ).toBeInTheDocument();
  });

  it("renders Spanish column headers when there are sessions to show", () => {
    render(
      <AccessSessionsSection
        initialSessions={[createSession({ id: "s1" })]}
        initialError={null}
        events={[]}
      />,
    );

    expect(screen.getByRole("columnheader", { name: "Apertura" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Cierre" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Estado" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Evento" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Operador" })).toBeInTheDocument();
  });

  it("shows the Event filter and renders the error state in Spanish when initialError is set", () => {
    render(
      <AccessSessionsSection
        initialSessions={[]}
        initialError="Backend unreachable"
        events={[{ id: "event-1", name: "Friday Opening" }]}
      />,
    );

    expect(screen.getByText("Evento")).toBeInTheDocument();
    expect(screen.getByText("No se pudieron cargar las sesiones de acceso")).toBeInTheDocument();
    expect(screen.getByText("Backend unreachable")).toBeInTheDocument();
  });

  it("falls back to a Spanish error message when applying filters fails without a payload message", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({}),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<AccessSessionsSection initialSessions={[]} initialError={null} events={[]} />);

    const applyButton = screen.getByRole("button", { name: "Aplicar filtros" });
    applyButton.click();

    expect(await screen.findByText("No se pudieron cargar las sesiones de acceso.")).toBeInTheDocument();

    vi.unstubAllGlobals();
  });
});
