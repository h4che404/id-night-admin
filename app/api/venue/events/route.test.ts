// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const { MockBackendApiError, readReadyVenueApiAccess, createVenueEvent } = vi.hoisted(() => {
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
    createVenueEvent: vi.fn(),
  };
});

vi.mock("@/lib/auth-session", () => ({
  readReadyVenueApiAccess,
}));

vi.mock("@/lib/idnight-backend", () => ({
  BackendApiError: MockBackendApiError,
  createVenueEvent,
}));

import { POST } from "@/app/api/venue/events/route";

function createRequest(body: BodyInit) {
  return new Request("http://localhost/api/venue/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
}

describe("/api/venue/events", () => {
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
    createVenueEvent.mockReset();
  });

  it("rejects invalid JSON bodies", async () => {
    const response = await POST(createRequest("{"));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ message: "The request body must be valid JSON." });
    expect(createVenueEvent).not.toHaveBeenCalled();
  });

  it("rejects invalid event schedules", async () => {
    const response = await POST(
      createRequest(
        JSON.stringify({
          name: "Friday Opening",
          startsAt: "2026-06-21T05:00:00.000Z",
          endsAt: "2026-06-20T23:00:00.000Z",
        }),
      ),
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ message: "Event end must be after the start." });
    expect(createVenueEvent).not.toHaveBeenCalled();
  });

  it("forwards valid create payloads with the backend token", async () => {
    createVenueEvent.mockResolvedValue({ id: "event-1" });

    const response = await POST(
      createRequest(
        JSON.stringify({
          name: "  Friday Opening  ",
          startsAt: "2026-06-20T23:00:00.000Z",
          endsAt: "2026-06-21T05:00:00.000Z",
          maxCapacity: 500,
        }),
      ),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(createVenueEvent).toHaveBeenCalledWith("admin-token", "venue-1", {
      name: "Friday Opening",
      startsAt: "2026-06-20T23:00:00.000Z",
      endsAt: "2026-06-21T05:00:00.000Z",
      maxCapacity: 500,
    });
  });

  it("normalizes timezone-offset datetimes to UTC before proxying creates", async () => {
    createVenueEvent.mockResolvedValue({ id: "event-1" });

    const response = await POST(
      createRequest(
        JSON.stringify({
          name: "Friday Opening",
          startsAt: "2026-06-20T20:00:00-03:00",
          endsAt: "2026-06-21T02:00:00-03:00",
        }),
      ),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(createVenueEvent).toHaveBeenCalledWith("admin-token", "venue-1", {
      name: "Friday Opening",
      startsAt: "2026-06-20T23:00:00.000Z",
      endsAt: "2026-06-21T05:00:00.000Z",
    });
  });

  it("rejects datetimes without an explicit timezone", async () => {
    const response = await POST(
      createRequest(
        JSON.stringify({
          name: "Friday Opening",
          startsAt: "2026-06-20T23:00",
          endsAt: "2026-06-21T05:00",
        }),
      ),
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      message: "Event start and end must be valid ISO datetimes with a timezone.",
    });
    expect(createVenueEvent).not.toHaveBeenCalled();
  });

  it("rejects impossible calendar dates even when the string matches ISO format", async () => {
    const response = await POST(
      createRequest(
        JSON.stringify({
          name: "Friday Opening",
          startsAt: "2026-02-30T23:00:00.000Z",
          endsAt: "2026-03-01T05:00:00.000Z",
        }),
      ),
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      message: "Event start and end must be valid ISO datetimes with a timezone.",
    });
    expect(createVenueEvent).not.toHaveBeenCalled();
  });

  it("rejects impossible timezone offsets even when the string matches ISO format", async () => {
    const response = await POST(
      createRequest(
        JSON.stringify({
          name: "Friday Opening",
          startsAt: "2026-06-20T23:00:00+24:00",
          endsAt: "2026-06-21T05:00:00.000Z",
        }),
      ),
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      message: "Event start and end must be valid ISO datetimes with a timezone.",
    });
    expect(createVenueEvent).not.toHaveBeenCalled();
  });

  it("rejects invalid max capacity payloads", async () => {
    const response = await POST(
      createRequest(
        JSON.stringify({
          name: "Friday Opening",
          startsAt: "2026-06-20T23:00:00.000Z",
          endsAt: "2026-06-21T05:00:00.000Z",
          maxCapacity: 12.5,
        }),
      ),
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ message: "Max capacity must be a positive whole number." });
    expect(createVenueEvent).not.toHaveBeenCalled();
  });

  it("rejects blank event names after trimming", async () => {
    const response = await POST(
      createRequest(
        JSON.stringify({
          name: "   ",
          startsAt: "2026-06-20T23:00:00.000Z",
          endsAt: "2026-06-21T05:00:00.000Z",
        }),
      ),
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ message: "Event name, start, and end are required." });
    expect(createVenueEvent).not.toHaveBeenCalled();
  });

  it("preserves backend error status on create", async () => {
    createVenueEvent.mockRejectedValue(new MockBackendApiError("Venue events are not available yet.", 404));

    const response = await POST(
      createRequest(
        JSON.stringify({
          name: "Friday Opening",
          startsAt: "2026-06-20T23:00:00.000Z",
          endsAt: "2026-06-21T05:00:00.000Z",
        }),
      ),
    );

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ message: "Venue events are not available yet." });
  });

  it("returns a safe 5xx response for backend server failures", async () => {
    createVenueEvent.mockRejectedValue(new MockBackendApiError("postgres exploded", 503));

    const response = await POST(
      createRequest(
        JSON.stringify({
          name: "Friday Opening",
          startsAt: "2026-06-20T23:00:00.000Z",
          endsAt: "2026-06-21T05:00:00.000Z",
        }),
      ),
    );

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ message: "Could not create the event." });
  });

  it("returns a generic 500 response for unexpected create failures", async () => {
    createVenueEvent.mockRejectedValue(new Error("socket hang up"));

    const response = await POST(
      createRequest(
        JSON.stringify({
          name: "Friday Opening",
          startsAt: "2026-06-20T23:00:00.000Z",
          endsAt: "2026-06-21T05:00:00.000Z",
        }),
      ),
    );

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ message: "Could not create the event." });
  });

  it("rejects non-integer minAge", async () => {
    const response = await POST(
      createRequest(
        JSON.stringify({
          name: "Friday Opening",
          startsAt: "2026-06-20T23:00:00.000Z",
          endsAt: "2026-06-21T05:00:00.000Z",
          minAge: 18.5,
        }),
      ),
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      message: "Minimum age must be an integer between 0 and 120.",
    });
    expect(createVenueEvent).not.toHaveBeenCalled();
  });

  it("rejects minAge out of range", async () => {
    const response = await POST(
      createRequest(
        JSON.stringify({
          name: "Friday Opening",
          startsAt: "2026-06-20T23:00:00.000Z",
          endsAt: "2026-06-21T05:00:00.000Z",
          minAge: 121,
        }),
      ),
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      message: "Minimum age must be an integer between 0 and 120.",
    });
    expect(createVenueEvent).not.toHaveBeenCalled();
  });

  it("forwards valid minAge to the backend", async () => {
    createVenueEvent.mockResolvedValue({ id: "event-1" });

    const response = await POST(
      createRequest(
        JSON.stringify({
          name: "Friday Opening",
          startsAt: "2026-06-20T23:00:00.000Z",
          endsAt: "2026-06-21T05:00:00.000Z",
          minAge: 18,
        }),
      ),
    );

    expect(response.status).toBe(200);
    expect(createVenueEvent).toHaveBeenCalledWith(
      "admin-token",
      "venue-1",
      expect.objectContaining({ minAge: 18 }),
    );
  });

  it("forwards allowManualDniCheck and requireGuestList boolean fields", async () => {
    createVenueEvent.mockResolvedValue({ id: "event-1" });

    const response = await POST(
      createRequest(
        JSON.stringify({
          name: "Friday Opening",
          startsAt: "2026-06-20T23:00:00.000Z",
          endsAt: "2026-06-21T05:00:00.000Z",
          allowManualDniCheck: false,
          requireGuestList: true,
        }),
      ),
    );

    expect(response.status).toBe(200);
    expect(createVenueEvent).toHaveBeenCalledWith(
      "admin-token",
      "venue-1",
      expect.objectContaining({ allowManualDniCheck: false, requireGuestList: true }),
    );
  });

  it("rejects non-numeric minAge instead of silently dropping it", async () => {
    const response = await POST(
      createRequest(
        JSON.stringify({
          name: "Friday Opening",
          startsAt: "2026-06-20T23:00:00.000Z",
          endsAt: "2026-06-21T05:00:00.000Z",
          minAge: "18",
        }),
      ),
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      message: "Minimum age must be an integer between 0 and 120.",
    });
    expect(createVenueEvent).not.toHaveBeenCalled();
  });

  it.each([
    ["allowManualDniCheck", "yes", "allowManualDniCheck must be a boolean."],
    ["requireGuestList", "true", "requireGuestList must be a boolean."],
  ])(
    "rejects wrong-type %s instead of silently dropping it",
    async (field, value, message) => {
      const response = await POST(
        createRequest(
          JSON.stringify({
            name: "Friday Opening",
            startsAt: "2026-06-20T23:00:00.000Z",
            endsAt: "2026-06-21T05:00:00.000Z",
            [field]: value,
          }),
        ),
      );

      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ message });
      expect(createVenueEvent).not.toHaveBeenCalled();
    },
  );

});
