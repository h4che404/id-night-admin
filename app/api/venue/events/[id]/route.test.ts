// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const { MockBackendApiError, requireBackendSession, updateVenueEvent } = vi.hoisted(() => {
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
    updateVenueEvent: vi.fn(),
  };
});

vi.mock("@/lib/auth-session", () => ({
  requireBackendSession,
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

function createRedirectError() {
  return Object.assign(new Error("NEXT_REDIRECT"), {
    digest: "NEXT_REDIRECT;replace;/login;307;",
  });
}

describe("/api/venue/events/[id]", () => {
  beforeEach(() => {
    requireBackendSession.mockReset();
    requireBackendSession.mockResolvedValue({ accessToken: "admin-token", refreshToken: null });
    updateVenueEvent.mockReset();
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

  it("accepts a partial update with only name", async () => {
    updateVenueEvent.mockResolvedValue({ id: "event-1" });

    const response = await PATCH(
      createRequest(JSON.stringify({ name: "  Saturday Night  " }), "event-1"),
      createParams("event-1"),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(updateVenueEvent).toHaveBeenCalledWith("admin-token", "event-1", { name: "Saturday Night" });
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
    expect(updateVenueEvent).toHaveBeenCalledWith("admin-token", "event-1", {
      name: "Friday Opening",
      startsAt: "2026-06-20T23:00:00.000Z",
      endsAt: "2026-06-21T05:00:00.000Z",
      maxCapacity: 500,
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

  it("accepts a partial update with only minAge", async () => {
    updateVenueEvent.mockResolvedValue({ id: "event-1" });

    const response = await PATCH(
      createRequest(JSON.stringify({ minAge: 21 }), "event-1"),
      createParams("event-1"),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(updateVenueEvent).toHaveBeenCalledWith("admin-token", "event-1", { minAge: 21 });
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

  it("rethrows auth redirects", async () => {
    const redirectError = createRedirectError();
    requireBackendSession.mockRejectedValue(redirectError);

    await expect(
      PATCH(createRequest(JSON.stringify({ name: "Friday Opening" }), "event-1"), createParams("event-1")),
    ).rejects.toBe(redirectError);

    expect(updateVenueEvent).not.toHaveBeenCalled();
  });
});
