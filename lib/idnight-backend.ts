import "server-only";

export const IDNIGHT_BACKEND_URL =
  process.env.IDNIGHT_BACKEND_URL ?? "https://backend-id-night.azurewebsites.net";

export type BackendAuthResponse = {
  accessToken: string;
  refreshToken: string;
  expiresInSeconds: number;
};

export type BackendAdminMe = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: string;
  active: boolean;
  venueId: string;
  venueName: string;
};

export type BackendVenue = {
  id: string;
  name: string;
  legalName: string | null;
  active: boolean;
  accessPoints: number;
  operators: number;
  devices: number;
};

export type BackendAccessPoint = {
  id: string;
  venueId: string;
  venueName: string;
  name: string;
  active: boolean;
  status: string;
  operatorName: string;
  deviceName: string;
  lastActivity: string | null;
  throughput: string | null;
};

export type BackendOperator = {
  id: string;
  name: string;
  role: string;
  venueId: string;
  venueName: string;
  status: string;
  email: string;
  documentId: string;
  lastSession: string | null;
  permissions: string[];
};

export type BackendDevice = {
  id: string;
  name: string;
  venueId: string;
  venueName: string;
  accessPointName: string;
  status: string;
  syncAt: string | null;
  appVersion: string;
  battery: string;
  deviceKey: string;
};

export type BackendProfile = {
  id: string;
  name: string;
  documentMasked: string;
  verification: string;
  enrolledAt: string;
  consentAccepted: boolean;
  alerts: number;
  incidents: number;
  recentVenue: string;
  recentAccessResult: string;
};

export type BackendAccessSession = {
  id: string;
  occurredAt: string;
  personName: string;
  venueName: string;
  accessPointName: string;
  operatorName: string;
  result: string;
  reason: string | null;
};

export type BackendAccessSessionDetail = BackendAccessSession & {
  alertSummary: string | null;
};

export type BackendIncident = {
  id: string;
  createdAt: string;
  severity: string;
  status: string;
  venueName: string;
  operatorName: string;
  profileName: string;
  summary: string;
};

export type BackendIncidentDetail = BackendIncident & {
  description: string;
  followUp: string;
  evidence: string[];
};

export type BackendAlert = {
  id: string;
  level: string;
  profileName: string;
  venueName: string;
  reason: string;
  sourceIncidentId: string | null;
  expiresAt: string | null;
  owner: string;
};

export type BackendAuditLog = {
  id: string;
  occurredAt: string;
  actor: string;
  action: string;
  entity: string | null;
  venueName: string | null;
  metadata: string | null;
};

export type BackendBiometricStatus = {
  profileId: string | null;
  biometricStatus: string;
  hasActiveTemplate: boolean;
  provider: string | null;
  modelName: string | null;
  modelVersion: string | null;
  dimension: number | null;
  enrolledAt: string | null;
  lastMatchedAt: string | null;
};

export type BackendHealth = {
  status: string;
  groups?: string[];
};

export type BackendSystemHealth = {
  status: string;
  venues: number;
  operators: number;
  devices: number;
  profiles: number;
  accessSessions: number;
  incidents: number;
  alerts: number;
  auditLogs: number;
};

export type BackendProfileDetail = {
  summary: BackendProfile;
  accesses: BackendAccessSession[];
  incidents: BackendIncident[];
  alerts: BackendAlert[];
  audit: BackendAuditLog[];
};

export class BackendApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "BackendApiError";
    this.status = status;
  }
}

type RequestOptions = {
  token?: string;
  method?: string;
  body?: unknown;
  headers?: HeadersInit;
};

async function backendRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await fetch(`${IDNIGHT_BACKEND_URL}${path}`, {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      ...options.headers,
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    cache: "no-store",
  });

  if (!response.ok) {
    let message = `Backend request failed (${response.status})`;

    try {
      const payload = (await response.json()) as { message?: string };
      if (payload?.message) {
        message = payload.message;
      }
    } catch {
      const text = await response.text();
      if (text) {
        message = text;
      }
    }

    throw new BackendApiError(message, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export function backendLogin(email: string, password: string) {
  return backendRequest<BackendAuthResponse>("/admin/auth/login", {
    method: "POST",
    body: { email, password },
  });
}

export function backendRefresh(refreshToken: string) {
  return backendRequest<BackendAuthResponse>("/admin/auth/refresh", {
    method: "POST",
    body: { refreshToken },
  });
}

export function fetchBackendProfile(token: string) {
  return backendRequest<BackendAdminMe>("/admin/me", { token });
}

export function fetchBackendVenues(token: string) {
  return backendRequest<BackendVenue[]>("/admin/venues", { token });
}

export function fetchBackendAccessPoints(token: string) {
  return backendRequest<BackendAccessPoint[]>("/admin/access-points", { token });
}

export function fetchBackendOperators(token: string) {
  return backendRequest<BackendOperator[]>("/admin/operators", { token });
}

export function fetchBackendOperatorDetail(token: string, id: string) {
  return backendRequest<BackendOperator>(`/admin/operators/${id}`, { token });
}

export function fetchBackendDevices(token: string) {
  return backendRequest<BackendDevice[]>("/admin/devices", { token });
}

export function fetchBackendProfiles(token: string) {
  return backendRequest<BackendProfile[]>("/admin/profiles", { token });
}

export function fetchBackendProfileDetail(token: string, id: string) {
  return backendRequest<BackendProfileDetail>(`/admin/profiles/${id}`, { token });
}

export function fetchBackendAccessSessions(token: string) {
  return backendRequest<BackendAccessSession[]>("/admin/access-sessions", { token });
}

export function fetchBackendAccessSessionDetail(token: string, id: string) {
  return backendRequest<BackendAccessSessionDetail>(`/admin/access-sessions/${id}`, { token });
}

export function fetchBackendIncidents(token: string) {
  return backendRequest<BackendIncident[]>("/admin/incidents", { token });
}

export function fetchBackendIncidentDetail(token: string, id: string) {
  return backendRequest<BackendIncidentDetail>(`/admin/incidents/${id}`, { token });
}

export function fetchBackendAlerts(token: string) {
  return backendRequest<BackendAlert[]>("/admin/alerts", { token });
}

export function fetchBackendAudit(token: string) {
  return backendRequest<BackendAuditLog[]>("/admin/audit", { token });
}

export function fetchBackendSystemHealth(token: string) {
  return backendRequest<BackendSystemHealth>("/admin/system/health", { token });
}

export function fetchBackendBiometricStatus(token: string) {
  return backendRequest<BackendBiometricStatus>("/me/biometric/status", { token });
}

export function fetchBackendHealth() {
  return backendRequest<BackendHealth>("/actuator/health");
}

export async function fetchBackendSnapshot(token: string) {
  const [health, me, venues, accessPoints, operators, devices, profiles, accesses, incidents, alerts, audit, system] = await Promise.allSettled([
    fetchBackendHealth(),
    fetchBackendProfile(token),
    fetchBackendVenues(token),
    fetchBackendAccessPoints(token),
    fetchBackendOperators(token),
    fetchBackendDevices(token),
    fetchBackendProfiles(token),
    fetchBackendAccessSessions(token),
    fetchBackendIncidents(token),
    fetchBackendAlerts(token),
    fetchBackendAudit(token),
    fetchBackendSystemHealth(token),
  ]);

  return {
    health: health.status === "fulfilled" ? health.value : null,
    me: me.status === "fulfilled" ? me.value : null,
    venues: venues.status === "fulfilled" ? venues.value : [],
    accessPoints: accessPoints.status === "fulfilled" ? accessPoints.value : [],
    operators: operators.status === "fulfilled" ? operators.value : [],
    devices: devices.status === "fulfilled" ? devices.value : [],
    profiles: profiles.status === "fulfilled" ? profiles.value : [],
    accesses: accesses.status === "fulfilled" ? accesses.value : [],
    incidents: incidents.status === "fulfilled" ? incidents.value : [],
    alerts: alerts.status === "fulfilled" ? alerts.value : [],
    audit: audit.status === "fulfilled" ? audit.value : [],
    system: system.status === "fulfilled" ? system.value : null,
  };
}
