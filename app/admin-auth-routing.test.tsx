import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const {
  canRecoverVenueSetup,
  readBackendSession,
  requireBackendSession,
  requireBackendProfile,
  requireAdminAccess,
  resolveAdminSessionAccess,
  redirectMock,
} = vi.hoisted(() => ({
  canRecoverVenueSetup: vi.fn(),
  readBackendSession: vi.fn(),
  requireBackendSession: vi.fn(),
  requireBackendProfile: vi.fn(() => {
    throw new Error("Legacy ready-only helper should not be used by auth routing pages");
  }),
  requireAdminAccess: vi.fn(),
  resolveAdminSessionAccess: vi.fn(),
  redirectMock: vi.fn(),
}));

function createRedirectError(path: string) {
  return Object.assign(new Error("NEXT_REDIRECT"), {
    digest: `NEXT_REDIRECT;replace;${path};307;`,
  });
}

vi.mock("next/navigation", () => ({
  redirect: (path: string) => redirectMock(path),
}));

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: ReactNode }) => <a href={href}>{children}</a>,
}));

vi.mock("@/lib/auth-session", () => ({
  canRecoverVenueSetup,
  readBackendSession,
  requireBackendSession,
  requireBackendProfile,
  requireAdminAccess,
}));

vi.mock("@/lib/admin-session-access", () => ({
  resolveAdminSessionAccess,
}));

vi.mock("@/components/login-form", () => ({
  LoginForm: () => <div data-testid="login-form">Login form</div>,
}));

vi.mock("@/components/register-form", () => ({
  RegisterForm: () => <div data-testid="register-form">Register form</div>,
}));

vi.mock("@/components/owner-onboarding-form", () => ({
  OwnerOnboardingForm: () => <div data-testid="owner-onboarding-form">Owner onboarding form</div>,
}));

vi.mock("@/components/ui-kit", () => ({
  Surface: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SectionHeader: ({ title, description }: { title: string; description?: string }) => (
    <div>
      <h1>{title}</h1>
      {description ? <p>{description}</p> : null}
    </div>
  ),
}));

vi.mock("@/components/app-shell", () => ({
  AppShell: ({ children, userName, userEmail }: { children: ReactNode; userName: string; userEmail: string }) => (
    <div data-testid="app-shell">
      <p>{userName}</p>
      <p>{userEmail}</p>
      {children}
    </div>
  ),
}));

import AuthenticatedLayout from "@/app/(app)/layout";
import LoginPage from "@/app/login/page";
import OwnerOnboardingPage from "@/app/owner-onboarding/page";
import RegisterPage from "@/app/register/page";

describe("admin auth routing pages", () => {
  beforeEach(() => {
    readBackendSession.mockReset();
    requireBackendSession.mockReset();
    requireBackendProfile.mockClear();
    requireAdminAccess.mockReset();
    resolveAdminSessionAccess.mockReset();
    canRecoverVenueSetup.mockReset();
    canRecoverVenueSetup.mockImplementation(
      (access: { state: string; onboarding?: { organizationId?: string | null } }) =>
        access.state === "onboarding-needed" && access.onboarding?.organizationId !== null,
    );
    redirectMock.mockReset();
    redirectMock.mockImplementation((path: string) => {
      throw createRedirectError(path);
    });
  });

  it("redirects degraded login sessions to /venue instead of keeping them on /login", async () => {
    readBackendSession.mockResolvedValue({ accessToken: "token", refreshToken: null });
    resolveAdminSessionAccess.mockResolvedValue({
      state: "degraded",
      reason: "bootstrap",
      identity: { fullName: "Ada Lovelace", email: "owner@example.com" },
    });

    await expect(LoginPage()).rejects.toMatchObject({
      digest: "NEXT_REDIRECT;replace;/venue;307;",
    });
  });

  it("redirects degraded register sessions to /venue instead of keeping them on /register", async () => {
    readBackendSession.mockResolvedValue({ accessToken: "token", refreshToken: null });
    resolveAdminSessionAccess.mockResolvedValue({
      state: "degraded",
      reason: "bootstrap",
      identity: { fullName: "Ada Lovelace", email: "owner@example.com" },
    });

    await expect(RegisterPage()).rejects.toMatchObject({
      digest: "NEXT_REDIRECT;replace;/venue;307;",
    });
  });

  it("keeps unauthorized visitors on the login page", async () => {
    readBackendSession.mockResolvedValue({ accessToken: "token", refreshToken: null });
    resolveAdminSessionAccess.mockResolvedValue({ state: "unauthorized" });

    render(await LoginPage());

    expect(screen.getByTestId("login-form")).toBeInTheDocument();
  });

  it("redirects degraded onboarding access to /venue so the limited shell can handle it", async () => {
    requireBackendSession.mockResolvedValue({ accessToken: "token", refreshToken: null });
    resolveAdminSessionAccess.mockResolvedValue({
      state: "degraded",
      reason: "bootstrap",
      identity: { fullName: "Ada Lovelace", email: "owner@example.com" },
    });

    await expect(OwnerOnboardingPage()).rejects.toMatchObject({
      digest: "NEXT_REDIRECT;replace;/venue;307;",
    });
  });

  it("redirects unauthorized onboarding access back to /login", async () => {
    requireBackendSession.mockResolvedValue({ accessToken: "token", refreshToken: null });
    resolveAdminSessionAccess.mockResolvedValue({ state: "unauthorized" });

    await expect(OwnerOnboardingPage()).rejects.toMatchObject({
      digest: "NEXT_REDIRECT;replace;/login;307;",
    });
  });

  it("renders a limited degraded shell without protected children", async () => {
    requireAdminAccess.mockResolvedValue({
      session: { accessToken: "token", refreshToken: null },
      access: {
        state: "degraded",
        reason: "bootstrap",
        identity: {
          fullName: "Ada Lovelace",
          email: "owner@example.com",
          firstName: "Ada",
          lastName: "Lovelace",
        },
      },
    });

    render(
      await AuthenticatedLayout({
        children: <div data-testid="protected-child">Protected child</div>,
      }),
    );

    expect(screen.getByTestId("app-shell")).toBeInTheDocument();
    expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
    expect(screen.getByText(/acceso degradado/i)).toBeInTheDocument();
    expect(screen.queryByText(/degraded access/i)).not.toBeInTheDocument();
    expect(screen.queryByTestId("protected-child")).not.toBeInTheDocument();
  });

  it("redirects onboarding-needed layout access to /owner-onboarding before protected work runs", async () => {
    requireAdminAccess.mockResolvedValue({
      session: { accessToken: "token", refreshToken: null },
        access: {
          state: "onboarding-needed",
          onboarding: { needsOnboarding: true, hasOperatorProfile: true, organizationId: null },
        },
      });

    await expect(
      AuthenticatedLayout({ children: <div data-testid="protected-child">Protected child</div> }),
    ).rejects.toMatchObject({
      digest: "NEXT_REDIRECT;replace;/owner-onboarding;307;",
    });
  });

  it("redirects existing-organization login sessions without a primary venue to /venue", async () => {
    readBackendSession.mockResolvedValue({ accessToken: "token", refreshToken: null });
    resolveAdminSessionAccess.mockResolvedValue({
      state: "onboarding-needed",
      onboarding: { needsOnboarding: true, hasOperatorProfile: true, organizationId: "org-1" },
    });

    await expect(LoginPage()).rejects.toMatchObject({
      digest: "NEXT_REDIRECT;replace;/venue;307;",
    });
  });

  it("redirects existing-organization register sessions without a primary venue to /venue", async () => {
    readBackendSession.mockResolvedValue({ accessToken: "token", refreshToken: null });
    resolveAdminSessionAccess.mockResolvedValue({
      state: "onboarding-needed",
      onboarding: { needsOnboarding: true, hasOperatorProfile: true, organizationId: "org-1" },
    });

    await expect(RegisterPage()).rejects.toMatchObject({
      digest: "NEXT_REDIRECT;replace;/venue;307;",
    });
  });

  it("redirects existing-organization onboarding access to /venue instead of rendering owner onboarding", async () => {
    requireBackendSession.mockResolvedValue({ accessToken: "token", refreshToken: null });
    resolveAdminSessionAccess.mockResolvedValue({
      state: "onboarding-needed",
      onboarding: { needsOnboarding: true, hasOperatorProfile: true, organizationId: "org-1" },
    });

    await expect(OwnerOnboardingPage()).rejects.toMatchObject({
      digest: "NEXT_REDIRECT;replace;/venue;307;",
    });
  });

  it("keeps existing-organization onboarding-needed layout access on the authenticated /venue recovery path", async () => {
    requireAdminAccess.mockResolvedValue({
      session: { accessToken: "token", refreshToken: null },
      access: {
        state: "onboarding-needed",
        onboarding: { needsOnboarding: true, hasOperatorProfile: true, organizationId: "org-1" },
      },
    });

    render(
      await AuthenticatedLayout({
        children: <div data-testid="venue-recovery-child">Venue recovery child</div>,
      }),
    );

    expect(screen.getByTestId("app-shell")).toBeInTheDocument();
    expect(screen.getByTestId("venue-recovery-child")).toBeInTheDocument();
  });
});
