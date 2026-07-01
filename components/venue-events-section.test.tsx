import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { VenueEventsSection } from "@/components/venue-events-section";

const refreshMock = vi.fn();
const fetchMock = vi.fn();

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: ReactNode; href: string }) => <a href={href}>{children}</a>,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: refreshMock,
  }),
}));

vi.mock("@/components/venue-event-form", () => ({
  VenueEventForm: () => <div data-testid="venue-event-form">Event form</div>,
}));

describe("VenueEventsSection", () => {
  beforeEach(() => {
    refreshMock.mockReset();
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  it("shows Publish for draft events and normalizes the visible status label", () => {
    render(
      <VenueEventsSection
        events={[
          {
            id: "event-1",
            venueId: "venue-1",
            name: "Friday Opening",
            status: "draft",
            startsAt: "2026-06-20T23:00:00.000Z",
            endsAt: "2026-06-21T05:00:00.000Z",
            maxCapacity: 500,
            minAge: 18,
            allowManualDniCheck: true,
            requireGuestList: false,
            createdAt: "2026-06-01T00:00:00.000Z",
            updatedAt: null,
          },
        ]}
        eventsError={null}
      />,
    );

    expect(screen.getByText("Draft")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Publish" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Activate" })).not.toBeInTheDocument();
  });

  it("shows Activate for mixed-case upcoming events", () => {
    render(
      <VenueEventsSection
        events={[
          {
            id: "event-2",
            venueId: "venue-1",
            name: "Saturday Night",
            status: "Upcoming",
            startsAt: "2026-06-21T23:00:00.000Z",
            endsAt: "2026-06-22T05:00:00.000Z",
            maxCapacity: null,
            minAge: 18,
            allowManualDniCheck: true,
            requireGuestList: false,
            createdAt: "2026-06-01T00:00:00.000Z",
            updatedAt: null,
          },
        ]}
        eventsError={null}
      />,
    );

    expect(screen.getByText("Upcoming")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Activate" })).toBeInTheDocument();
  });

  it("shows the backend publish error message and avoids refresh on failure", async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValue({
      ok: false,
      json: async () => ({ message: "Event cannot be published yet." }),
    });

    render(
      <VenueEventsSection
        events={[
          {
            id: "event-3",
            venueId: "venue-1",
            name: "Sunday Closing",
            status: "DRAFT",
            startsAt: "2026-06-22T23:00:00.000Z",
            endsAt: "2026-06-23T05:00:00.000Z",
            maxCapacity: null,
            minAge: 18,
            allowManualDniCheck: true,
            requireGuestList: false,
            createdAt: "2026-06-01T00:00:00.000Z",
            updatedAt: null,
          },
        ]}
        eventsError={null}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Publish" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/venue/events/event-3/publish", { method: "POST" });
    });

    expect(await screen.findByText("Event cannot be published yet.")).toBeInTheDocument();
    expect(refreshMock).not.toHaveBeenCalled();
  });
});
