import { cache } from "react";

import {
  BackendApiError,
  bootstrapMe,
  fetchMyVenue,
  type BackendAdminMe,
  type BackendOwnerOnboardingStatus,
  type BackendVenueSummary,
  normalizeVenueSummary,
  resolveBootstrapAdminContextMode,
  resolveBootstrapPrimaryVenueSummary,
} from "@/lib/idnight-backend";

const inFlightAccessResolutions = new Map<string, Promise<ResolvedAdminSessionAccess>>();

export type AdminVenueSummary = BackendVenueSummary;

export type JwtIdentity = {
  email: string | null;
  firstName: string;
  lastName: string;
  fullName: string;
};

export type ResolvedAdminSessionAccess =
  | {
      state: "ready";
      profile: BackendAdminMe;
      venueSummary: AdminVenueSummary;
      venueSource: "bootstrap" | "legacy-fallback";
    }
  | {
      state: "onboarding-needed";
      onboarding: BackendOwnerOnboardingStatus;
    }
  | {
      state: "degraded";
      identity: JwtIdentity | null;
      reason: "bootstrap" | "venue-fallback" | "operator-inactive";
    }
  | {
      state: "unauthorized";
    };

type JwtPayload = {
  email?: string;
  user_metadata?: {
    firstName?: string;
    lastName?: string;
  };
};

function parseJwt(token: string): JwtPayload | null {
  try {
    const base64Url = token.split(".")[1];

    if (!base64Url) {
      return null;
    }

    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = Buffer.from(base64, "base64").toString("utf8");
    return JSON.parse(jsonPayload) as JwtPayload;
  } catch {
    return null;
  }
}

function deriveIdentity(token: string, fallbackEmail?: string): JwtIdentity | null {
  const jwt = parseJwt(token);

  if (!jwt?.email && !fallbackEmail) {
    return null;
  }

  const firstName = jwt?.user_metadata?.firstName?.trim() ?? "";
  const lastName = jwt?.user_metadata?.lastName?.trim() ?? "";
  const email = jwt?.email ?? fallbackEmail ?? null;
  const fullName = [firstName, lastName].filter(Boolean).join(" ") || email || "Authenticated admin";

  return {
    email,
    firstName,
    lastName,
    fullName,
  };
}

function buildReadyProfile(
  accessToken: string,
  bootstrap: Awaited<ReturnType<typeof bootstrapMe>>,
  venueSummary: AdminVenueSummary,
) {
  const identity = deriveIdentity(accessToken, bootstrap.email);

  return {
    id: bootstrap.id,
    email: bootstrap.email,
    firstName: identity?.firstName ?? "",
    lastName: identity?.lastName ?? "",
    fullName: identity?.fullName ?? bootstrap.email,
    role: bootstrap.membershipRole ?? "Owner",
    active: bootstrap.status === "active",
    venueId: venueSummary.id,
    venueName: venueSummary.name,
    organizationId: bootstrap.organizationId,
    organizationName: bootstrap.organizationName,
    membershipRole: bootstrap.membershipRole,
    membershipActive: bootstrap.status === "active",
  } satisfies BackendAdminMe;
}

function buildReadyAccess(
  accessToken: string,
  bootstrap: Awaited<ReturnType<typeof bootstrapMe>>,
  venueSummary: AdminVenueSummary,
  venueSource: Extract<ResolvedAdminSessionAccess, { state: "ready" }>["venueSource"],
): Extract<ResolvedAdminSessionAccess, { state: "ready" }> {
  return {
    state: "ready",
    profile: buildReadyProfile(accessToken, bootstrap, venueSummary),
    venueSummary,
    venueSource,
  };
}

function buildOnboardingAccess(
  bootstrap: Awaited<ReturnType<typeof bootstrapMe>>,
): Extract<ResolvedAdminSessionAccess, { state: "onboarding-needed" }> {
  return {
    state: "onboarding-needed",
    onboarding: {
      needsOnboarding: true,
      hasOperatorProfile: true,
      operatorRole: bootstrap.membershipRole ?? "Owner",
      organizationId: bootstrap.organizationId,
      organizationName: bootstrap.organizationName,
      venueId: null,
      venueName: null,
    },
  };
}

export async function resolveAdminSessionAccessUncached(
  accessToken: string,
): Promise<ResolvedAdminSessionAccess> {
  const fallbackIdentity = deriveIdentity(accessToken);

  try {
    const bootstrap = await bootstrapMe(accessToken);

    if (bootstrap.organizationId === null) {
      return buildOnboardingAccess(bootstrap);
    }

    if (resolveBootstrapAdminContextMode(bootstrap) === "enriched") {
      const venueSummary = resolveBootstrapPrimaryVenueSummary(bootstrap);

      if (!venueSummary) {
        return buildOnboardingAccess(bootstrap);
      }

      return buildReadyAccess(accessToken, bootstrap, venueSummary, "bootstrap");
    }

    try {
      const venueSummary = normalizeVenueSummary(await fetchMyVenue(accessToken));

      if (!venueSummary) {
        return buildOnboardingAccess(bootstrap);
      }

      return buildReadyAccess(accessToken, bootstrap, venueSummary, "legacy-fallback");
    } catch (error) {
      if (error instanceof BackendApiError) {
        if (error.status === 404) {
          return buildOnboardingAccess(bootstrap);
        }

        if (error.status === 403 && error.code === "OPERATOR_INACTIVE") {
          return {
            state: "degraded",
            identity: deriveIdentity(accessToken, bootstrap.email),
            reason: "operator-inactive",
          };
        }

        if (error.status === 401 || error.status === 403) {
          return { state: "unauthorized" };
        }
      }

      console.error("[session] venue-fallback degraded:", error instanceof BackendApiError ? error.status : "non-backend", error instanceof Error ? error.message : error);
      return {
        state: "degraded",
        identity: deriveIdentity(accessToken, bootstrap.email),
        reason: "venue-fallback",
      };
    }
  } catch (error) {
    if (error instanceof BackendApiError) {
      if (error.status === 401 || error.status === 403) {
        return { state: "unauthorized" };
      }

      console.error("[session] bootstrap degraded:", error.status, error.message);
      return {
        state: "degraded",
        identity: fallbackIdentity,
        reason: "bootstrap",
      };
    }

    console.error("[session] bootstrap unexpected error:", error);
    return {
      state: "degraded",
      identity: fallbackIdentity,
      reason: "bootstrap",
    };
  }
}

async function resolveAdminSessionAccessCached(accessToken: string) {
  const existingResolution = inFlightAccessResolutions.get(accessToken);

  if (existingResolution) {
    return existingResolution;
  }

  const resolution = resolveAdminSessionAccessUncached(accessToken).finally(() => {
    inFlightAccessResolutions.delete(accessToken);
  });

  inFlightAccessResolutions.set(accessToken, resolution);

  return resolution;
}

export const resolveAdminSessionAccess = cache(resolveAdminSessionAccessCached);
