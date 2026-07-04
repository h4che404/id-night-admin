import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { requireReadyPageAccess, fetchEventReport } = vi.hoisted(() => ({
  requireReadyPageAccess: vi.fn(),
  fetchEventReport: vi.fn(),
}));

vi.mock("@/lib/auth-session", () => ({
  requireReadyPageAccess,
}));

vi.mock("@/lib/idnight-backend", () => ({
  fetchEventReport,
}));

import EventReportPage from "@/app/(app)/venue/events/[id]/report/page";

const mockReport = {
  eventId: "event-1",
  eventName: "Friday Opening",
  status: "Active",
  startsAt: "2026-07-04T23:00:00.000Z", // 20:00 hs AR
  totalGuestEntries: 120,
  cancelledGuestEntries: 4,
  accessSessionCount: 3,
  lastSessionOpenedAt: "2026-07-05T01:30:00.000Z", // 22:30 hs AR (previous day)
};

async function renderPage(eventId = "event-1") {
  const page = await EventReportPage({ params: Promise.resolve({ id: eventId }) });
  return render(page);
}

describe("EventReportPage", () => {
  beforeEach(() => {
    requireReadyPageAccess.mockReset();
    requireReadyPageAccess.mockResolvedValue({
      session: { accessToken: "admin-token", refreshToken: null },
    });
    fetchEventReport.mockReset();
    fetchEventReport.mockResolvedValue(mockReport);
  });

  it("renders the event start and last-session dates in Argentina local time", async () => {
    await renderPage();

    expect(screen.getByText("4 jul 2026, 20:00 hs")).toBeInTheDocument();
    expect(screen.getByText("4 jul 2026, 22:30 hs")).toBeInTheDocument();
    expect(screen.queryByText(/UTC/)).not.toBeInTheDocument();
  });

  it("renders the report status via the shared Spanish label and tone", async () => {
    await renderPage();

    expect(screen.getByText("Activo")).toBeInTheDocument();
    expect(screen.queryByText("Active")).not.toBeInTheDocument();
  });

  it("translates the report copy to Spanish", async () => {
    await renderPage();

    expect(screen.getByText("Reporte del evento")).toBeInTheDocument();
    expect(screen.getByText("Estado del evento")).toBeInTheDocument();
    expect(screen.getByText("Entradas totales")).toBeInTheDocument();
    expect(screen.getByText("Canceladas")).toBeInTheDocument();
    expect(screen.getByText("Sesiones de acceso")).toBeInTheDocument();
    expect(screen.getByText("Última sesión iniciada")).toBeInTheDocument();
    expect(screen.getByText("Lista de invitados")).toBeInTheDocument();
  });

  it("shows a translated empty state when the report fails to load", async () => {
    fetchEventReport.mockRejectedValue(new Error("boom"));

    await renderPage();

    expect(screen.getByText("Reporte no disponible")).toBeInTheDocument();
    expect(screen.getByText("boom")).toBeInTheDocument();
  });
});
