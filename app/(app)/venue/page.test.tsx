import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { MockBackendApiError, requireBackendProfile, requireAdminAccess, fetchMyVenue, fetchDashboardMetrics } = vi.hoisted(() => {
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
    fetchMyVenue: vi.fn(),
    fetchDashboardMetrics: vi.fn(),
  };
});

vi.mock("@/lib/auth-session", () => ({
  requireBackendProfile,
  requireAdminAccess,
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

import VenuePage from "@/app/(app)/venue/page";

describe("VenuePage", () => {
  beforeEach(() => {
    requireAdminAccess.mockReset();
    requireBackendProfile.mockClear();
    fetchMyVenue.mockReset();
    fetchDashboardMetrics.mockReset();
  });

  it("keeps the create-state flow for ready users whose organization still has no venue", async () => {
    requireAdminAccess.mockResolvedValue({
      session: { accessToken: "admin-token", refreshToken: null },
      access: {
        state: "ready",
        venueSource: "legacy-fallback",
        profile: {
          id: "admin-1",
          email: "admin@idnight.app",
          firstName: "Ada",
          lastName: "Lovelace",
          fullName: "Ada Lovelace",
          role: "Owner",
          active: true,
          venueId: null,
          venueName: null,
          organizationId: "org-1",
          organizationName: "My Org",
          membershipRole: "Owner",
          membershipActive: true,
        },
      },
    });
    fetchMyVenue.mockRejectedValue(new MockBackendApiError("Venue not found", 404));

    render(await VenuePage());

    expect(screen.getByText("Creá tu boliche")).toBeInTheDocument();
    expect(screen.getByTestId("venue-create-form")).toBeInTheDocument();
    expect(fetchDashboardMetrics).not.toHaveBeenCalled();
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
