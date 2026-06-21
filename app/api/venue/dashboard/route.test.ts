// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const { MockBackendApiError, requireBackendSession, fetchDashboardMetrics } = vi.hoisted(() => {
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
    fetchDashboardMetrics: vi.fn(),
  };
});

vi.mock("@/lib/auth-session", () => ({
  requireBackendSession,
}));

vi.mock("@/lib/idnight-backend", () => ({
  BackendApiError: MockBackendApiError,
  fetchDashboardMetrics,
}));

import { GET } from "@/app/api/venue/dashboard/route";

function createRedirectError() {
  return Object.assign(new Error("NEXT_REDIRECT"), {
    digest: "NEXT_REDIRECT;replace;/login;307;",
  });
}

const mockMetrics = {
  eventsToday: 2,
  activeEventsNow: 1,
  admissionsToday: 120,
  rejectionsToday: 5,
  warningsToday: 3,
  openIncidents: 1,
};

describe("/api/venue/dashboard", () => {
  beforeEach(() => {
    requireBackendSession.mockReset();
    requireBackendSession.mockResolvedValue({ accessToken: "admin-token", refreshToken: null });
    fetchDashboardMetrics.mockReset();
  });

  it("returns metrics successfully", async () => {
    fetchDashboardMetrics.mockResolvedValue(mockMetrics);

    const response = await GET();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(mockMetrics);
    expect(fetchDashboardMetrics).toHaveBeenCalledWith("admin-token");
  });

  it("preserves backend 4xx error", async () => {
    fetchDashboardMetrics.mockRejectedValue(
      new MockBackendApiError("Dashboard not available for this venue.", 403),
    );

    const response = await GET();

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ message: "Dashboard not available for this venue." });
  });

  it("returns 500 with safe fallback for backend 5xx", async () => {
    fetchDashboardMetrics.mockRejectedValue(
      new MockBackendApiError("internal server error", 503),
    );

    const response = await GET();

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ message: "Could not load dashboard metrics." });
  });

  it("returns 500 for unexpected errors", async () => {
    fetchDashboardMetrics.mockRejectedValue(new Error("socket hang up"));

    const response = await GET();

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ message: "Could not load dashboard metrics." });
  });

  it("rethrows auth redirect", async () => {
    const redirectError = createRedirectError();
    requireBackendSession.mockRejectedValue(redirectError);

    await expect(GET()).rejects.toBe(redirectError);
    expect(fetchDashboardMetrics).not.toHaveBeenCalled();
  });
});
