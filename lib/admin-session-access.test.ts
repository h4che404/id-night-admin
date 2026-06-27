import { beforeEach, describe, expect, it, vi } from "vitest";

const { MockBackendApiError, bootstrapMe, fetchMyVenue, normalizeVenueSummary, resolveBootstrapAdminContextMode, resolveBootstrapPrimaryVenueSummary } = vi.hoisted(() => {
  class MockBackendApiError extends Error {
    status: number;
    code: string | null;

    constructor(message: string, status: number, code: string | null = null) {
      super(message);
      this.name = "BackendApiError";
      this.status = status;
      this.code = code;
    }
  }

  return {
    MockBackendApiError,
    bootstrapMe: vi.fn(),
    fetchMyVenue: vi.fn(),
    normalizeVenueSummary: vi.fn((venue: { id: string; name: string; slug?: string | null; address?: string | null; city?: string | null; active: boolean } | null | undefined) =>
      venue
        ? {
            id: venue.id,
            name: venue.name,
            slug: venue.slug ?? null,
            address: venue.address ?? null,
            city: venue.city ?? null,
            active: venue.active,
          }
        : null,
    ),
    resolveBootstrapAdminContextMode: vi.fn((bootstrap: { adminContextMode?: string | null }) =>
      bootstrap.adminContextMode === "enriched" ? "enriched" : "legacy-fallback",
    ),
    resolveBootstrapPrimaryVenueSummary: vi.fn(
      (bootstrap: {
        adminContextMode?: string | null;
        primaryVenue?: {
          id: string;
          name: string;
          slug?: string | null;
          address?: string | null;
          city?: string | null;
          active: boolean;
        } | null;
      }) =>
        bootstrap.adminContextMode === "enriched" && bootstrap.primaryVenue
          ? {
              id: bootstrap.primaryVenue.id,
              name: bootstrap.primaryVenue.name,
              slug: bootstrap.primaryVenue.slug ?? null,
              address: bootstrap.primaryVenue.address ?? null,
              city: bootstrap.primaryVenue.city ?? null,
              active: bootstrap.primaryVenue.active,
            }
          : null,
    ),
  };
});

vi.mock("@/lib/idnight-backend", () => ({
  BackendApiError: MockBackendApiError,
  bootstrapMe,
  fetchMyVenue,
  normalizeVenueSummary,
  resolveBootstrapAdminContextMode,
  resolveBootstrapPrimaryVenueSummary,
}));

import {
  resolveAdminSessionAccess,
  resolveAdminSessionAccessUncached,
} from "@/lib/admin-session-access";

function createAccessToken(payload: Record<string, unknown>) {
  const encode = (value: Record<string, unknown>) =>
    Buffer.from(JSON.stringify(value)).toString("base64url");

  return `${encode({ alg: "HS256", typ: "JWT" })}.${encode(payload)}.signature`;
}

describe("resolveAdminSessionAccess", () => {
  beforeEach(() => {
    bootstrapMe.mockReset();
    fetchMyVenue.mockReset();
  });

  it("returns a ready state with legacy venue fallback when organization and venue exist", async () => {
    bootstrapMe.mockResolvedValue({
      id: "operator-1",
      email: "owner@example.com",
      adminContextMode: "legacy-fallback",
      status: "active",
      organizationId: "org-1",
      organizationName: "My Org",
    });
    fetchMyVenue.mockResolvedValue({
      id: "venue-1",
      name: "My Venue",
      address: null,
      city: null,
      active: true,
    });

    await expect(
      resolveAdminSessionAccessUncached(
        createAccessToken({
          email: "owner@example.com",
          user_metadata: { firstName: "Ada", lastName: "Lovelace" },
        }),
      ),
    ).resolves.toMatchObject({
      state: "ready",
      venueSource: "legacy-fallback",
      venueSummary: {
        id: "venue-1",
        name: "My Venue",
        slug: null,
        address: null,
        city: null,
        active: true,
      },
      profile: {
        id: "operator-1",
        email: "owner@example.com",
        fullName: "Ada Lovelace",
        role: "Owner",
        active: true,
        venueId: "venue-1",
        venueName: "My Venue",
        organizationId: "org-1",
        organizationName: "My Org",
      },
    });
  });

  it("returns a ready state from enriched bootstrap primaryVenue without calling the legacy venue lookup", async () => {
    bootstrapMe.mockResolvedValue({
      id: "operator-1",
      email: "owner@example.com",
      adminContextMode: "enriched",
      status: "active",
      organizationId: "org-1",
      organizationName: "My Org",
      membershipRole: "Owner",
      primaryVenue: {
        id: "venue-1",
        name: "My Venue",
        slug: "my-venue",
        address: "Av. Siempre Viva 123",
        city: "Buenos Aires",
        active: true,
      },
    });

    await expect(
      resolveAdminSessionAccessUncached(
        createAccessToken({
          email: "owner@example.com",
          user_metadata: { firstName: "Ada", lastName: "Lovelace" },
        }),
      ),
    ).resolves.toMatchObject({
      state: "ready",
      venueSource: "bootstrap",
      venueSummary: {
        id: "venue-1",
        name: "My Venue",
        slug: "my-venue",
        address: "Av. Siempre Viva 123",
        city: "Buenos Aires",
        active: true,
      },
      profile: {
        venueId: "venue-1",
        venueName: "My Venue",
        organizationId: "org-1",
        organizationName: "My Org",
      },
    });

    expect(fetchMyVenue).not.toHaveBeenCalled();
  });
  it("routes authenticated users without an organization to onboarding-needed", async () => {
    bootstrapMe.mockResolvedValue({
      id: "operator-1",
      email: "owner@example.com",
      adminContextMode: "enriched",
      status: "active",
      organizationId: null,
    });

    await expect(
      resolveAdminSessionAccessUncached(createAccessToken({ email: "owner@example.com" })),
    ).resolves.toMatchObject({
      state: "onboarding-needed",
      onboarding: { needsOnboarding: true, hasOperatorProfile: true },
    });

    expect(fetchMyVenue).not.toHaveBeenCalled();
  });
  it("keeps enriched existing-organization users without primaryVenue in non-ready venue recovery", async () => {
    bootstrapMe.mockResolvedValue({
      id: "operator-1",
      email: "owner@example.com",
      adminContextMode: "enriched",
      status: "active",
      organizationId: "org-1",
      organizationName: "My Org",
      membershipRole: "Owner",
      primaryVenue: null,
    });

    await expect(
      resolveAdminSessionAccessUncached(createAccessToken({ email: "owner@example.com" })),
    ).resolves.toMatchObject({
      state: "onboarding-needed",
      onboarding: {
        organizationId: "org-1",
        organizationName: "My Org",
        venueId: null,
        venueName: null,
      },
    });

    expect(fetchMyVenue).not.toHaveBeenCalled();
  });

  it("returns unauthorized for expired sessions instead of forcing a login kind", async () => {
    bootstrapMe.mockRejectedValue(new MockBackendApiError("Unauthorized", 401));

    await expect(
      resolveAdminSessionAccessUncached(createAccessToken({ email: "owner@example.com" })),
    ).resolves.toEqual({ state: "unauthorized" });
  });

  it("returns degraded bootstrap access with derived identity when backend bootstrap fails", async () => {
    bootstrapMe.mockRejectedValue(new MockBackendApiError("Internal Server Error", 500));

    await expect(
      resolveAdminSessionAccessUncached(
        createAccessToken({
          email: "owner@example.com",
          user_metadata: { firstName: "Ada", lastName: "Lovelace" },
        }),
      ),
    ).resolves.toMatchObject({
      state: "degraded",
      reason: "bootstrap",
      identity: {
        email: "owner@example.com",
        firstName: "Ada",
        lastName: "Lovelace",
        fullName: "Ada Lovelace",
      },
    });
  });

  it("returns degraded venue-fallback access when venue lookup fails after bootstrap succeeds", async () => {
    bootstrapMe.mockResolvedValue({
      id: "operator-1",
      email: "owner@example.com",
      status: "active",
      organizationId: "org-1",
      organizationName: "My Org",
    });
    fetchMyVenue.mockRejectedValue(new MockBackendApiError("Venue lookup unavailable", 503));

    await expect(
      resolveAdminSessionAccessUncached(createAccessToken({ email: "owner@example.com" })),
    ).resolves.toMatchObject({
      state: "degraded",
      reason: "venue-fallback",
    });
  });

  it("deduplicates repeated resolution calls for the same request token", async () => {
    bootstrapMe.mockResolvedValue({
      id: "operator-1",
      email: "owner@example.com",
      status: "active",
      organizationId: "org-1",
      organizationName: "My Org",
    });
    fetchMyVenue.mockResolvedValue({ id: "venue-1", name: "My Venue" });

    const accessToken = createAccessToken({ email: "owner@example.com" });

    const [first, second] = await Promise.all([
      resolveAdminSessionAccess(accessToken),
      resolveAdminSessionAccess(accessToken),
    ]);

    expect(first).toMatchObject({ state: "ready" });
    expect(second).toMatchObject({ state: "ready" });
    expect(bootstrapMe).toHaveBeenCalledTimes(1);
    expect(fetchMyVenue).toHaveBeenCalledTimes(1);
  });

  it("returns degraded for unexpected bootstrap errors (e.g. 400, 404)", async () => {
    bootstrapMe.mockRejectedValue(new MockBackendApiError("Bad Request", 400));

    const result = await resolveAdminSessionAccessUncached(
      createAccessToken({ email: "owner@example.com" }),
    );

    expect(result).toMatchObject({ state: "degraded", reason: "bootstrap" });
  });

  it("returns degraded operator-inactive when venue lookup returns 403 OPERATOR_INACTIVE", async () => {
    bootstrapMe.mockResolvedValue({
      id: "operator-1",
      email: "owner@example.com",
      adminContextMode: "legacy-fallback",
      status: "active",
      organizationId: "org-1",
      organizationName: "My Org",
    });
    fetchMyVenue.mockRejectedValue(
      new MockBackendApiError("Operator inactive", 403, "OPERATOR_INACTIVE"),
    );

    const result = await resolveAdminSessionAccessUncached(
      createAccessToken({
        email: "owner@example.com",
        user_metadata: { firstName: "Ada", lastName: "Lovelace" },
      }),
    );

    expect(result).toMatchObject({
      state: "degraded",
      reason: "operator-inactive",
      identity: {
        email: "owner@example.com",
        firstName: "Ada",
        lastName: "Lovelace",
      },
    });
  });

  it("returns unauthorized for generic 403 (non-OPERATOR_INACTIVE) venue errors", async () => {
    bootstrapMe.mockResolvedValue({
      id: "operator-1",
      email: "owner@example.com",
      adminContextMode: "legacy-fallback",
      status: "active",
      organizationId: "org-1",
    });
    fetchMyVenue.mockRejectedValue(
      new MockBackendApiError("Forbidden", 403, "FORBIDDEN"),
    );

    const result = await resolveAdminSessionAccessUncached(
      createAccessToken({ email: "owner@example.com" }),
    );

    expect(result).toMatchObject({ state: "unauthorized" });
  });
});
