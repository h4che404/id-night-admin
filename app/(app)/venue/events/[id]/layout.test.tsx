import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { requireReadyPageAccess, findVenueEventById, usePathname } = vi.hoisted(() => ({
  requireReadyPageAccess: vi.fn(),
  findVenueEventById: vi.fn(),
  usePathname: vi.fn(),
}));

vi.mock("@/lib/auth-session", () => ({
  requireReadyPageAccess,
}));

vi.mock("@/lib/idnight-backend", () => ({
  findVenueEventById,
}));

vi.mock("next/navigation", () => ({
  usePathname,
}));

import EventDetailLayout from "@/app/(app)/venue/events/[id]/layout";

const mockEvent = {
  id: "event-1",
  venueId: "venue-1",
  name: "Friday Opening",
  status: "ACTIVE",
  startsAt: "2026-06-20T23:00:00.000Z",
  endsAt: "2026-06-21T05:00:00.000Z",
  maxCapacity: 500,
  minAge: 18,
  allowManualDniCheck: true,
  requireGuestList: false,
  createdAt: "2026-06-01T00:00:00.000Z",
  updatedAt: null,
};

async function renderLayout(eventId = "event-1") {
  const layout = await EventDetailLayout({
    children: <div data-testid="tab-content">Tab content</div>,
    params: Promise.resolve({ id: eventId }),
  });

  return render(layout);
}

describe("EventDetailLayout", () => {
  beforeEach(() => {
    requireReadyPageAccess.mockReset();
    requireReadyPageAccess.mockResolvedValue({
      session: { accessToken: "admin-token", refreshToken: null },
      venueSummary: {
        id: "venue-1",
        name: "ID Night",
        slug: "id-night",
        address: "Main St 123",
        city: "Buenos Aires",
        active: true,
      },
    });
    findVenueEventById.mockReset();
    findVenueEventById.mockResolvedValue(mockEvent);
    usePathname.mockReset();
    usePathname.mockReturnValue("/venue/events/event-1");
  });

  it("stops before venue work when access is degraded", async () => {
    requireReadyPageAccess.mockResolvedValue(null);

    const { container } = await renderLayout();

    expect(container).toBeEmptyDOMElement();
    expect(findVenueEventById).not.toHaveBeenCalled();
  });

  it("renders the event header with name, status badge, and schedule", async () => {
    await renderLayout();

    expect(screen.getByRole("heading", { name: "Friday Opening" })).toBeInTheDocument();
    expect(screen.getByText("Activo")).toBeInTheDocument();
    expect(
      screen.getByText("20 jun 2026, 20:00 hs → 21 jun 2026, 02:00 hs"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("tab-content")).toBeInTheDocument();
  });

  it("renders the six tab links pointing at the event routes", async () => {
    await renderLayout();

    const expectedTabs: Array<[string, string]> = [
      ["Resumen", "/venue/events/event-1"],
      ["Ingresos", "/venue/events/event-1/entries"],
      ["Lista de invitados", "/venue/events/event-1/guest-list"],
      ["Incidentes", "/venue/events/event-1/incidents"],
      ["Operadores", "/venue/events/event-1/operators"],
      ["Reporte", "/venue/events/event-1/report"],
    ];

    for (const [label, href] of expectedTabs) {
      expect(screen.getByRole("link", { name: label })).toHaveAttribute("href", href);
    }
  });

  it("marks the summary tab as current on the base event route", async () => {
    usePathname.mockReturnValue("/venue/events/event-1");

    await renderLayout();

    expect(screen.getByRole("link", { name: "Resumen" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "Ingresos" })).not.toHaveAttribute("aria-current");
  });

  it("marks the entries tab as current on the entries route", async () => {
    usePathname.mockReturnValue("/venue/events/event-1/entries");

    await renderLayout();

    expect(screen.getByRole("link", { name: "Ingresos" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "Resumen" })).not.toHaveAttribute("aria-current");
  });

  it("falls back to a generic header when the event cannot be loaded", async () => {
    findVenueEventById.mockRejectedValue(new Error("backend down"));

    await renderLayout();

    expect(screen.getByRole("heading", { name: "Evento" })).toBeInTheDocument();
    expect(
      screen.getByText("No se pudo cargar la información del evento."),
    ).toBeInTheDocument();
    expect(screen.getByTestId("tab-content")).toBeInTheDocument();
  });
});
