// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const { MockBackendApiError, readReadyVenueApiAccess, activateVenueEvent, publishVenueEvent, finishVenueEvent, cancelVenueEvent } = vi.hoisted(() => {
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
    activateVenueEvent: vi.fn(),
    publishVenueEvent: vi.fn(),
    finishVenueEvent: vi.fn(),
    cancelVenueEvent: vi.fn(),
  };
});

vi.mock("@/lib/auth-session", () => ({
  readReadyVenueApiAccess,
}));

vi.mock("@/lib/idnight-backend", () => ({
  activateVenueEvent,
  BackendApiError: MockBackendApiError,
  cancelVenueEvent,
  finishVenueEvent,
  publishVenueEvent,
}));

import { POST } from "@/app/api/venue/events/[id]/[action]/route";

function createRequest(id: string, action: string) {
  return new Request(`http://localhost/api/venue/events/${id}/${action}`, {
    method: "POST",
  });
}

function createParams(id: string, action: string) {
  return { params: Promise.resolve({ id, action }) };
}

describe("/api/venue/events/[id]/[action] POST", () => {
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

    activateVenueEvent.mockReset();
    publishVenueEvent.mockReset();
    finishVenueEvent.mockReset();
    cancelVenueEvent.mockReset();
  });

  it("rejects invalid actions before calling the backend", async () => {
    const response = await POST(createRequest("event-1", "archive"), createParams("event-1", "archive"));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ message: "Invalid action: archive." });
    expect(publishVenueEvent).not.toHaveBeenCalled();
    expect(activateVenueEvent).not.toHaveBeenCalled();
  });

  it("publishes venue events through the backend client", async () => {
    publishVenueEvent.mockResolvedValue({ id: "event-1", status: "UPCOMING" });

    const response = await POST(createRequest("event-1", "publish"), createParams("event-1", "publish"));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(publishVenueEvent).toHaveBeenCalledWith("admin-token", "event-1");
    expect(activateVenueEvent).not.toHaveBeenCalled();
  });

  it("preserves backend 4xx publish errors", async () => {
    publishVenueEvent.mockRejectedValue(new MockBackendApiError("Event cannot be published yet.", 409));

    const response = await POST(createRequest("event-1", "publish"), createParams("event-1", "publish"));

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ message: "Event cannot be published yet." });
  });

  it("returns a safe fallback for unexpected publish failures", async () => {
    publishVenueEvent.mockRejectedValue(new Error("socket hang up"));

    const response = await POST(createRequest("event-1", "publish"), createParams("event-1", "publish"));

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ message: "Could not publish the event." });
  });
});
