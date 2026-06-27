// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  BackendApiError,
  IDNIGHT_BACKEND_URL,
  cancelGuestListEntry,
  createVenueEvent,
  fetchAdminProfile,
  normalizeVenueSummary,
  resolveBootstrapAdminContextMode,
  updateVenueEvent,
  uploadEventGuestList,
} from "@/lib/idnight-backend";

function createGuestListFormData() {
  const formData = new FormData();
  formData.append("file", new Blob(["dni,firstName,lastName\n12345678,Juan,Perez"], { type: "text/csv" }), "guests.csv");
  return formData;
}

describe("idnight backend error parsing", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("preserves status and plain-text upstream errors", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("Gateway upstream exploded", {
        status: 502,
        headers: { "Content-Type": "text/plain" },
      }),
    );

    await expect(
      createVenueEvent("admin-token", {
        name: "Friday Opening",
        startsAt: "2026-06-20T23:00:00.000Z",
        endsAt: "2026-06-21T05:00:00.000Z",
      }),
    ).rejects.toMatchObject<Partial<BackendApiError>>({
      name: "BackendApiError",
      message: "Gateway upstream exploded",
      status: 502,
    });
  });

  it("preserves status when the upstream returns malformed JSON", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response('{"message":', {
        status: 422,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await expect(
      createVenueEvent("admin-token", {
        name: "Friday Opening",
        startsAt: "2026-06-20T23:00:00.000Z",
        endsAt: "2026-06-21T05:00:00.000Z",
      }),
    ).rejects.toMatchObject<Partial<BackendApiError>>({
      name: "BackendApiError",
      message: '{"message":',
      status: 422,
    });
  });

  it("sends create venue event requests to the expected backend contract", async () => {
    const createdEvent = {
      id: "event-1",
      name: "Friday Opening",
      status: "UPCOMING",
      startsAt: "2026-06-20T23:00:00.000Z",
      endsAt: "2026-06-21T05:00:00.000Z",
      maxCapacity: 500,
      minAge: 18,
      allowManualDniCheck: true,
      requireGuestList: false,
    };

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(createdEvent), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await expect(
      createVenueEvent("admin-token", {
        name: "Friday Opening",
        startsAt: "2026-06-20T23:00:00.000Z",
        endsAt: "2026-06-21T05:00:00.000Z",
        maxCapacity: 500,
        minAge: 18,
        allowManualDniCheck: true,
        requireGuestList: false,
      }),
    ).resolves.toEqual(createdEvent);

    expect(fetchSpy).toHaveBeenCalledWith(`${IDNIGHT_BACKEND_URL}/admin/venues/mine/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer admin-token",
      },
      body: JSON.stringify({
        name: "Friday Opening",
        startsAt: "2026-06-20T23:00:00.000Z",
        endsAt: "2026-06-21T05:00:00.000Z",
        maxCapacity: 500,
        minAge: 18,
        allowManualDniCheck: true,
        requireGuestList: false,
      }),
      cache: "no-store",
      signal: expect.any(AbortSignal),
    });
  });

  it("sends update venue event requests with null and false values intact", async () => {
    const updatedEvent = {
      id: "event-1",
      name: "Friday Opening",
      status: "UPCOMING",
      startsAt: "2026-06-20T23:00:00.000Z",
      endsAt: "2026-06-21T05:00:00.000Z",
      maxCapacity: null,
      minAge: 18,
      allowManualDniCheck: false,
      requireGuestList: false,
    };

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(updatedEvent), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await expect(
      updateVenueEvent("admin-token", "event-1", {
        maxCapacity: null,
        allowManualDniCheck: false,
        requireGuestList: false,
      }),
    ).resolves.toEqual(updatedEvent);

    expect(fetchSpy).toHaveBeenCalledWith(`${IDNIGHT_BACKEND_URL}/admin/venues/mine/events/event-1`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer admin-token",
      },
      body: JSON.stringify({
        maxCapacity: null,
        allowManualDniCheck: false,
        requireGuestList: false,
      }),
      cache: "no-store",
      signal: expect.any(AbortSignal),
    });
  });

  it("parses plain-text upload guest list errors without re-reading the body", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("Guest list upload gateway exploded", {
        status: 502,
        headers: { "Content-Type": "text/plain" },
      }),
    );

    await expect(
      uploadEventGuestList("admin-token", "event-1", createGuestListFormData()),
    ).rejects.toMatchObject<Partial<BackendApiError>>({
      name: "BackendApiError",
      message: "Guest list upload gateway exploded",
      status: 502,
    });
  });

  it("preserves malformed JSON upload guest list errors", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response('{"message":', {
        status: 422,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await expect(
      uploadEventGuestList("admin-token", "event-1", createGuestListFormData()),
    ).rejects.toMatchObject<Partial<BackendApiError>>({
      name: "BackendApiError",
      message: '{"message":',
      status: 422,
    });
  });

  it("sends the guest list cancellation payload as JSON exactly once", async () => {
    const cancelled = {
      id: "entry-1",
      status: "CANCELLED",
      firstName: "Juan",
      lastName: "Perez",
      dniSuffix: "5678",
      category: null,
      importedAt: "2026-06-21T00:00:00.000Z",
    };

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(cancelled), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await expect(
      cancelGuestListEntry("admin-token", "event-1", "entry-1"),
    ).resolves.toEqual(cancelled);

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining("/admin/venues/mine/events/event-1/guest-list/entry-1"),
      expect.objectContaining({
        method: "PATCH",
        headers: expect.objectContaining({
          Authorization: "Bearer admin-token",
        }),
      }),
    );
  });

  it("fails fast on guest list upload aborts with the shared backend timeout contract", async () => {
    vi.useFakeTimers();

    try {
      const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(
        (_input, init) =>
          new Promise((_resolve, reject) => {
            init?.signal?.addEventListener("abort", () => {
              reject(new DOMException("The operation was aborted.", "AbortError"));
            });
          }),
      );

      const uploadPromise = uploadEventGuestList("admin-token", "event-1", createGuestListFormData());
      const uploadExpectation = expect(uploadPromise).rejects.toMatchObject<Partial<BackendApiError>>({
        name: "BackendApiError",
        message: "El servicio no está disponible en este momento.",
        status: 503,
      });

      await vi.advanceTimersByTimeAsync(5000);

      await uploadExpectation;
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("/admin/venues/mine/events/event-1/guest-list"),
        expect.objectContaining({ signal: expect.any(AbortSignal) }),
      );
    } finally {
      vi.useRealTimers();
    }
  });

  it("rethrows guest list upload fetch failures that are not aborts", async () => {
    const networkError = new Error("socket hang up");
    vi.spyOn(globalThis, "fetch").mockRejectedValue(networkError);

    await expect(uploadEventGuestList("admin-token", "event-1", createGuestListFormData())).rejects.toBe(
      networkError,
    );
  });
});

describe("idnight backend bootstrap admin context helpers", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });
  it("normalizes enriched bootstrap primaryVenue into a first-render venue summary", () => {
    expect(
      normalizeVenueSummary({
        id: "venue-1",
        name: "My Venue",
        slug: "my-venue",
        address: "Av. Siempre Viva 123",
        city: "Buenos Aires",
        active: true,
      }),
    ).toEqual({
      id: "venue-1",
      name: "My Venue",
      slug: "my-venue",
      address: "Av. Siempre Viva 123",
      city: "Buenos Aires",
      active: true,
    });
  });

  it("defaults missing bootstrap adminContextMode to legacy-fallback", () => {
    expect(
      resolveBootstrapAdminContextMode({
        id: "operator-1",
        supabaseId: "supabase-1",
        email: "owner@example.com",
        status: "active",
        createdAt: "2026-06-27T00:00:00.000Z",
        organizationId: "org-1",
        organizationName: "My Org",
        membershipRole: "Owner",
      }),
    ).toBe("legacy-fallback");
  });
  it("maps enriched bootstrap primaryVenue into fetchAdminProfile venue fields", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          id: "operator-1",
          supabaseId: "supabase-1",
          email: "owner@example.com",
          adminContextMode: "enriched",
          status: "active",
          createdAt: "2026-06-27T00:00:00.000Z",
          organizationId: "org-1",
          organizationName: "My Org",
          membershipRole: "Owner",
          primaryVenue: {
            id: "venue-1",
            name: "My Venue",
            slug: "my-venue",
            address: "Av. Siempre Viva 123",
            city: "Buenos Aires",
            active: true,
          },
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      ),
    );

    await expect(fetchAdminProfile("admin-token")).resolves.toMatchObject({
      venueId: "venue-1",
      venueName: "My Venue",
      organizationId: "org-1",
      organizationName: "My Org",
    });
  });
});
