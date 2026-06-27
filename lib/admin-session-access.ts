import { cache } from "react";

import {
  BackendApiError,
  bootstrapMe,
  fetchMyVenue,
  type BackendAdminMe,
  type BackendOwnerOnboardingStatus,
} from "@/lib/idnight-backend";

const inFlightAccessResolutions = new Map<string, Promise<ResolvedAdminSessionAccess>>();

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
      venueSource: "legacy-fallback";
    }
  | {
      state: "onboarding-needed";
      onboarding: BackendOwnerOnboardingStatus;
    }
  | {
      state: "degraded";
      identity: JwtIdentity | null;
      reason: "bootstrap" | "venue-fallback";
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
  venue: { id: string; name: string },
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
    venueId: venue.id,
    venueName: venue.name,
    organizationId: bootstrap.organizationId,
    organizationName: bootstrap.organizationName,
    membershipRole: bootstrap.membershipRole,
    membershipActive: bootstrap.status === "active",
  } satisfies BackendAdminMe;
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

    try {
      const venue = await fetchMyVenue(accessToken);

      return {
        state: "ready",
        profile: buildReadyProfile(accessToken, bootstrap, venue),
        venueSource: "legacy-fallback",
      };
    } catch (error) {
      if (error instanceof BackendApiError) {
        if (error.status === 404) {
          return buildOnboardingAccess(bootstrap);
        }

        if (error.status === 401 || error.status === 403) {
          return { state: "unauthorized" };
        }

        if (error.status >= 500) {
          console.error("[session] venue-fallback degraded:", error.status, error.message);
          return {
            state: "degraded",
            identity: deriveIdentity(accessToken, bootstrap.email),
            reason: "venue-fallback",
          };
        }
      }

      throw error;
    }
  } catch (error) {
    if (error instanceof BackendApiError) {
      if (error.status >= 500) {
        console.error("[session] bootstrap degraded:", error.status, error.message);
        return {
          state: "degraded",
          identity: fallbackIdentity,
          reason: "bootstrap",
        };
      }

      if (error.status === 401 || error.status === 403) {
        return { state: "unauthorized" };
      }
    }

    throw error;
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
