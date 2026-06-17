import { beforeEach, describe, expect, it, vi } from "vitest";

const { MockBackendApiError, fetchAdminProfile, fetchOwnerOnboardingStatus } = vi.hoisted(() => {
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
    fetchAdminProfile: vi.fn(),
    fetchOwnerOnboardingStatus: vi.fn(),
  };
});

vi.mock("@/lib/idnight-backend", () => ({
  BackendApiError: MockBackendApiError,
  fetchAdminProfile,
  fetchOwnerOnboardingStatus,
}));

import { resolveAdminSessionAccess } from "@/lib/admin-session-access";

describe("resolveAdminSessionAccess", () => {
  beforeEach(() => {
    fetchAdminProfile.mockReset();
    fetchOwnerOnboardingStatus.mockReset();
  });

  it("returns admin access when the operator profile exists", async () => {
    fetchAdminProfile.mockResolvedValue({ id: "operator-1", email: "owner@example.com" });

    await expect(resolveAdminSessionAccess("valid-token")).resolves.toMatchObject({
      kind: "admin",
      profile: { id: "operator-1", email: "owner@example.com" },
    });
    expect(fetchOwnerOnboardingStatus).not.toHaveBeenCalled();
  });

  it("routes authenticated users without operators to onboarding", async () => {
    fetchAdminProfile.mockRejectedValue(new MockBackendApiError("Operator missing", 401));
    fetchOwnerOnboardingStatus.mockResolvedValue({
      needsOnboarding: true,
      hasOperatorProfile: false,
      operatorRole: null,
      organizationId: null,
      organizationName: null,
      venueId: null,
      venueName: null,
    });

    await expect(resolveAdminSessionAccess("pending-owner-token")).resolves.toMatchObject({
      kind: "onboarding",
      onboarding: { needsOnboarding: true, hasOperatorProfile: false },
    });
  });

  it("keeps invalid sessions on login instead of looping", async () => {
    fetchAdminProfile.mockRejectedValue(new MockBackendApiError("Unauthorized", 401));
    fetchOwnerOnboardingStatus.mockRejectedValue(new MockBackendApiError("Unauthorized", 401));

    await expect(resolveAdminSessionAccess("expired-token")).resolves.toEqual({ kind: "login" });
  });

  it("keeps non-onboarding access failures on login", async () => {
    fetchAdminProfile.mockRejectedValue(new MockBackendApiError("Forbidden", 403));
    fetchOwnerOnboardingStatus.mockResolvedValue({
      needsOnboarding: false,
      hasOperatorProfile: true,
      operatorRole: "GUARD",
      organizationId: null,
      organizationName: null,
      venueId: null,
      venueName: null,
    });

    await expect(resolveAdminSessionAccess("guard-token")).resolves.toEqual({ kind: "login" });
  });

  it("rethrows unexpected admin profile errors", async () => {
    fetchAdminProfile.mockRejectedValue(new MockBackendApiError("Backend down", 500));

    await expect(resolveAdminSessionAccess("broken-token")).rejects.toMatchObject({
      message: "Backend down",
      status: 500,
    });
    expect(fetchOwnerOnboardingStatus).not.toHaveBeenCalled();
  });
});
