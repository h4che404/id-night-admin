import { beforeEach, describe, expect, it, vi } from "vitest";

const { MockBackendApiError, bootstrapMe, fetchMyVenue } = vi.hoisted(() => {
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
    bootstrapMe: vi.fn(),
    fetchMyVenue: vi.fn(),
  };
});

vi.mock("@/lib/idnight-backend", () => ({
  BackendApiError: MockBackendApiError,
  bootstrapMe,
  fetchMyVenue,
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
      status: "active",
      organizationId: "org-1",
      organizationName: "My Org",
    });
    fetchMyVenue.mockResolvedValue({ id: "venue-1", name: "My Venue" });

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

  it("routes authenticated users without an organization to onboarding-needed", async () => {
    bootstrapMe.mockResolvedValue({
      id: "operator-1",
      email: "owner@example.com",
      status: "active",
      organizationId: null,
    });

    await expect(
      resolveAdminSessionAccessUncached(createAccessToken({ email: "owner@example.com" })),
    ).resolves.toMatchObject({
      state: "onboarding-needed",
      onboarding: { needsOnboarding: true, hasOperatorProfile: true },
    });
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

  it("rethrows unexpected admin profile errors", async () => {
    bootstrapMe.mockRejectedValue(new MockBackendApiError("Bad Request", 400));

    await expect(
      resolveAdminSessionAccessUncached(createAccessToken({ email: "owner@example.com" })),
    ).rejects.toMatchObject({
      message: "Bad Request",
      status: 400,
    });
  });
});
