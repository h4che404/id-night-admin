import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { BackendApiError, fetchAdminProfile, type BackendAdminMe } from "@/lib/idnight-backend";

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

  try {
    const profile = await fetchAdminProfile(session.accessToken);
    return { session, profile };
  } catch (error) {
    if (error instanceof BackendApiError && (error.status === 401 || error.status === 403)) {
      redirect("/login");
    }

    throw error;
  }
}
