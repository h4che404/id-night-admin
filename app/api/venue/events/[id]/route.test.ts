// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const { MockBackendApiError, readReadyVenueApiAccess, updateVenueEvent } = vi.hoisted(() => {
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
    updateVenueEvent: vi.fn(),
  };
});

vi.mock("@/lib/auth-session", () => ({
  readReadyVenueApiAccess,
}));

vi.mock("@/lib/idnight-backend", () => ({
  BackendApiError: MockBackendApiError,
  updateVenueEvent,
}));

import { PATCH } from "@/app/api/venue/events/[id]/route";

function createRequest(body: BodyInit, id: string) {
  return new Request(`http://localhost/api/venue/events/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body,
  });
}

function createParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

describe("/api/venue/events/[id]", () => {
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
    updateVenueEvent.mockReset();
  });

  it("returns 401 JSON when venue event updates are unauthenticated", async () => {
    readReadyVenueApiAccess.mockResolvedValue({
      response: new Response(JSON.stringify({ message: "Authentication required." }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }),
    });

    const response = await PATCH(createRequest(JSON.stringify({ name: "Friday Opening" }), "event-1"), createParams("event-1"));

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ message: "Authentication required." });
    expect(updateVenueEvent).not.toHaveBeenCalled();
  });

  it("returns 403 JSON when venue event updates are blocked by incomplete admin setup", async () => {
    readReadyVenueApiAccess.mockResolvedValue({
      response: new Response(JSON.stringify({ message: "Complete organization setup before using venue APIs." }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      }),
    });

    const response = await PATCH(createRequest(JSON.stringify({ name: "Friday Opening" }), "event-1"), createParams("event-1"));

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ message: "Complete organization setup before using venue APIs." });
    expect(updateVenueEvent).not.toHaveBeenCalled();
  });

  it("returns 503 JSON when venue event updates are blocked by degraded admin context", async () => {
    readReadyVenueApiAccess.mockResolvedValue({
      response: new Response(JSON.stringify({ message: "Admin context is temporarily unavailable. Please retry shortly." }), {
        status: 503,
        headers: { "Content-Type": "application/json" },
      }),
    });

    const response = await PATCH(createRequest(JSON.stringify({ name: "Friday Opening" }), "event-1"), createParams("event-1"));

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ message: "Admin context is temporarily unavailable. Please retry shortly." });
    expect(updateVenueEvent).not.toHaveBeenCalled();
  });

  it("rejects invalid JSON bodies", async () => {
    const response = await PATCH(createRequest("{", "event-1"), createParams("event-1"));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ message: "The request body must be valid JSON." });
    expect(updateVenueEvent).not.toHaveBeenCalled();
  });

  it("rejects when no fields are provided", async () => {
    const response = await PATCH(createRequest(JSON.stringify({}), "event-1"), createParams("event-1"));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ message: "At least one field must be provided." });
    expect(updateVenueEvent).not.toHaveBeenCalled();
  });

  it("rejects when end is before start", async () => {
    const response = await PATCH(
      createRequest(
        JSON.stringify({
          startsAt: "2026-06-21T05:00:00.000Z",
          endsAt: "2026-06-20T23:00:00.000Z",
        }),
        "event-1",
      ),
      createParams("event-1"),
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ message: "Event end must be after the start." });
    expect(updateVenueEvent).not.toHaveBeenCalled();
  });

  it("rejects invalid datetimes", async () => {
    const response = await PATCH(
      createRequest(
        JSON.stringify({
          startsAt: "not-a-date",
        }),
        "event-1",
      ),
      createParams("event-1"),
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      message: "Event start must be a valid ISO datetime with a timezone.",
    });
    expect(updateVenueEvent).not.toHaveBeenCalled();
  });

  it("rejects impossible timezone offsets on update", async () => {
    const response = await PATCH(
      createRequest(
        JSON.stringify({
          startsAt: "2026-06-20T23:00:00+00:99",
        }),
        "event-1",
      ),
      createParams("event-1"),
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      message: "Event start must be a valid ISO datetime with a timezone.",
    });
    expect(updateVenueEvent).not.toHaveBeenCalled();
  });

  it("rejects non-integer maxCapacity", async () => {
    const response = await PATCH(
      createRequest(
        JSON.stringify({
          maxCapacity: 12.5,
        }),
        "event-1",
      ),
      createParams("event-1"),
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ message: "Max capacity must be a positive whole number." });
    expect(updateVenueEvent).not.toHaveBeenCalled();
  });

  it("accepts null maxCapacity so capacity can be cleared", async () => {
    updateVenueEvent.mockResolvedValue({ id: "event-1" });

    const response = await PATCH(
      createRequest(
        JSON.stringify({
          maxCapacity: null,
        }),
        "event-1",
      ),
      createParams("event-1"),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(updateVenueEvent).toHaveBeenCalledWith("admin-token", "venue-1", "event-1", {
      maxCapacity: null,
    });
  });

  it("accepts a partial update with only name", async () => {
    updateVenueEvent.mockResolvedValue({ id: "event-1" });

    const response = await PATCH(
      createRequest(JSON.stringify({ name: "  Saturday Night  " }), "event-1"),
      createParams("event-1"),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(updateVenueEvent).toHaveBeenCalledWith("admin-token", "venue-1", "event-1", { name: "Saturday Night" });
  });

  it("forwards successful updates to the backend", async () => {
    updateVenueEvent.mockResolvedValue({ id: "event-1" });

    const response = await PATCH(
      createRequest(
        JSON.stringify({
          name: "Friday Opening",
          startsAt: "2026-06-20T23:00:00.000Z",
          endsAt: "2026-06-21T05:00:00.000Z",
          maxCapacity: 500,
        }),
        "event-1",
      ),
      createParams("event-1"),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(updateVenueEvent).toHaveBeenCalledWith("admin-token", "venue-1", "event-1", {
      name: "Friday Opening",
      startsAt: "2026-06-20T23:00:00.000Z",
      endsAt: "2026-06-21T05:00:00.000Z",
      maxCapacity: 500,
    });
  });

  it("normalizes timezone-offset datetimes to UTC before proxying updates", async () => {
    updateVenueEvent.mockResolvedValue({ id: "event-1" });

    const response = await PATCH(
      createRequest(
        JSON.stringify({
          startsAt: "2026-06-20T20:00:00-03:00",
          endsAt: "2026-06-21T02:00:00-03:00",
        }),
        "event-1",
      ),
      createParams("event-1"),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(updateVenueEvent).toHaveBeenCalledWith("admin-token", "venue-1", "event-1", {
      startsAt: "2026-06-20T23:00:00.000Z",
      endsAt: "2026-06-21T05:00:00.000Z",
    });
  });

  it("rejects non-integer minAge on update", async () => {
    const response = await PATCH(
      createRequest(JSON.stringify({ minAge: 18.5 }), "event-1"),
      createParams("event-1"),
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      message: "Minimum age must be an integer between 0 and 120.",
    });
    expect(updateVenueEvent).not.toHaveBeenCalled();
  });

  it("rejects minAge out of range on update", async () => {
    const response = await PATCH(
      createRequest(JSON.stringify({ minAge: 200 }), "event-1"),
      createParams("event-1"),
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      message: "Minimum age must be an integer between 0 and 120.",
    });
    expect(updateVenueEvent).not.toHaveBeenCalled();
  });

  it("rejects non-boolean allowManualDniCheck on update", async () => {
    const response = await PATCH(
      createRequest(JSON.stringify({ allowManualDniCheck: "yes" }), "event-1"),
      createParams("event-1"),
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ message: "allowManualDniCheck must be a boolean." });
    expect(updateVenueEvent).not.toHaveBeenCalled();
  });

  it("forwards false boolean fields through the update route boundary", async () => {
    updateVenueEvent.mockResolvedValue({ id: "event-1" });

    const response = await PATCH(
      createRequest(
        JSON.stringify({
          allowManualDniCheck: false,
          requireGuestList: false,
        }),
        "event-1",
      ),
      createParams("event-1"),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(updateVenueEvent).toHaveBeenCalledWith("admin-token", "venue-1", "event-1", {
      allowManualDniCheck: false,
      requireGuestList: false,
    });
  });

  it("accepts a partial update with only minAge", async () => {
    updateVenueEvent.mockResolvedValue({ id: "event-1" });

    const response = await PATCH(
      createRequest(JSON.stringify({ minAge: 21 }), "event-1"),
      createParams("event-1"),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(updateVenueEvent).toHaveBeenCalledWith("admin-token", "venue-1", "event-1", { minAge: 21 });
  });

  it("preserves backend 4xx error status and message", async () => {
    updateVenueEvent.mockRejectedValue(new MockBackendApiError("Event cannot be edited.", 422));

    const response = await PATCH(
      createRequest(JSON.stringify({ name: "Friday Opening" }), "event-1"),
      createParams("event-1"),
    );

    expect(response.status).toBe(422);
    expect(await response.json()).toEqual({ message: "Event cannot be edited." });
  });

  it("returns safe 5xx for backend server failures", async () => {
    updateVenueEvent.mockRejectedValue(new MockBackendApiError("postgres exploded", 503));

    const response = await PATCH(
      createRequest(JSON.stringify({ name: "Friday Opening" }), "event-1"),
      createParams("event-1"),
    );

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ message: "Could not update the event." });
  });

  it("returns 500 for unexpected errors", async () => {
    updateVenueEvent.mockRejectedValue(new Error("socket hang up"));

    const response = await PATCH(
      createRequest(JSON.stringify({ name: "Friday Opening" }), "event-1"),
      createParams("event-1"),
    );

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ message: "Could not update the event." });
  });

});
