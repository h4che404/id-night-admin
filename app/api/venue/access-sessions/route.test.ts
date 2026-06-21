// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const { MockBackendApiError, requireBackendSession, fetchAccessSessions } = vi.hoisted(() => {
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
    fetchAccessSessions: vi.fn(),
  };
});

vi.mock("@/lib/auth-session", () => ({
  requireBackendSession,
}));

vi.mock("@/lib/idnight-backend", () => ({
  BackendApiError: MockBackendApiError,
  fetchAccessSessions,
}));

import { GET } from "@/app/api/venue/access-sessions/route";

function createRequest(search = "") {
  return new Request(`http://localhost/api/venue/access-sessions${search}`);
}

function createRedirectError() {
  return Object.assign(new Error("NEXT_REDIRECT"), {
    digest: "NEXT_REDIRECT;replace;/login;307;",
  });
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

describe("/api/venue/access-sessions", () => {
  beforeEach(() => {
    requireBackendSession.mockReset();
    requireBackendSession.mockResolvedValue({ accessToken: "admin-token", refreshToken: null });
    fetchAccessSessions.mockReset();
  });

  it("returns sessions for GET with no filters", async () => {
    fetchAccessSessions.mockResolvedValue(SESSION_FIXTURE);

    const response = await GET(createRequest());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(SESSION_FIXTURE);
    expect(fetchAccessSessions).toHaveBeenCalledWith("admin-token", {
      eventId: undefined,
      method: undefined,
      result: undefined,
      fromDate: undefined,
      toDate: undefined,
    });
  });

  it("forwards method filter to fetchAccessSessions", async () => {
    fetchAccessSessions.mockResolvedValue([]);

    await GET(createRequest("?method=IDNIGHT_VERIFIED"));

    expect(fetchAccessSessions).toHaveBeenCalledWith(
      "admin-token",
      expect.objectContaining({ method: "IDNIGHT_VERIFIED" }),
    );
  });

  it("forwards result filter to fetchAccessSessions", async () => {
    fetchAccessSessions.mockResolvedValue([]);

    await GET(createRequest("?result=REJECTED"));

    expect(fetchAccessSessions).toHaveBeenCalledWith(
      "admin-token",
      expect.objectContaining({ result: "REJECTED" }),
    );
  });

  it("forwards eventId, fromDate, toDate filters to fetchAccessSessions", async () => {
    fetchAccessSessions.mockResolvedValue([]);

    await GET(createRequest("?eventId=event-1&fromDate=2026-06-01&toDate=2026-06-30"));

    expect(fetchAccessSessions).toHaveBeenCalledWith(
      "admin-token",
      expect.objectContaining({
        eventId: "event-1",
        fromDate: "2026-06-01",
        toDate: "2026-06-30",
      }),
    );
  });

  it("returns empty array when backend returns empty list", async () => {
    fetchAccessSessions.mockResolvedValue([]);

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

  it("rethrows NEXT_REDIRECT raised by requireBackendSession", async () => {
    const redirectError = createRedirectError();
    requireBackendSession.mockRejectedValue(redirectError);

    await expect(GET(createRequest())).rejects.toBe(redirectError);

    expect(fetchAccessSessions).not.toHaveBeenCalled();
  });
});
