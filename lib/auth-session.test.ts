import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const storeGetMock = vi.fn();
const storeSetMock = vi.fn();
const storeDeleteMock = vi.fn();
const redirectMock = vi.fn();

vi.mock("next/headers", () => ({
  cookies: vi.fn(() => ({
    get: storeGetMock,
    set: storeSetMock,
    delete: storeDeleteMock,
  })),
}));

vi.mock("react", () => ({
  cache: (fn: any) => fn, // Mock React cache as identity function for unit tests
}));

vi.mock("next/navigation", () => ({
  redirect: (path: string) => redirectMock(path),
}));

const resolveAdminSessionAccessMock = vi.fn();
const resolveAdminSessionAccessUncachedMock = vi.fn();
vi.mock("@/lib/admin-session-access", () => ({
  resolveAdminSessionAccess: (...args: any[]) => resolveAdminSessionAccessMock(...args),
  resolveAdminSessionAccessUncached: (...args: any[]) => resolveAdminSessionAccessUncachedMock(...args),
}));

import {
  getCachedProfile,
  PROFILE_COOKIE,
  requireReadyBackendProfile,
  requireReadyPageAccess,
} from "@/lib/auth-session";

function createRedirectError(path: string) {
  return Object.assign(new Error("NEXT_REDIRECT"), {
    digest: `NEXT_REDIRECT;replace;${path};307;`,
  });
}

describe("getCachedProfile", () => {
  beforeEach(() => {
    storeGetMock.mockReset();
    storeSetMock.mockReset();
    storeDeleteMock.mockReset();
    resolveAdminSessionAccessMock.mockReset();
    resolveAdminSessionAccessUncachedMock.mockReset();
    redirectMock.mockReset();
    redirectMock.mockImplementation((path: string) => {
      throw createRedirectError(path);
    });
  });

  it("returns cached profile if present and valid in cookies", async () => {
    const validProfile = { state: "ready", profile: { id: "123" } };
    storeGetMock.mockReturnValue({ value: JSON.stringify(validProfile) });

    const result = await getCachedProfile("token-123");

    expect(storeGetMock).toHaveBeenCalledWith(PROFILE_COOKIE);
    expect(result).toEqual(validProfile);
    expect(resolveAdminSessionAccessMock).not.toHaveBeenCalled();
  });

  it("fetches fresh profile on cache miss and writes to cookie with 15m TTL", async () => {
    storeGetMock.mockReturnValue(undefined);
    const freshProfile = { state: "ready", profile: { id: "fresh-123" } };
    resolveAdminSessionAccessMock.mockResolvedValue(freshProfile);

    const result = await getCachedProfile("token-123");

    expect(storeGetMock).toHaveBeenCalledWith(PROFILE_COOKIE);
    expect(resolveAdminSessionAccessMock).toHaveBeenCalledWith("token-123");
    expect(storeSetMock).toHaveBeenCalledWith(PROFILE_COOKIE, JSON.stringify(freshProfile), expect.objectContaining({
      maxAge: 15 * 60,
    }));
    expect(result).toEqual(freshProfile);
  });

  it("fetches fresh profile if cached profile is invalid JSON", async () => {
    storeGetMock.mockReturnValue({ value: "invalid-json" });
    const freshProfile = { state: "ready", profile: { id: "fresh-123" } };
    resolveAdminSessionAccessMock.mockResolvedValue(freshProfile);

    const result = await getCachedProfile("token-123");

    expect(resolveAdminSessionAccessMock).toHaveBeenCalledWith("token-123");
    expect(storeSetMock).toHaveBeenCalled();
    expect(result).toEqual(freshProfile);
  });

  it("redirects existing-organization onboarding-needed page access to /venue", async () => {
    storeGetMock.mockImplementation((key: string) => {
      if (key === "idnight_admin_supabase_access_token") {
        return { value: "token-123" };
      }

      return undefined;
    });
    resolveAdminSessionAccessMock.mockResolvedValue({
      state: "onboarding-needed",
      onboarding: { needsOnboarding: true, hasOperatorProfile: true, organizationId: "org-1" },
    });

    await expect(requireReadyPageAccess()).rejects.toMatchObject({
      digest: "NEXT_REDIRECT;replace;/venue;307;",
    });
  });

  it("redirects missing-organization onboarding-needed backend access to /owner-onboarding", async () => {
    storeGetMock.mockImplementation((key: string) => {
      if (key === "idnight_admin_supabase_access_token") {
        return { value: "token-123" };
      }

      return undefined;
    });
    resolveAdminSessionAccessMock.mockResolvedValue({
      state: "onboarding-needed",
      onboarding: { needsOnboarding: true, hasOperatorProfile: true, organizationId: null },
    });

    await expect(requireReadyBackendProfile()).rejects.toMatchObject({
      digest: "NEXT_REDIRECT;replace;/owner-onboarding;307;",
    });
  });
});
