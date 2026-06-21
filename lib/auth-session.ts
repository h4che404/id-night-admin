import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { resolveAdminSessionAccess } from "@/lib/admin-session-access";
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

export async function requireBackendProfile(): Promise<{
  session: BackendSession;
  profile: BackendAdminMe;
}> {
  const session = await requireBackendSession();

  const access = await resolveAdminSessionAccess(session.accessToken);

  if (access.kind === "admin") {
    return { session, profile: access.profile };
  }

  if (access.kind === "onboarding") {
    redirect("/owner-onboarding");
  }

  if (access.kind === "degraded") {
    redirect("/login");
  }

  redirect("/login");
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
