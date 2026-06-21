// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const { MockBackendApiError, requireBackendSession, fetchEventReport } = vi.hoisted(() => {
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
    fetchEventReport: vi.fn(),
  };
});

vi.mock("@/lib/auth-session", () => ({
  requireBackendSession,
}));

vi.mock("@/lib/idnight-backend", () => ({
  BackendApiError: MockBackendApiError,
  fetchEventReport,
}));

import { GET } from "@/app/api/venue/events/[id]/report/route";

function createRequest() {
  return new Request("http://localhost/api/venue/events/event-123/report");
}

function createProps(id: string) {
  return { params: Promise.resolve({ id }) };
}

function createRedirectError() {
  return Object.assign(new Error("NEXT_REDIRECT"), {
    digest: "NEXT_REDIRECT;replace;/login;307;",
  });
}

const mockReport = {
  eventId: "event-123",
  eventName: "Friday Opening",
  startsAt: "2026-06-20T23:00:00.000Z",
  endsAt: "2026-06-21T05:00:00.000Z",
  status: "FINISHED",
  totalEntries: 200,
  allowedCount: 185,
  allowedWithWarningCount: 10,
  rejectedCount: 5,
  guestListTotal: 50,
  guestListUsed: 45,
  guestListCancelled: 5,
  incidentCount: 1,
};

describe("/api/venue/events/[id]/report", () => {
  beforeEach(() => {
    requireBackendSession.mockReset();
    requireBackendSession.mockResolvedValue({ accessToken: "admin-token", refreshToken: null });
    fetchEventReport.mockReset();
  });

  it("returns report successfully", async () => {
    fetchEventReport.mockResolvedValue(mockReport);

    const response = await GET(createRequest(), createProps("event-123"));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(mockReport);
    expect(fetchEventReport).toHaveBeenCalledWith("admin-token", "event-123");
  });

  it("preserves backend 4xx error when event not found", async () => {
    fetchEventReport.mockRejectedValue(
      new MockBackendApiError("Event not found.", 404),
    );

    const response = await GET(createRequest(), createProps("event-123"));

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ message: "Event not found." });
  });

  it("returns 500 with safe fallback for backend 5xx", async () => {
    fetchEventReport.mockRejectedValue(
      new MockBackendApiError("internal server error", 503),
    );

    const response = await GET(createRequest(), createProps("event-123"));

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ message: "Could not load the event report." });
  });

  it("returns 500 for unexpected errors", async () => {
    fetchEventReport.mockRejectedValue(new Error("socket hang up"));

    const response = await GET(createRequest(), createProps("event-123"));

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ message: "Could not load the event report." });
  });

  it("rethrows auth redirect", async () => {
    const redirectError = createRedirectError();
    requireBackendSession.mockRejectedValue(redirectError);

    await expect(GET(createRequest(), createProps("event-123"))).rejects.toBe(redirectError);
    expect(fetchEventReport).not.toHaveBeenCalled();
  });
});
