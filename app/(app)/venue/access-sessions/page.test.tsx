import { cloneElement, isValidElement, type ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { requireReadyPageAccess, fetchAccessSessions, fetchVenueEvents } = vi.hoisted(() => ({
  requireReadyPageAccess: vi.fn(),
  fetchAccessSessions: vi.fn(),
  fetchVenueEvents: vi.fn(),
}));

vi.mock("@/lib/auth-session", () => ({
  requireReadyPageAccess,
}));

vi.mock("@/lib/idnight-backend", () => ({
  fetchAccessSessions,
  fetchVenueEvents,
}));

vi.mock("@/components/access-sessions-section", () => ({
  AccessSessionsSection: ({ initialError }: { initialError: string | null }) => (
    <div data-testid="access-sessions-section">{initialError}</div>
  ),
}));

import AccessSessionsPage from "@/app/(app)/venue/access-sessions/page";
import { resolveAsyncNode } from "@/test-support/resolve-async-node";


async function renderPage(page = "1") {
  const rendered = await AccessSessionsPage({ searchParams: Promise.resolve({ page }) });
  return render(await resolveAsyncNode(rendered));
}

describe("AccessSessionsPage", () => {
  beforeEach(() => {
    requireReadyPageAccess.mockReset();
    requireReadyPageAccess.mockResolvedValue({
      session: { accessToken: "admin-token", refreshToken: null },
      venueSummary: { id: "venue-1", name: "ID Night", slug: "id-night", address: null, city: null, active: true },
    });
    fetchAccessSessions.mockReset();
    fetchVenueEvents.mockReset();
    fetchVenueEvents.mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 20 });
  });

  it("renders the page header in Spanish", async () => {
    fetchAccessSessions.mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 20 });

    await renderPage();

    expect(screen.getByText("Ingresos")).toBeInTheDocument();
    expect(screen.getByText("Historial de accesos")).toBeInTheDocument();
    expect(screen.getByText("Registros de ingreso para ID Night.")).toBeInTheDocument();
  });

  it("shows a translated fallback error when access sessions fail to load without a message", async () => {
    fetchAccessSessions.mockRejectedValue("not-an-error-instance");

    await renderPage();

    expect(screen.getByText("No se pudieron cargar los ingresos.")).toBeInTheDocument();
  });
});
