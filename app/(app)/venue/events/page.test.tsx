import { cloneElement, isValidElement, type ReactNode } from "react";
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

async function resolveAsyncNode(node: ReactNode): Promise<ReactNode> {
  if (Array.isArray(node)) {
    return Promise.all(node.map((child) => resolveAsyncNode(child)));
  }

  if (!isValidElement(node)) {
    return node;
  }

  if (typeof node.type === "function" && node.type.constructor.name === "AsyncFunction") {
    return resolveAsyncNode(await node.type(node.props));
  }

  if (node.props.children === undefined) {
    return node;
  }

  const resolvedChildren = await resolveAsyncNode(node.props.children);

  return Array.isArray(resolvedChildren)
    ? cloneElement(node, undefined, ...resolvedChildren)
    : cloneElement(node, undefined, resolvedChildren);
}

async function renderVenueEventsPage(searchParams: { page?: string } = {}) {
  const page = await VenueEventsPage({
    searchParams: Promise.resolve(searchParams),
  });

  return render(await resolveAsyncNode(page));
}

function createVenueEventsResult(items: Array<Record<string, unknown>>) {
  return {
    items,
    total: items.length,
    page: 1,
    pageSize: 20,
  };
}

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

    const { container } = await renderVenueEventsPage();

    expect(container).toBeEmptyDOMElement();
    expect(fetchMyVenue).not.toHaveBeenCalled();
    expect(fetchVenueEvents).not.toHaveBeenCalled();
  });

  it("uses the ready venue summary in the page description without re-fetching venue details", async () => {
    fetchMyVenue.mockRejectedValue(new MockBackendApiError("Venue lookup should not run", 503));
    fetchVenueEvents.mockResolvedValue(createVenueEventsResult([]));

    await renderVenueEventsPage();

    expect(screen.getByText(/scheduled for ID Night/i)).toBeInTheDocument();
    expect(fetchMyVenue).not.toHaveBeenCalled();
  });

  it("ignores legacy venue lookup failures when the page can render from ready venue summary", async () => {
    fetchMyVenue.mockRejectedValue(new MockBackendApiError("database timeout", 503));
    fetchVenueEvents.mockResolvedValue(createVenueEventsResult([]));

    await renderVenueEventsPage();

    expect(screen.getByText("Sin eventos todavía")).toBeInTheDocument();
    expect(fetchMyVenue).not.toHaveBeenCalled();
  });

  it("shows the empty state when the venue has no events", async () => {
    fetchMyVenue.mockRejectedValue(new MockBackendApiError("Venue lookup should not run", 503));
    fetchVenueEvents.mockResolvedValue(createVenueEventsResult([]));

    await renderVenueEventsPage();

    expect(screen.getByText("Sin eventos todavía")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /crear evento/i })).toBeInTheDocument();
    expect(fetchMyVenue).not.toHaveBeenCalled();
  });

  it("shows a safe events error state when event loading fails", async () => {
    fetchMyVenue.mockRejectedValue(new MockBackendApiError("Venue lookup should not run", 503));
    fetchVenueEvents.mockRejectedValue(new MockBackendApiError("upstream leaked detail", 502));

    await renderVenueEventsPage();

    expect(screen.getByText("No se pudieron cargar los eventos")).toBeInTheDocument();
    expect(screen.getByText("Could not load venue events. Please try again.")).toBeInTheDocument();
    expect(fetchMyVenue).not.toHaveBeenCalled();
  });

  it("preserves visible backend 4xx event-load messages", async () => {
    fetchMyVenue.mockRejectedValue(new MockBackendApiError("Venue lookup should not run", 503));
    fetchVenueEvents.mockRejectedValue(new MockBackendApiError("This venue cannot access that event.", 403));

    await renderVenueEventsPage();

    expect(screen.getByText("No se pudieron cargar los eventos")).toBeInTheDocument();
    expect(screen.getByText("This venue cannot access that event.")).toBeInTheDocument();
    expect(fetchMyVenue).not.toHaveBeenCalled();
  });

  it("renders the event list with deterministic AR schedule text", async () => {
    fetchMyVenue.mockRejectedValue(new MockBackendApiError("Venue lookup should not run", 503));
    fetchVenueEvents.mockResolvedValue(
      createVenueEventsResult([
        {
          id: "event-1",
          name: "Friday Opening",
          status: "ACTIVE",
          startsAt: "2026-06-20T23:00:00.000Z",
          endsAt: "2026-06-21T05:00:00.000Z",
          maxCapacity: 500,
        },
      ]),
    );

    await renderVenueEventsPage();

    expect(screen.getByText("Friday Opening")).toBeInTheDocument();
    expect(
      screen.getByText("20 jun 2026, 20:00 hs → 21 jun 2026, 02:00 hs"),
    ).toBeInTheDocument();
    expect(screen.getByText("500 personas")).toBeInTheDocument();
    expect(fetchMyVenue).not.toHaveBeenCalled();
  });
});
