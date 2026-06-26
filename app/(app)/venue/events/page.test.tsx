import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { MockBackendApiError, requireBackendSession, fetchMyVenue, fetchVenueEvents } = vi.hoisted(() => {
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
    requireBackendSession: vi.fn(),
    fetchMyVenue: vi.fn(),
    fetchVenueEvents: vi.fn(),
  };
});

vi.mock("@/lib/auth-session", () => ({
  requireBackendSession,
  requireBackendProfile: async () => {
    const session = await requireBackendSession();
    return {
      session,
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
    };
  },
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
    requireBackendSession.mockReset();
    requireBackendSession.mockResolvedValue({ accessToken: "admin-token", refreshToken: null });
    fetchMyVenue.mockReset();
    fetchVenueEvents.mockReset();
  });

  it("shows the no-venue empty state when the venue does not exist", async () => {
    fetchMyVenue.mockRejectedValue(new MockBackendApiError("Venue not found", 404));

    render(await VenueEventsPage());

    expect(screen.getByText("No venue configured")).toBeInTheDocument();
    expect(screen.getByText(/create your venue before managing events/i)).toBeInTheDocument();
    expect(fetchVenueEvents).not.toHaveBeenCalled();
  });

  it("shows a dedicated venue load error when venue lookup fails unexpectedly", async () => {
    fetchMyVenue.mockRejectedValue(new MockBackendApiError("database timeout", 503));

    render(await VenueEventsPage());

    expect(screen.getByText("Could not load venue details")).toBeInTheDocument();
    expect(screen.getByText("Could not load venue details. Please try again.")).toBeInTheDocument();
    expect(fetchVenueEvents).not.toHaveBeenCalled();
  });

  it("shows the empty state when the venue has no events", async () => {
    fetchMyVenue.mockResolvedValue({ id: "venue-1", name: "ID Night", address: null, city: null, active: true });
    fetchVenueEvents.mockResolvedValue([]);

    render(await VenueEventsPage());

    expect(screen.getByText("No events yet")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /create event/i })).toBeInTheDocument();
  });

  it("shows a safe events error state when event loading fails", async () => {
    fetchMyVenue.mockResolvedValue({ id: "venue-1", name: "ID Night", address: null, city: null, active: true });
    fetchVenueEvents.mockRejectedValue(new MockBackendApiError("upstream leaked detail", 502));

    render(await VenueEventsPage());

    expect(screen.getByText("Could not load events")).toBeInTheDocument();
    expect(screen.getByText("Could not load venue events. Please try again.")).toBeInTheDocument();
  });

  it("preserves visible backend 4xx event-load messages", async () => {
    fetchMyVenue.mockResolvedValue({ id: "venue-1", name: "ID Night", address: null, city: null, active: true });
    fetchVenueEvents.mockRejectedValue(new MockBackendApiError("This venue cannot access that event.", 403));

    render(await VenueEventsPage());

    expect(screen.getByText("Could not load events")).toBeInTheDocument();
    expect(screen.getByText("This venue cannot access that event.")).toBeInTheDocument();
  });

  it("renders the event list with deterministic UTC schedule text", async () => {
    fetchMyVenue.mockResolvedValue({ id: "venue-1", name: "ID Night", address: null, city: null, active: true });
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
  });
});
