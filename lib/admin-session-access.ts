import { cache } from "react";
import { unstable_cache } from "next/cache";

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
  sub?: string;
  email?: string;
  user_metadata?: {
    firstName?: string;
    lastName?: string;
  };
};

type SessionPerfLogPayload = {
  operation: "resolveAdminSessionAccess";
  durationMs: number;
  status: ResolvedAdminSessionAccess["state"];
  venueSource?: Extract<ResolvedAdminSessionAccess, { state: "ready" }>["venueSource"];
};

function logSessionPerf(payload: SessionPerfLogPayload) {
  console.info("[perf]", payload);
}

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
  const startedAt = Date.now();
  const fallbackIdentity = deriveIdentity(accessToken);

  try {
    const bootstrap = await bootstrapMe(accessToken);

    if (bootstrap.organizationId === null) {
      const result = buildOnboardingAccess(bootstrap);
      logSessionPerf({
        operation: "resolveAdminSessionAccess",
        durationMs: Date.now() - startedAt,
        status: result.state,
      });
      return result;
    }

    if (resolveBootstrapAdminContextMode(bootstrap) === "enriched") {
      const venueSummary = resolveBootstrapPrimaryVenueSummary(bootstrap);

      if (!venueSummary) {
        const result = buildOnboardingAccess(bootstrap);
        logSessionPerf({
          operation: "resolveAdminSessionAccess",
          durationMs: Date.now() - startedAt,
          status: result.state,
        });
        return result;
      }

      const result = buildReadyAccess(accessToken, bootstrap, venueSummary, "bootstrap");
      logSessionPerf({
        operation: "resolveAdminSessionAccess",
        durationMs: Date.now() - startedAt,
        status: result.state,
        venueSource: result.venueSource,
      });
      return result;
    }

    try {
      const venueSummary = normalizeVenueSummary(await fetchMyVenue(accessToken));

      if (!venueSummary) {
        const result = buildOnboardingAccess(bootstrap);
        logSessionPerf({
          operation: "resolveAdminSessionAccess",
          durationMs: Date.now() - startedAt,
          status: result.state,
        });
        return result;
      }

      const result = buildReadyAccess(accessToken, bootstrap, venueSummary, "legacy-fallback");
      logSessionPerf({
        operation: "resolveAdminSessionAccess",
        durationMs: Date.now() - startedAt,
        status: result.state,
        venueSource: result.venueSource,
      });
      return result;
    } catch (error) {
      if (error instanceof BackendApiError) {
        if (error.status === 404) {
          const result = buildOnboardingAccess(bootstrap);
          logSessionPerf({
            operation: "resolveAdminSessionAccess",
            durationMs: Date.now() - startedAt,
            status: result.state,
          });
          return result;
        }

        if (error.status === 403 && error.code === "OPERATOR_INACTIVE") {
          const result = {
            state: "degraded",
            identity: deriveIdentity(accessToken, bootstrap.email),
            reason: "operator-inactive",
          } satisfies Extract<ResolvedAdminSessionAccess, { state: "degraded" }>;
          logSessionPerf({
            operation: "resolveAdminSessionAccess",
            durationMs: Date.now() - startedAt,
            status: result.state,
          });
          return result;
        }

        if (error.status === 401 || error.status === 403) {
          const result = { state: "unauthorized" } satisfies Extract<ResolvedAdminSessionAccess, { state: "unauthorized" }>;
          logSessionPerf({
            operation: "resolveAdminSessionAccess",
            durationMs: Date.now() - startedAt,
            status: result.state,
          });
          return result;
        }
      }

      console.error("[session] venue-fallback degraded:", error instanceof BackendApiError ? error.status : "non-backend", error instanceof Error ? error.message : error);
      const result = {
        state: "degraded",
        identity: deriveIdentity(accessToken, bootstrap.email),
        reason: "venue-fallback",
      } satisfies Extract<ResolvedAdminSessionAccess, { state: "degraded" }>;
      logSessionPerf({
        operation: "resolveAdminSessionAccess",
        durationMs: Date.now() - startedAt,
        status: result.state,
      });
      return result;
    }
  } catch (error) {
    if (error instanceof BackendApiError) {
      if (error.status === 401 || error.status === 403) {
        const result = { state: "unauthorized" } satisfies Extract<ResolvedAdminSessionAccess, { state: "unauthorized" }>;
        logSessionPerf({
          operation: "resolveAdminSessionAccess",
          durationMs: Date.now() - startedAt,
          status: result.state,
        });
        return result;
      }

      console.error("[session] bootstrap degraded:", error.status, error.message);
      const result = {
        state: "degraded",
        identity: fallbackIdentity,
        reason: "bootstrap",
      } satisfies Extract<ResolvedAdminSessionAccess, { state: "degraded" }>;
      logSessionPerf({
        operation: "resolveAdminSessionAccess",
        durationMs: Date.now() - startedAt,
        status: result.state,
      });
      return result;
    }

    console.error("[session] bootstrap unexpected error:", error);
    const result = {
      state: "degraded",
      identity: fallbackIdentity,
      reason: "bootstrap",
    } satisfies Extract<ResolvedAdminSessionAccess, { state: "degraded" }>;
    logSessionPerf({
      operation: "resolveAdminSessionAccess",
      durationMs: Date.now() - startedAt,
      status: result.state,
    });
    return result;
  }
}

function extractJwtSub(token: string): string | null {
  return parseJwt(token)?.sub ?? null;
}

// Cached per user ID (sub), survives token refreshes. TTL of 60s is safe for an admin
// dashboard — operator deactivations and venue changes propagate within one minute.
function makeUnstableCachedResolver(userId: string) {
  return unstable_cache(
    (token: string) => resolveAdminSessionAccessUncached(token),
    [`admin-session-access:${userId}`],
    { revalidate: 60, tags: [`admin-session:${userId}`] },
  );
}

async function resolveAdminSessionAccessCached(accessToken: string) {
  const userId = extractJwtSub(accessToken);

  if (userId) {
    return makeUnstableCachedResolver(userId)(accessToken);
  }

  // No sub in token — fall back to in-flight deduplication only
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

export function getAdminSessionCacheTag(userId: string): string {
  return `admin-session:${userId}`;
}
