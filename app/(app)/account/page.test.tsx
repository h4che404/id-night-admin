import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { requireBackendSession, requireReadyPageAccess, fetchAdminProfile } = vi.hoisted(() => ({
  requireBackendSession: vi.fn(),
  requireReadyPageAccess: vi.fn(),
  fetchAdminProfile: vi.fn(),
}));

function createRedirectError(path: string) {
  return Object.assign(new Error("NEXT_REDIRECT"), {
    digest: `NEXT_REDIRECT;replace;${path};307;`,
  });
}

vi.mock("@/lib/auth-session", () => ({
  requireBackendSession,
  requireReadyPageAccess,
}));

vi.mock("@/lib/idnight-backend", () => ({
  fetchAdminProfile,
}));

vi.mock("@/components/organization-membership-details", () => ({
  OrganizationMembershipDetails: () => <div>Membership details</div>,
}));

vi.mock("@/components/ui-kit", () => ({
  Badge: ({ label }: { label: string }) => <span>{label}</span>,
  SectionHeader: ({ title }: { title: string }) => <h1>{title}</h1>,
  Surface: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

import AccountPage from "@/app/(app)/account/page";

describe("AccountPage", () => {
  beforeEach(() => {
    requireBackendSession.mockReset();
    requireBackendSession.mockResolvedValue({ accessToken: "admin-token", refreshToken: null });
    requireReadyPageAccess.mockReset();
    requireReadyPageAccess.mockResolvedValue({
      session: { accessToken: "admin-token", refreshToken: null },
      profile: {
        id: "admin-1",
        email: "admin@idnight.app",
        fullName: "Ada Lovelace",
        role: "Owner",
        active: true,
        venueId: "venue-1",
        venueName: "ID Night",
        organizationId: "org-1",
        organizationName: "My Org",
        membershipRole: "Owner",
        membershipActive: true,
      },
    });
    fetchAdminProfile.mockReset();
    fetchAdminProfile.mockResolvedValue({
      id: "admin-1",
      email: "admin@idnight.app",
      firstName: "Ada",
      lastName: "Lovelace",
      fullName: "Ada Lovelace",
      role: "Owner",
      active: true,
      venueId: "venue-1",
      venueName: "ID Night",
      organizationId: "org-1",
      organizationName: "My Org",
      membershipRole: "Owner",
      membershipActive: true,
    });
  });

  it("returns no page content when access is degraded so the layout shell stays in control", async () => {
    requireReadyPageAccess.mockResolvedValue(null);

    const { container } = render(await AccountPage());

    expect(container).toBeEmptyDOMElement();
    expect(fetchAdminProfile).not.toHaveBeenCalled();
  });

  it("redirects onboarding-needed access to /owner-onboarding before loading account details", async () => {
    requireReadyPageAccess.mockRejectedValue(createRedirectError("/owner-onboarding"));

    await expect(AccountPage()).rejects.toMatchObject({
      digest: "NEXT_REDIRECT;replace;/owner-onboarding;307;",
    });
    expect(fetchAdminProfile).not.toHaveBeenCalled();
  });
});
