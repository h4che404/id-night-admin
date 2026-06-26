import { beforeEach, describe, expect, it, vi } from "vitest";

const { MockBackendApiError, requireBackendSession, bootstrapMe, fetchVenues } = vi.hoisted(() => {
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
    bootstrapMe: vi.fn(),
    fetchVenues: vi.fn(),
  };
});

vi.mock("@/lib/idnight-backend", () => ({
  BackendApiError: MockBackendApiError,
  bootstrapMe,
  fetchVenues,
}));

import { resolveAdminSessionAccess } from "@/lib/admin-session-access";

describe("resolveAdminSessionAccess", () => {
  beforeEach(() => {
    bootstrapMe.mockReset();
    fetchVenues.mockReset();
  });

  it("returns admin access when the operator profile exists", async () => {
    bootstrapMe.mockResolvedValue({
      id: "operator-1",
      email: "owner@example.com",
      status: "active",
      organization: { id: "org-1", name: "My Org" },
    });
    fetchVenues.mockResolvedValue([{ id: "venue-1", name: "My Venue" }]);

    await expect(resolveAdminSessionAccess("valid-token")).resolves.toMatchObject({
      kind: "admin",
      profile: {
        id: "operator-1",
        email: "owner@example.com",
        fullName: "owner@example.com",
        role: "Owner",
        active: true,
        venueId: "venue-1",
        venueName: "My Venue",
        organizationId: "org-1",
        organizationName: "My Org",
      },
    });
  });

  it("routes authenticated users without operators to onboarding", async () => {
    bootstrapMe.mockResolvedValue({
      id: "operator-1",
      email: "owner@example.com",
      status: "active",
      organization: null,
    });

    await expect(resolveAdminSessionAccess("pending-owner-token")).resolves.toMatchObject({
      kind: "onboarding",
      onboarding: { needsOnboarding: true, hasOperatorProfile: true },
    });
  });

  it("keeps invalid sessions on login instead of looping", async () => {
    bootstrapMe.mockRejectedValue(new MockBackendApiError("Unauthorized", 401));

    await expect(resolveAdminSessionAccess("expired-token")).resolves.toEqual({ kind: "login" });
  });

  it("keeps non-onboarding access failures on login", async () => {
    bootstrapMe.mockRejectedValue(new MockBackendApiError("Forbidden", 403));

    await expect(resolveAdminSessionAccess("guard-token")).resolves.toEqual({ kind: "login" });
  });

  it("returns degraded kind for server errors", async () => {
    bootstrapMe.mockRejectedValue(new MockBackendApiError("Internal Server Error", 500));

    await expect(resolveAdminSessionAccess("broken-token")).resolves.toEqual({ kind: "degraded" });
  });

  it("rethrows unexpected admin profile errors", async () => {
    bootstrapMe.mockRejectedValue(new MockBackendApiError("Bad Request", 400));

    await expect(resolveAdminSessionAccess("broken-token")).rejects.toMatchObject({
      message: "Bad Request",
      status: 400,
    });
  });
});
