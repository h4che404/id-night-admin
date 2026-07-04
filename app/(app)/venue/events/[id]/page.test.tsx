import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { requireReadyPageAccess, findVenueEventById, fetchEventScanStats } = vi.hoisted(() => ({
  requireReadyPageAccess: vi.fn(),
  findVenueEventById: vi.fn(),
  fetchEventScanStats: vi.fn(),
}));

vi.mock("@/lib/auth-session", () => ({
  requireReadyPageAccess,
}));

vi.mock("@/lib/idnight-backend", () => ({
  findVenueEventById,
  fetchEventScanStats,
}));

import EventSummaryPage from "@/app/(app)/venue/events/[id]/page";

const mockEvent = {
  id: "event-1",
  venueId: "venue-1",
  name: "Friday Opening",
  status: "ACTIVE",
  startsAt: "2026-07-04T23:00:00.000Z", // 20:00 hs AR
  endsAt: "2026-07-05T01:30:00.000Z", // 22:30 hs AR (previous day)
  maxCapacity: 500,
  minAge: 18,
  allowManualDniCheck: true,
  requireGuestList: false,
  createdAt: "2026-06-01T00:00:00.000Z",
  updatedAt: null,
};

const mockStats = {
  allow: 10,
  warning: 2,
  deny: 1,
  manualReview: 0,
  notFound: 0,
  avgLatencyMs: 120,
  p95LatencyMs: 300,
  total: 13,
};

async function renderPage(eventId = "event-1") {
  const page = await EventSummaryPage({ params: Promise.resolve({ id: eventId }) });
  return render(page);
}

describe("EventSummaryPage", () => {
  beforeEach(() => {
    requireReadyPageAccess.mockReset();
    requireReadyPageAccess.mockResolvedValue({
      session: { accessToken: "admin-token", refreshToken: null },
    });
    findVenueEventById.mockReset();
    findVenueEventById.mockResolvedValue(mockEvent);
    fetchEventScanStats.mockReset();
    fetchEventScanStats.mockResolvedValue(mockStats);
  });

  it("renders Inicio/Fin in Argentina local time with no UTC label anywhere", async () => {
    await renderPage();

    // startsAt/endsAt are UTC instants; AR local time (-03:00) shifts both.
    expect(screen.getByText("4 jul 2026, 20:00 hs")).toBeInTheDocument();
    expect(screen.getByText("4 jul 2026, 22:30 hs")).toBeInTheDocument();
    expect(screen.queryByText(/UTC/)).not.toBeInTheDocument();
  });

  it("shows 'Sin definir' for Fin when the event has no end date", async () => {
    findVenueEventById.mockResolvedValue({ ...mockEvent, endsAt: null });

    await renderPage();

    expect(screen.getByText("4 jul 2026, 20:00 hs")).toBeInTheDocument();
    expect(screen.getByText("Sin definir")).toBeInTheDocument();
  });

  it("shows the stats section heading without a UTC qualifier", async () => {
    await renderPage();

    expect(screen.getByText("Estadísticas de hoy")).toBeInTheDocument();
    expect(screen.queryByText(/Estadísticas de hoy \(UTC\)/)).not.toBeInTheDocument();
  });

  it("translates the guest-list requirement badge instead of leaking the English term", async () => {
    await renderPage();

    expect(screen.getByText("Lista de invitados opcional")).toBeInTheDocument();
    expect(screen.queryByText(/guest list/i)).not.toBeInTheDocument();
  });

  it("shows the required-guest-list label when the event requires it", async () => {
    findVenueEventById.mockResolvedValue({ ...mockEvent, requireGuestList: true });

    await renderPage();

    expect(screen.getByText("Requiere lista de invitados")).toBeInTheDocument();
    expect(screen.queryByText(/guest list/i)).not.toBeInTheDocument();
  });
});
