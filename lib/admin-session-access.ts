import {
  BackendApiError,
  fetchAdminProfile,
  fetchOwnerOnboardingStatus,
  type BackendAdminMe,
  type BackendOwnerOnboardingStatus,
} from "@/lib/idnight-backend";

export type ResolvedAdminSessionAccess =
  | {
      kind: "admin";
      profile: BackendAdminMe;
    }
  | {
      kind: "onboarding";
      onboarding: BackendOwnerOnboardingStatus;
    }
  | {
      kind: "degraded";
    }
  | {
      kind: "login";
    };

export async function resolveAdminSessionAccess(
  accessToken: string,
): Promise<ResolvedAdminSessionAccess> {
  try {
    const profile = await fetchAdminProfile(accessToken);
    return { kind: "admin", profile };
  } catch (error) {
    if (error instanceof BackendApiError && error.status >= 500) {
      return { kind: "degraded" };
    }
    if (!(error instanceof BackendApiError) || !isAccessResolutionStatus(error.status)) {
      throw error;
    }
  }

  try {
    const onboarding = await fetchOwnerOnboardingStatus(accessToken);

    if (onboarding.needsOnboarding) {
      return { kind: "onboarding", onboarding };
    }

    return { kind: "login" };
  } catch (error) {
    if (error instanceof BackendApiError) {
      if (error.status >= 500) return { kind: "degraded" };
      if (isAccessResolutionStatus(error.status)) return { kind: "login" };
    }

    throw error;
  }
}

function isAccessResolutionStatus(status: number) {
  return status === 401 || status === 403;
}
