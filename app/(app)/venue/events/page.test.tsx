import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { MockBackendApiError, requireBackendProfile, requireReadyPageAccess, fetchMyVenue, fetchVenueEvents } = vi.hoisted(() => {
  class MockBackendApiError extends Error {
    status: number;

    constructor(message: string, status: number) {
      super(message);
      this.name = "BackendApiError";
      this.status = status;
    }
  }

  return {
    MockBackendApiError,
    requireBackendProfile: vi.fn(() => {
      throw new Error("Legacy ready-only helper should not be used by venue events page");
    }),
    requireReadyPageAccess: vi.fn(),
    fetchMyVenue: vi.fn(),
    fetchVenueEvents: vi.fn(),
  };
});

vi.mock("@/lib/auth-session", () => ({
  requireBackendProfile,
  requireReadyPageAccess,
}));

vi.mock("@/lib/idnight-backend", () => ({
  BackendApiError: MockBackendApiError,
  fetchMyVenue,
  fetchVenueEvents,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock("@/components/venue-event-form", () => ({
  VenueEventForm: () => <div data-testid="venue-event-form">Event form</div>,
}));

import VenueEventsPage from "@/app/(app)/venue/events/page";

describe("VenueEventsPage", () => {
  beforeEach(() => {
    requireBackendProfile.mockClear();
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
      profile: {
        id: "admin-1",
        email: "admin@idnight.app",
        fullName: "Admin User",
        role: "Owner",
        active: true,
        venueId: "venue-1",
        venueName: "My Venue",
        organizationId: "org-1",
        organizationName: "My Org",
        membershipRole: "Owner",
        membershipActive: true,
      },
    });
    requireBackendProfile.mockReset();
    fetchMyVenue.mockReset();
    fetchVenueEvents.mockReset();
  });

  it("stops before venue work when access is degraded so the layout limited shell stays in control", async () => {
    requireReadyPageAccess.mockResolvedValue(null);

    const { container } = render(await VenueEventsPage());

    expect(container).toBeEmptyDOMElement();
    expect(fetchMyVenue).not.toHaveBeenCalled();
    expect(fetchVenueEvents).not.toHaveBeenCalled();
  });

  it("uses the ready venue summary in the page description without re-fetching venue details", async () => {
    fetchMyVenue.mockRejectedValue(new MockBackendApiError("Venue lookup should not run", 503));
    fetchVenueEvents.mockResolvedValue([]);

    render(await VenueEventsPage());

    expect(screen.getByText(/scheduled for ID Night/i)).toBeInTheDocument();
    expect(fetchMyVenue).not.toHaveBeenCalled();
  });

  it("ignores legacy venue lookup failures when the page can render from ready venue summary", async () => {
    fetchMyVenue.mockRejectedValue(new MockBackendApiError("database timeout", 503));
    fetchVenueEvents.mockResolvedValue([]);

    render(await VenueEventsPage());

    expect(screen.getByText("No events yet")).toBeInTheDocument();
    expect(fetchMyVenue).not.toHaveBeenCalled();
  });

  it("shows the empty state when the venue has no events", async () => {
    fetchMyVenue.mockRejectedValue(new MockBackendApiError("Venue lookup should not run", 503));
    fetchVenueEvents.mockResolvedValue([]);

    render(await VenueEventsPage());

    expect(screen.getByText("No events yet")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /create event/i })).toBeInTheDocument();
    expect(fetchMyVenue).not.toHaveBeenCalled();
  });

  it("shows a safe events error state when event loading fails", async () => {
    fetchMyVenue.mockRejectedValue(new MockBackendApiError("Venue lookup should not run", 503));
    fetchVenueEvents.mockRejectedValue(new MockBackendApiError("upstream leaked detail", 502));

    render(await VenueEventsPage());

    expect(screen.getByText("Could not load events")).toBeInTheDocument();
    expect(screen.getByText("Could not load venue events. Please try again.")).toBeInTheDocument();
    expect(fetchMyVenue).not.toHaveBeenCalled();
  });

  it("preserves visible backend 4xx event-load messages", async () => {
    fetchMyVenue.mockRejectedValue(new MockBackendApiError("Venue lookup should not run", 503));
    fetchVenueEvents.mockRejectedValue(new MockBackendApiError("This venue cannot access that event.", 403));

    render(await VenueEventsPage());

    expect(screen.getByText("Could not load events")).toBeInTheDocument();
    expect(screen.getByText("This venue cannot access that event.")).toBeInTheDocument();
    expect(fetchMyVenue).not.toHaveBeenCalled();
  });

  it("renders the event list with deterministic UTC schedule text", async () => {
    fetchMyVenue.mockRejectedValue(new MockBackendApiError("Venue lookup should not run", 503));
    fetchVenueEvents.mockResolvedValue([
      {
        id: "event-1",
        name: "Friday Opening",
        status: "ACTIVE",
        startsAt: "2026-06-20T23:00:00.000Z",
        endsAt: "2026-06-21T05:00:00.000Z",
        maxCapacity: 500,
      },
    ]);

    render(await VenueEventsPage());

    expect(screen.getByText("Friday Opening")).toBeInTheDocument();
    expect(
      screen.getByText("Jun 20, 2026, 11:00 PM UTC → Jun 21, 2026, 5:00 AM UTC"),
    ).toBeInTheDocument();
    expect(screen.getByText("500 people")).toBeInTheDocument();
    expect(fetchMyVenue).not.toHaveBeenCalled();
  });
});
