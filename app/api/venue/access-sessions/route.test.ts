// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const { MockBackendApiError, readReadyVenueApiAccess, fetchAccessSessions } = vi.hoisted(() => {
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
    fetchAccessSessions: vi.fn(),
  };
});

vi.mock("@/lib/auth-session", () => ({
  readReadyVenueApiAccess,
}));

vi.mock("@/lib/idnight-backend", () => ({
  BackendApiError: MockBackendApiError,
  fetchAccessSessions,
}));

import { GET } from "@/app/api/venue/access-sessions/route";

function createRequest(search = "") {
  return new Request(`http://localhost/api/venue/access-sessions${search}`);
}

const SESSION_FIXTURE = [
  {
    id: "session-1",
    occurredAt: "2026-06-21T02:00:00.000Z",
    method: "IDNIGHT_VERIFIED",
    result: "ALLOWED",
    warningType: null,
    operatorName: "Juan",
    deviceName: "Gate A",
    eventId: "event-1",
    eventName: "Friday Opening",
  },
];

function createAccessSessionsResult(items = SESSION_FIXTURE) {
  return {
    items,
    total: items.length,
    page: 1,
    pageSize: 20,
  };
}

describe("/api/venue/access-sessions", () => {
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
    fetchAccessSessions.mockReset();
  });

  it("returns sessions for GET with no filters", async () => {
    fetchAccessSessions.mockResolvedValue(createAccessSessionsResult());

    const response = await GET(createRequest());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(SESSION_FIXTURE);
    expect(fetchAccessSessions).toHaveBeenCalledWith("admin-token", {
      eventId: undefined,
      operatorId: undefined,
      status: undefined,
    });
  });

  it("forwards operatorId filter to fetchAccessSessions", async () => {
    fetchAccessSessions.mockResolvedValue(createAccessSessionsResult([]));

    await GET(createRequest("?operatorId=operator-1"));

    expect(fetchAccessSessions).toHaveBeenCalledWith(
      "admin-token",
      expect.objectContaining({ operatorId: "operator-1" }),
    );
  });

  it("forwards status filter to fetchAccessSessions", async () => {
    fetchAccessSessions.mockResolvedValue(createAccessSessionsResult([]));

    await GET(createRequest("?status=open"));

    expect(fetchAccessSessions).toHaveBeenCalledWith(
      "admin-token",
      expect.objectContaining({ status: "open" }),
    );
  });

  it("forwards eventId filter to fetchAccessSessions", async () => {
    fetchAccessSessions.mockResolvedValue(createAccessSessionsResult([]));

    await GET(createRequest("?eventId=event-1"));

    expect(fetchAccessSessions).toHaveBeenCalledWith(
      "admin-token",
      expect.objectContaining({
        eventId: "event-1",
      }),
    );
  });

  it("returns empty array when backend returns empty list", async () => {
    fetchAccessSessions.mockResolvedValue(createAccessSessionsResult([]));

    const response = await GET(createRequest());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([]);
  });

  it("preserves backend 4xx error status and message", async () => {
    fetchAccessSessions.mockRejectedValue(
      new MockBackendApiError("Access sessions not available.", 404),
    );

    const response = await GET(createRequest());

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ message: "Access sessions not available." });
  });

  it("returns 500 with safe fallback message for backend 5xx", async () => {
    fetchAccessSessions.mockRejectedValue(
      new MockBackendApiError("database exploded", 503),
    );

    const response = await GET(createRequest());

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ message: "Could not load access sessions." });
  });

  it("returns 500 with safe fallback for unexpected errors", async () => {
    fetchAccessSessions.mockRejectedValue(new Error("socket hang up"));

    const response = await GET(createRequest());

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ message: "Could not load access sessions." });
  });

});
