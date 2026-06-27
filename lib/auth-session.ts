import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";

import { resolveAdminSessionAccess, type ResolvedAdminSessionAccess } from "@/lib/admin-session-access";
import {
  BackendApiError,
  fetchOwnerOnboardingStatus,
  type BackendAdminMe,
  type BackendOwnerOnboardingStatus,
} from "@/lib/idnight-backend";

export const ACCESS_COOKIE = "idnight_admin_supabase_access_token";
export const REFRESH_COOKIE = "idnight_admin_supabase_refresh_token";

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
    access: await resolveAdminSessionAccess(currentSession.accessToken),
  };
}

export async function requireAdminAccess(): Promise<{
  session: BackendSession;
  access: ResolvedAdminSessionAccess;
}> {
  const session = await requireBackendSession();

  return {
    session,
    access: await resolveAdminSessionAccess(session.accessToken),
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
} | null> {
  const { session, access } = await requireAdminAccess();

  if (access.state === "ready") {
    return { session, profile: access.profile };
  }

  if (access.state === "onboarding-needed") {
    redirect("/owner-onboarding");
  }

  if (access.state === "degraded") {
    return null;
  }

  redirect("/login");
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
  const { session, access } = await readAdminAccess();

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
