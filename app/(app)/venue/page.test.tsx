import { cloneElement, isValidElement, type ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

function createRedirectError(path: string) {
  return Object.assign(new Error("NEXT_REDIRECT"), {
    digest: `NEXT_REDIRECT;replace;${path};307;`,
  });
}


const { MockBackendApiError, requireBackendProfile, requireAdminAccess, canRecoverVenueSetup, fetchMyVenue, fetchDashboardMetrics } = vi.hoisted(() => {
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
      throw new Error("Legacy ready-only helper should not be used by venue page");
    }),
    requireAdminAccess: vi.fn(),
    canRecoverVenueSetup: vi.fn((access: { onboarding?: { organizationId?: string | null } }) => access.onboarding?.organizationId != null),
    fetchMyVenue: vi.fn(),
    fetchDashboardMetrics: vi.fn(),
  };
});

vi.mock("@/lib/auth-session", () => ({
  requireBackendProfile,
  requireAdminAccess,
  canRecoverVenueSetup,
}));

vi.mock("@/lib/idnight-backend", () => ({
  BackendApiError: MockBackendApiError,
  fetchMyVenue,
  fetchDashboardMetrics,
}));

vi.mock("@/components/venue-create-form", () => ({
  VenueCreateForm: () => <div data-testid="venue-create-form">Venue create form</div>,
}));

vi.mock("@/components/ui-kit", () => ({
  Badge: ({ label }: { label: string }) => <span>{label}</span>,
  EmptyState: ({ title, description }: { title: string; description?: string }) => (
    <div>
      <h2>{title}</h2>
      {description ? <p>{description}</p> : null}
    </div>
  ),
  SectionHeader: ({ title, description }: { title: string; description?: string }) => (
    <div>
      <h1>{title}</h1>
      {description ? <p>{description}</p> : null}
    </div>
  ),
  Surface: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("next/navigation", () => ({
  redirect: (path: string) => {
    throw createRedirectError(path);
  },
}));

import VenuePage from "@/app/(app)/venue/page";
import { resolveAsyncNode } from "@/test-support/resolve-async-node";

describe("VenuePage", () => {
  beforeEach(() => {
    requireAdminAccess.mockReset();
    canRecoverVenueSetup.mockClear();
    requireBackendProfile.mockClear();
    fetchMyVenue.mockReset();
    fetchDashboardMetrics.mockReset();
  });

  it("renders the ready venue dashboard from access.venueSummary without re-fetching venue details", async () => {
    requireAdminAccess.mockResolvedValue({
      session: { accessToken: "admin-token", refreshToken: null },
      access: {
        state: "ready",
        venueSource: "bootstrap",
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
          firstName: "Ada",
          lastName: "Lovelace",
          fullName: "Ada Lovelace",
          role: "Owner",
          active: true,
          venueId: "venue-1",
          venueName: "ID Night",
          organizationId: "org-1",
          organizationName: "My Org",
          membershipRole: "Owner",
          membershipActive: true,
        },
      },
    });
    fetchMyVenue.mockRejectedValue(new MockBackendApiError("Venue lookup should not run", 503));
    fetchDashboardMetrics.mockResolvedValue({
      venueId: "venue-1",
      totalEvents: 4,
      upcomingEvents: 1,
      activeEvents: 2,
      totalOperators: 3,
      openIncidents: 1,
      totalGuestEntriesAllEvents: 250,
      admissionsToday: 48,
    });

    render(await resolveAsyncNode(await VenuePage()));

    expect(screen.getByRole("heading", { name: "ID Night" })).toBeInTheDocument();
    expect(screen.getByText("Main St 123, Buenos Aires")).toBeInTheDocument();
    expect(screen.getByText("Activo")).toBeInTheDocument();
    expect(screen.queryByTestId("venue-create-form")).not.toBeInTheDocument();
    expect(fetchMyVenue).not.toHaveBeenCalled();
    expect(fetchDashboardMetrics).toHaveBeenCalledWith("admin-token");

    expect(screen.getByText("Eventos totales")).toBeInTheDocument();
    expect(screen.getByText("Activos ahora")).toBeInTheDocument();
    expect(screen.getByText("Ingresos hoy")).toBeInTheDocument();
    expect(screen.getByText("Operadores")).toBeInTheDocument();
    expect(screen.getByText("Incidentes abiertos")).toBeInTheDocument();
  });

  it("shows a translated message when dashboard metrics are unavailable", async () => {
    requireAdminAccess.mockResolvedValue({
      session: { accessToken: "admin-token", refreshToken: null },
      access: {
        state: "ready",
        venueSource: "bootstrap",
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
          firstName: "Ada",
          lastName: "Lovelace",
          fullName: "Ada Lovelace",
          role: "Owner",
          active: true,
          venueId: "venue-1",
          venueName: "ID Night",
          organizationId: "org-1",
          organizationName: "My Org",
          membershipRole: "Owner",
          membershipActive: true,
        },
      },
    });
    fetchMyVenue.mockRejectedValue(new MockBackendApiError("Venue lookup should not run", 503));
    fetchDashboardMetrics.mockRejectedValue(new MockBackendApiError("backend down", 503));

    render(await resolveAsyncNode(await VenuePage()));

    expect(
      screen.getByText("Métricas no disponibles — el backend todavía no está conectado."),
    ).toBeInTheDocument();
  });

  it("keeps the venue recovery create-state for existing organizations without a venue", async () => {
    requireAdminAccess.mockResolvedValue({
      session: { accessToken: "admin-token", refreshToken: null },
      access: {
        state: "onboarding-needed",
        onboarding: {
          needsOnboarding: true,
          hasOperatorProfile: true,
          operatorRole: "Owner",
          organizationId: "org-1",
          organizationName: "My Org",
          venueId: null,
          venueName: null,
        },
      },
    });

    render(await VenuePage());

    expect(screen.getByText("Creá tu boliche")).toBeInTheDocument();
    expect(screen.getByTestId("venue-create-form")).toBeInTheDocument();
    expect(fetchMyVenue).not.toHaveBeenCalled();
    expect(fetchDashboardMetrics).not.toHaveBeenCalled();
  });

  it("still redirects missing-organization onboarding to the owner onboarding flow", async () => {
    requireAdminAccess.mockResolvedValue({
      session: { accessToken: "admin-token", refreshToken: null },
      access: {
        state: "onboarding-needed",
        onboarding: {
          needsOnboarding: true,
          hasOperatorProfile: true,
          operatorRole: "Owner",
          organizationId: null,
          organizationName: null,
          venueId: null,
          venueName: null,
        },
      },
    });

    await expect(VenuePage()).rejects.toMatchObject({
      digest: "NEXT_REDIRECT;replace;/owner-onboarding;307;",
    });
    expect(fetchMyVenue).not.toHaveBeenCalled();
  });

  it("stops before venue fetches when access is degraded because the layout owns the limited shell", async () => {
    requireAdminAccess.mockResolvedValue({
      session: { accessToken: "admin-token", refreshToken: null },
      access: {
        state: "degraded",
        reason: "bootstrap",
        identity: {
          fullName: "Ada Lovelace",
          email: "admin@idnight.app",
          firstName: "Ada",
          lastName: "Lovelace",
        },
      },
    });

    const { container } = render(await VenuePage());

    expect(container).toBeEmptyDOMElement();
    expect(fetchMyVenue).not.toHaveBeenCalled();
    expect(fetchDashboardMetrics).not.toHaveBeenCalled();
  });
});
