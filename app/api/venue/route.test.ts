// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const { readReadyVenueApiAccess, createVenue } = vi.hoisted(() => ({
  readReadyVenueApiAccess: vi.fn(),
  createVenue: vi.fn(),
}));

vi.mock("@/lib/auth-session", () => ({
  readReadyVenueApiAccess,
}));

vi.mock("@/lib/idnight-backend", () => ({
  createVenue,
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
    readReadyVenueApiAccess.mockReset();
    readReadyVenueApiAccess.mockResolvedValue({
      session: { accessToken: "admin-token", refreshToken: null },
      profile: {
        id: "admin-1",
        email: "admin@idnight.app",
        fullName: "Admin User",
        role: "Owner",
        active: true,
        venueId: null,
        venueName: null,
        organizationId: "org-1",
        organizationName: "My Org",
        membershipRole: "Owner",
        membershipActive: true,
      },
    });
    createVenue.mockReset();
  });

  it("returns 401 JSON when venue creation is unauthenticated", async () => {
    readReadyVenueApiAccess.mockResolvedValue({
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
    readReadyVenueApiAccess.mockResolvedValue({
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
    readReadyVenueApiAccess.mockResolvedValue({
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
    expect(createVenue).toHaveBeenCalledWith("admin-token", "org-1", {
      name: "ID Night",
      address: "Main St",
      city: "Buenos Aires",
    });
  });
});
