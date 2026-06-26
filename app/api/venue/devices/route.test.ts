// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const { MockBackendApiError, requireBackendSession, createVenueDevice, updateVenueDevice, toggleVenueDeviceStatus } = vi.hoisted(() => {
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
    createVenueDevice: vi.fn(),
    updateVenueDevice: vi.fn(),
    toggleVenueDeviceStatus: vi.fn(),
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
  createVenueDevice,
  updateVenueDevice,
  toggleVenueDeviceStatus,
}));

import { PATCH, POST, PUT } from "@/app/api/venue/devices/route";

function createRequest(method: "POST" | "PUT" | "PATCH", body: BodyInit) {
  return new Request("http://localhost/api/venue/devices", {
    method,
    headers: { "Content-Type": "application/json" },
    body,
  });
}

function createRedirectError() {
  return Object.assign(new Error("NEXT_REDIRECT"), {
    digest: "NEXT_REDIRECT;replace;/login;307;",
  });
}

describe("/api/venue/devices", () => {
  beforeEach(() => {
    requireBackendSession.mockReset();
    requireBackendSession.mockResolvedValue({ accessToken: "admin-token", refreshToken: null });
    createVenueDevice.mockReset();
    updateVenueDevice.mockReset();
    toggleVenueDeviceStatus.mockReset();
  });

  it("rejects invalid JSON bodies on create", async () => {
    const response = await POST(createRequest("POST", "{"));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ message: "El cuerpo debe ser JSON valido." });
    expect(createVenueDevice).not.toHaveBeenCalled();
  });

  it("forwards valid create payloads with the backend token", async () => {
    createVenueDevice.mockResolvedValue({ id: "device-1" });

    const response = await POST(
      createRequest(
        "POST",
        JSON.stringify({ name: "Tablet puerta", deviceKey: "door-01" }),
      ),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(createVenueDevice).toHaveBeenCalledWith("admin-token", "venue-1", {
      name: "Tablet puerta",
      serialNumber: "door-01",
    });
  });

  it("preserves auth redirects raised before proxying", async () => {
    const redirectError = createRedirectError();
    requireBackendSession.mockRejectedValue(redirectError);

    await expect(
      POST(
        createRequest(
          "POST",
          JSON.stringify({ name: "Tablet puerta", deviceKey: "door-01" }),
        ),
      ),
    ).rejects.toBe(redirectError);

    expect(createVenueDevice).not.toHaveBeenCalled();
  });

  it("preserves backend error status on update", async () => {
    updateVenueDevice.mockRejectedValue(new MockBackendApiError("Clave duplicada.", 409));

    const response = await PUT(
      createRequest(
        "PUT",
        JSON.stringify({ id: "device-1", name: "Tablet puerta", deviceKey: "door-01" }),
      ),
    );

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ message: "Clave duplicada." });
  });

  it("preserves backend auth status on create", async () => {
    createVenueDevice.mockRejectedValue(new MockBackendApiError("Tu sesión venció.", 401));

    const response = await POST(
      createRequest(
        "POST",
        JSON.stringify({ name: "Tablet puerta", deviceKey: "door-01" }),
      ),
    );

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ message: "Tu sesión venció." });
  });

  it("rejects missing status payload fields", async () => {
    const response = await PATCH(createRequest("PATCH", JSON.stringify({ id: "device-1" })));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      message: "Faltan campos obligatorios para el estado del dispositivo.",
    });
    expect(toggleVenueDeviceStatus).not.toHaveBeenCalled();
  });

  it("forwards valid status updates", async () => {
    toggleVenueDeviceStatus.mockResolvedValue({ ok: true });

    const response = await PATCH(
      createRequest("PATCH", JSON.stringify({ id: "device-1", active: false })),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(toggleVenueDeviceStatus).toHaveBeenCalledWith("admin-token", "venue-1", "device-1", false);
  });
});
