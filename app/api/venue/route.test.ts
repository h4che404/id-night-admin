// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const { readVenueSetupApiAccess, createVenue, revalidateTag } = vi.hoisted(() => ({
  readVenueSetupApiAccess: vi.fn(),
  createVenue: vi.fn(),
  revalidateTag: vi.fn(),
}));

vi.mock("@/lib/auth-session", () => ({
  PROFILE_COOKIE: "idnight_admin_profile",
  readVenueSetupApiAccess,
}));

vi.mock("@/lib/idnight-backend", () => ({
  createVenue,
}));

vi.mock("next/cache", () => ({
  revalidateTag,
}));

import { POST } from "@/app/api/venue/route";

function createRequest(body: BodyInit) {
  return new Request("http://localhost/api/venue", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
}

describe("/api/venue", () => {
  beforeEach(() => {
    readVenueSetupApiAccess.mockReset();
    readVenueSetupApiAccess.mockResolvedValue({
      session: { accessToken: createAccessToken("admin-sub"), refreshToken: null },
    });
    createVenue.mockReset();
    revalidateTag.mockReset();
  });

  it("returns 401 JSON when venue creation is unauthenticated", async () => {
    readVenueSetupApiAccess.mockResolvedValue({
      response: new Response(JSON.stringify({ message: "Authentication required." }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }),
    });

    const response = await POST(createRequest(JSON.stringify({ name: "ID Night" })));

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ message: "Authentication required." });
    expect(createVenue).not.toHaveBeenCalled();
  });

  it("returns 403 JSON when venue creation is blocked by incomplete admin setup", async () => {
    readVenueSetupApiAccess.mockResolvedValue({
      response: new Response(JSON.stringify({ message: "Complete organization setup before using venue APIs." }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      }),
    });

    const response = await POST(createRequest(JSON.stringify({ name: "ID Night" })));

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ message: "Complete organization setup before using venue APIs." });
    expect(createVenue).not.toHaveBeenCalled();
  });

  it("returns 503 JSON when venue creation is blocked by degraded admin context", async () => {
    readVenueSetupApiAccess.mockResolvedValue({
      response: new Response(JSON.stringify({ message: "Admin context is temporarily unavailable. Please retry shortly." }), {
        status: 503,
        headers: { "Content-Type": "application/json" },
      }),
    });

    const response = await POST(createRequest(JSON.stringify({ name: "ID Night" })));

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ message: "Admin context is temporarily unavailable. Please retry shortly." });
    expect(createVenue).not.toHaveBeenCalled();
  });

  it("creates the venue for ready admins who already have an organization", async () => {
    createVenue.mockResolvedValue({ id: "venue-1" });

    const response = await POST(createRequest(JSON.stringify({ name: "ID Night", address: "Main St", city: "Buenos Aires" })));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(response.headers.get("set-cookie")).toContain("idnight_admin_profile=");
    expect(createVenue).toHaveBeenCalledWith(createAccessToken("admin-sub"), {
      name: "ID Night",
      address: "Main St",
      city: "Buenos Aires",
    });
    expect(revalidateTag).toHaveBeenCalledWith("admin-session:admin-sub", {});
  });

  it("treats separate route-handler invocations as independent access-resolution boundaries", async () => {
    vi.resetModules();

    const resolveAdminSessionAccess = vi.fn();
    const resolveAdminSessionAccessUncached = vi.fn();
    const createVenueForBoundary = vi.fn().mockResolvedValue({ id: "venue-1" });
    const currentCookies = {
      get: vi.fn(),
      set: vi.fn(),
      delete: vi.fn(),
    };

    const sharedCache = <T extends (...args: any[]) => any>(fn: T) => {
      const memo = new Map<string, ReturnType<T>>();
      return ((...args: Parameters<T>) => {
        const key = JSON.stringify(args);
        if (!memo.has(key)) {
          memo.set(key, fn(...args));
        }
        return memo.get(key)!;
      }) as T;
    };

    vi.doMock("server-only", () => ({}));
    vi.doMock("react", () => ({ cache: sharedCache }));
    vi.doMock("next/headers", () => ({
      cookies: vi.fn(async () => currentCookies),
    }));
    vi.doUnmock("@/lib/auth-session");
    vi.doMock("@/lib/admin-session-access", () => ({
      resolveAdminSessionAccess,
      resolveAdminSessionAccessUncached,
    }));
    vi.doMock("@/lib/idnight-backend", () => ({
      createVenue: createVenueForBoundary,
      BackendApiError: class BackendApiError extends Error {
        status: number;

        constructor(message: string, status: number) {
          super(message);
          this.status = status;
        }
      },
      fetchOwnerOnboardingStatus: vi.fn(),
    }));

    const { POST: isolatedPost } = await import("@/app/api/venue/route");

    currentCookies.get.mockImplementation((key: string) => {
      if (key === "idnight_admin_supabase_access_token") {
        return { value: "token-123" };
      }

      return undefined;
    });

    resolveAdminSessionAccess.mockRejectedValue(new Error("shared React cache should not be used in route handlers"));

    resolveAdminSessionAccessUncached
      .mockResolvedValueOnce({
        state: "onboarding-needed",
        onboarding: { needsOnboarding: true, hasOperatorProfile: true, organizationId: null },
      })
      .mockResolvedValueOnce({
        state: "ready",
        profile: {
          id: "operator-1",
          email: "owner@example.com",
          firstName: "Ada",
          lastName: "Lovelace",
          fullName: "Ada Lovelace",
          role: "Owner",
          active: true,
          venueId: "venue-1",
          venueName: "ID Night",
          organizationId: "org-1",
          organizationName: "ID Night Group",
          membershipRole: "Owner",
          membershipActive: true,
        },
        venueSummary: { id: "venue-1", name: "ID Night" },
        venueSource: "bootstrap",
      });

    const firstResponse = await isolatedPost(createRequest(JSON.stringify({ name: "ID Night" })));
    const secondResponse = await isolatedPost(createRequest(JSON.stringify({ name: "ID Night" })));

    expect(firstResponse.status).toBe(403);
    expect(await firstResponse.json()).toEqual({
      message: "Complete organization setup before using venue APIs.",
    });
    expect(secondResponse.status).toBe(200);
    expect(await secondResponse.json()).toEqual({ ok: true });
    expect(resolveAdminSessionAccessUncached).toHaveBeenCalledTimes(2);
    expect(resolveAdminSessionAccess).not.toHaveBeenCalled();

    vi.doUnmock("server-only");
    vi.doUnmock("react");
    vi.doUnmock("next/headers");
    vi.doUnmock("@/lib/admin-session-access");
    vi.doUnmock("@/lib/idnight-backend");
  });
});

function createAccessToken(sub: string) {
  const payload = Buffer.from(JSON.stringify({ sub })).toString("base64url");
  return `header.${payload}.signature`;
}
