import { cloneElement, isValidElement, type ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { requireReadyPageAccess, fetchVenueIncidents } = vi.hoisted(() => ({
  requireReadyPageAccess: vi.fn(),
  fetchVenueIncidents: vi.fn(),
}));

vi.mock("@/lib/auth-session", () => ({
  requireReadyPageAccess,
}));

vi.mock("@/lib/idnight-backend", () => ({
  fetchVenueIncidents,
}));

import EventIncidentsPage from "@/app/(app)/venue/events/[id]/incidents/page";
import { resolveAsyncNode } from "@/test-support/resolve-async-node";


async function renderPage(eventId = "event-1", page = "1") {
  const rendered = await EventIncidentsPage({
    params: Promise.resolve({ id: eventId }),
    searchParams: Promise.resolve({ page }),
  });
  return render(await resolveAsyncNode(rendered));
}

describe("EventIncidentsPage", () => {
  beforeEach(() => {
    requireReadyPageAccess.mockReset();
    requireReadyPageAccess.mockResolvedValue({
      session: { accessToken: "admin-token", refreshToken: null },
    });
    fetchVenueIncidents.mockReset();
  });

  it("renders incident timestamps in Argentina local time with no UTC label", async () => {
    fetchVenueIncidents.mockResolvedValue({
      items: [
        {
          id: "incident-1",
          title: "Puerta trabada",
          description: null,
          status: "open",
          createdAt: "2026-07-04T23:00:00.000Z", // 20:00 hs AR
        },
      ],
      total: 1,
      page: 1,
      pageSize: 20,
    });

    await renderPage();

    expect(screen.getByText("4 jul 2026, 20:00 hs")).toBeInTheDocument();
    expect(screen.queryByText(/UTC/)).not.toBeInTheDocument();
  });

  it("falls back to the invalid-date marker for an unparseable timestamp", async () => {
    fetchVenueIncidents.mockResolvedValue({
      items: [
        {
          id: "incident-1",
          title: "Puerta trabada",
          description: null,
          status: "open",
          createdAt: "not-a-date",
        },
      ],
      total: 1,
      page: 1,
      pageSize: 20,
    });

    await renderPage();

    expect(screen.getByText("—")).toBeInTheDocument();
  });
});
