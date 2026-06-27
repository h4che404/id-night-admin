// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const { MockBackendApiError, readReadyVenueApiAccess, updateMyVenueEntryRules } = vi.hoisted(() => {
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
    readReadyVenueApiAccess: vi.fn(),
    updateMyVenueEntryRules: vi.fn(),
  };
});

vi.mock("@/lib/auth-session", () => ({
  readReadyVenueApiAccess,
}));

vi.mock("@/lib/idnight-backend", () => ({
  BackendApiError: MockBackendApiError,
  fetchMyVenueEntryRules: vi.fn(),
  updateMyVenueEntryRules,
}));

import { PUT } from "@/app/api/venue/entry-rules/route";

const validPayload = {
  active: true,
  minimumAge: 18,
  requireVerifiedAdult: true,
  requireIdentityVerification: true,
  requireValidTicket: false,
  allowManualReview: true,
  notes: "Derivar a supervisor.",
};

function createRequest(body: BodyInit) {
  return new Request("http://localhost/api/venue/entry-rules", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body,
  });
}

describe("PUT /api/venue/entry-rules", () => {
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
        venueId: "venue-1",
        venueName: "My Venue",
        organizationId: "org-1",
        organizationName: "My Org",
        membershipRole: "Owner",
        membershipActive: true,
      },
    });
    updateMyVenueEntryRules.mockReset();
  });

  it("rejects invalid JSON payloads", async () => {
    const response = await PUT(createRequest("{"));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ message: "El cuerpo debe ser JSON valido." });
    expect(updateMyVenueEntryRules).not.toHaveBeenCalled();
  });

  it("rejects invalid minimumAge values", async () => {
    const response = await PUT(
      createRequest(
        JSON.stringify({
          ...validPayload,
          minimumAge: 18.5,
        }),
      ),
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ message: "La edad mínima debe ser un entero entre 0 y 120." });
    expect(updateMyVenueEntryRules).not.toHaveBeenCalled();
  });

  it("preserves backend error status codes", async () => {
    updateMyVenueEntryRules.mockRejectedValue(new MockBackendApiError("Backend validation failed.", 422));

    const response = await PUT(createRequest(JSON.stringify(validPayload)));

    expect(response.status).toBe(422);
    expect(await response.json()).toEqual({ message: "Backend validation failed." });
  });

  it("forwards valid payloads with the backend access token", async () => {
    updateMyVenueEntryRules.mockResolvedValue(validPayload);

    const response = await PUT(createRequest(JSON.stringify(validPayload)));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(updateMyVenueEntryRules).toHaveBeenCalledWith("admin-token", validPayload);
  });
});
