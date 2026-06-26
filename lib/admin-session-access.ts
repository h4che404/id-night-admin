import {
  BackendApiError,
  bootstrapMe,
  fetchVenues,
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

function parseJwt(token: string) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = Buffer.from(base64, "base64").toString("utf8");
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export async function resolveAdminSessionAccess(
  accessToken: string,
): Promise<ResolvedAdminSessionAccess> {
  try {
    const bootstrap = await bootstrapMe(accessToken);
    const jwt = parseJwt(accessToken);

    const firstName = jwt?.user_metadata?.firstName || "";
    const lastName = jwt?.user_metadata?.lastName || "";
    const fullName = [firstName, lastName].filter(Boolean).join(" ") || jwt?.email || bootstrap.email;

    if (!bootstrap.organization) {
      return {
        kind: "onboarding",
        onboarding: {
          needsOnboarding: true,
          hasOperatorProfile: true,
          operatorRole: "Owner",
          organizationId: null,
          organizationName: null,
          venueId: null,
          venueName: null,
        },
      };
    }

    let venueId: string | null = null;
    let venueName: string | null = null;

    try {
      const venues = await fetchVenues(accessToken);
      if (venues && venues.length > 0) {
        venueId = venues[0].id;
        venueName = venues[0].name;
      }
    } catch {
      // Ignorar fallo de listado de venues y permitir inicialización degradada o creación de venue
    }

    const profile: BackendAdminMe = {
      id: bootstrap.id,
      email: bootstrap.email,
      firstName,
      lastName,
      fullName,
      role: "Owner",
      active: bootstrap.status === "active",
      venueId,
      venueName,
      organizationId: bootstrap.organization.id,
      organizationName: bootstrap.organization.name,
      membershipRole: "Owner",
      membershipActive: true,
    };

    return { kind: "admin", profile };
  } catch (error) {
    if (error instanceof BackendApiError) {
      if (error.status >= 500) {
        return { kind: "degraded" };
      }
      if (error.status === 401 || error.status === 403) {
        return { kind: "login" };
      }
    }
    throw error;
  }
}

