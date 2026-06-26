// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const { MockBackendApiError, requireBackendSession, cancelGuestListEntry } = vi.hoisted(() => {
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
    cancelGuestListEntry: vi.fn(),
  };
});

vi.mock("@/lib/auth-session", () => ({
  requireBackendSession,
  requireBackendProfile: async () => {
    const session = await requireBackendSession();
    return {
      session,
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
    };
  },
}));

vi.mock("@/lib/idnight-backend", () => ({
  BackendApiError: MockBackendApiError,
  cancelGuestListEntry,
}));

import { PATCH } from "@/app/api/venue/events/[id]/guest-list/[entryId]/route";

function createPatchRequest(id: string, entryId: string) {
  return new Request(`http://localhost/api/venue/events/${id}/guest-list/${entryId}`, {
    method: "PATCH",
  });
}

function createRedirectError() {
  return Object.assign(new Error("NEXT_REDIRECT"), {
    digest: "NEXT_REDIRECT;replace;/login;307;",
  });
}

const mockParams = (id: string, entryId: string) => ({
  params: Promise.resolve({ id, entryId }),
});

describe("/api/venue/events/[id]/guest-list/[entryId] PATCH", () => {
  beforeEach(() => {
    requireBackendSession.mockReset();
    requireBackendSession.mockResolvedValue({ accessToken: "admin-token", refreshToken: null });
    cancelGuestListEntry.mockReset();
  });

  it("cancels entry successfully", async () => {
    const cancelled = {
      id: "entry-1",
      status: "CANCELLED",
      firstName: "Juan",
      lastName: "Perez",
      dniSuffix: "5678",
      category: null,
      importedAt: "2026-06-21T00:00:00.000Z",
    };
    cancelGuestListEntry.mockResolvedValue(cancelled);

    const response = await PATCH(
      createPatchRequest("evt-1", "entry-1"),
      mockParams("evt-1", "entry-1"),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(cancelled);
    expect(cancelGuestListEntry).toHaveBeenCalledWith("admin-token", "venue-1", "evt-1", "entry-1");
  });

  it("preserves backend 4xx error", async () => {
    cancelGuestListEntry.mockRejectedValue(
      new MockBackendApiError("Entry has already been used.", 409),
    );

    const response = await PATCH(
      createPatchRequest("evt-1", "entry-1"),
      mockParams("evt-1", "entry-1"),
    );

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ message: "Entry has already been used." });
  });

  it("returns safe fallback for 5xx", async () => {
    cancelGuestListEntry.mockRejectedValue(new MockBackendApiError("DB error", 500));

    const response = await PATCH(
      createPatchRequest("evt-1", "entry-1"),
      mockParams("evt-1", "entry-1"),
    );

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ message: "Could not cancel the guest list entry." });
  });

  it("returns 500 for unexpected errors", async () => {
    cancelGuestListEntry.mockRejectedValue(new Error("network timeout"));

    const response = await PATCH(
      createPatchRequest("evt-1", "entry-1"),
      mockParams("evt-1", "entry-1"),
    );

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ message: "Could not cancel the guest list entry." });
  });

  it("rethrows auth redirects", async () => {
    const redirectError = createRedirectError();
    requireBackendSession.mockRejectedValue(redirectError);

    await expect(
      PATCH(createPatchRequest("evt-1", "entry-1"), mockParams("evt-1", "entry-1")),
    ).rejects.toBe(redirectError);
  });
});
