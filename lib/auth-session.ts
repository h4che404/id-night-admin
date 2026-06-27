import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";

import {
  resolveAdminSessionAccess,
  resolveAdminSessionAccessUncached,
  type ResolvedAdminSessionAccess,
} from "@/lib/admin-session-access";
import { cache } from "react";
import {
  BackendApiError,
  fetchOwnerOnboardingStatus,
  type BackendAdminMe,
  type BackendOwnerOnboardingStatus,
} from "@/lib/idnight-backend";
import type { AdminVenueSummary } from "@/lib/admin-session-access";

export const ACCESS_COOKIE = "idnight_admin_supabase_access_token";
export const REFRESH_COOKIE = "idnight_admin_supabase_refresh_token";
export const PROFILE_COOKIE = "idnight_admin_profile";

export type BackendSession = {
  accessToken: string;
  refreshToken: string | null;
};

export async function readBackendSession(): Promise<BackendSession | null> {
  const store = await cookies();
  const accessToken = store.get(ACCESS_COOKIE)?.value;

  if (!accessToken) {
    return null;
  }

  return {
    accessToken,
    refreshToken: store.get(REFRESH_COOKIE)?.value ?? null,
  };
}

export async function requireBackendSession(): Promise<BackendSession> {
  const session = await readBackendSession();

  if (!session) {
    redirect("/login");
  }

  return session;
}

export const getCachedProfile = cache(async (accessToken: string): Promise<ResolvedAdminSessionAccess> => {
  const store = await cookies();
  const cached = store.get(PROFILE_COOKIE)?.value;

  if (cached) {
    try {
      const parsed = JSON.parse(cached) as ResolvedAdminSessionAccess;
      if (parsed && typeof parsed === "object" && "state" in parsed) {
        return parsed;
      }
    } catch {
      // invalid cache, proceed to fetch
    }
  }

  const access = await resolveAdminSessionAccess(accessToken);

  if (access.state === "ready" || access.state === "onboarding-needed") {
    store.set(PROFILE_COOKIE, JSON.stringify(access), {
      maxAge: 15 * 60,
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });
  }

  return access;
});

export async function readAdminAccess(session?: BackendSession | null): Promise<{
  session: BackendSession | null;
  access: ResolvedAdminSessionAccess | { state: "anonymous" };
}> {
  const currentSession = session === undefined ? await readBackendSession() : session;

  if (!currentSession) {
    return {
      session: null,
      access: { state: "anonymous" },
    };
  }

  return {
    session: currentSession,
    access: await getCachedProfile(currentSession.accessToken),
  };
}

async function readRouteHandlerAdminAccess(session?: BackendSession | null): Promise<{
  session: BackendSession | null;
  access: ResolvedAdminSessionAccess | { state: "anonymous" };
}> {
  const currentSession = session === undefined ? await readBackendSession() : session;

  if (!currentSession) {
    return {
      session: null,
      access: { state: "anonymous" },
    };
  }

  return {
    session: currentSession,
    access: await resolveAdminSessionAccessUncached(currentSession.accessToken),
  };
}

export async function requireAdminAccess(): Promise<{
  session: BackendSession;
  access: ResolvedAdminSessionAccess;
}> {
  const session = await requireBackendSession();

  return {
    session,
    access: await getCachedProfile(session.accessToken),
  };
}

export async function requireReadyBackendProfile(): Promise<{
  session: BackendSession;
  profile: BackendAdminMe;
}> {
  const { session, access } = await requireAdminAccess();

  if (access.state === "ready") {
    return { session, profile: access.profile };
  }

  if (access.state === "onboarding-needed") {
    if (canRecoverVenueSetup(access)) {
      redirect("/venue");
    }
    redirect("/owner-onboarding");
  }

  if (access.state === "degraded") {
    redirect("/login");
  }

  redirect("/login");
}

export const requireBackendProfile = requireReadyBackendProfile;

export async function requireReadyPageAccess(): Promise<{
  session: BackendSession;
  profile: BackendAdminMe;
  venueSummary: AdminVenueSummary;
} | null> {
  const { session, access } = await requireAdminAccess();

  if (access.state === "ready") {
    return { session, profile: access.profile, venueSummary: access.venueSummary };
  }

  if (access.state === "onboarding-needed") {
    if (canRecoverVenueSetup(access)) {
      redirect("/venue");
    }
    redirect("/owner-onboarding");
  }

  if (access.state === "degraded") {
    return null;
  }

  redirect("/login");
}

export function canRecoverVenueSetup(
  access: ResolvedAdminSessionAccess,
): access is Extract<ResolvedAdminSessionAccess, { state: "onboarding-needed" }> {
  return access.state === "onboarding-needed" && access.onboarding.organizationId !== null;
}

const API_AUTH_REQUIRED_MESSAGE = "Authentication required.";
const API_SETUP_INCOMPLETE_MESSAGE = "Complete organization setup before using venue APIs.";
const API_DEGRADED_MESSAGE = "Admin context is temporarily unavailable. Please retry shortly.";

export async function readReadyVenueApiAccess(): Promise<
  | {
      session: BackendSession;
      profile: BackendAdminMe;
    }
  | {
      response: Response;
    }
> {
  const { session, access } = await readRouteHandlerAdminAccess();

  if (!session || access.state === "anonymous" || access.state === "unauthorized") {
    return {
      response: NextResponse.json({ message: API_AUTH_REQUIRED_MESSAGE }, { status: 401 }),
    };
  }

  if (access.state === "onboarding-needed") {
    return {
      response: NextResponse.json({ message: API_SETUP_INCOMPLETE_MESSAGE }, { status: 403 }),
    };
  }

  if (access.state === "degraded") {
    return {
      response: NextResponse.json({ message: API_DEGRADED_MESSAGE }, { status: 503 }),
    };
  }

  return {
    session,
    profile: access.profile,
  };
}

export async function readVenueSetupApiAccess(): Promise<
  | {
      session: BackendSession;
    }
  | {
      response: Response;
    }
> {
  const { session, access } = await readRouteHandlerAdminAccess();

  if (!session || access.state === "anonymous" || access.state === "unauthorized") {
    return {
      response: NextResponse.json({ message: API_AUTH_REQUIRED_MESSAGE }, { status: 401 }),
    };
  }

  if (access.state === "degraded") {
    return {
      response: NextResponse.json({ message: API_DEGRADED_MESSAGE }, { status: 503 }),
    };
  }

  if (access.state === "onboarding-needed" && !canRecoverVenueSetup(access)) {
    return {
      response: NextResponse.json({ message: API_SETUP_INCOMPLETE_MESSAGE }, { status: 403 }),
    };
  }

  return { session };
}

export async function readOwnerOnboardingStatus(
  session?: BackendSession,
): Promise<BackendOwnerOnboardingStatus | null> {
  const currentSession = session ?? (await readBackendSession());

  if (!currentSession) {
    return null;
  }

  try {
    return await fetchOwnerOnboardingStatus(currentSession.accessToken);
  } catch (error) {
    if (error instanceof BackendApiError && (error.status === 401 || error.status === 403)) {
      return null;
    }

    throw error;
  }
}
