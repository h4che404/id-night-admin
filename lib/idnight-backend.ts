import "server-only";

export const IDNIGHT_BACKEND_URL =
  process.env.IDNIGHT_BACKEND_URL ?? "https://api.idnight.app";

/* ── Types ─────────────────────────────────────────────────────── */

export type BackendAdminMe = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: string;
  active: boolean;
  venueId: string | null;
  venueName: string | null;
  organizationId: string | null;
  organizationName: string | null;
  membershipRole: string | null;
  membershipActive: boolean | null;
};

export type BackendVenue = {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  active: boolean;
};

export type BackendVenueEvent = {
  id: string;
  name: string;
  status: string;
  startsAt: string;
  endsAt: string;
  maxCapacity: number | null;
  minAge: number;
  allowManualDniCheck: boolean;
  requireGuestList: boolean;
};

export type BackendSecurityUser = {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  role: string;
  active: boolean;
  venueId: string;
  createdAt: string;
};

export type BackendVenueDevice = {
  id: string;
  name: string;
  deviceKey: string;
  status: string;
  statusLabel: string;
  active: boolean;
  accessPointName: string | null;
  lastActivityAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type BackendIncidentSummary = {
  id: string;
  createdAt: string;
  severity: string;
  status: string;
  category: string | null;
  eventId: string | null;
  eventName: string | null;
  venueName: string;
  operatorName: string | null;
  profileName: string | null;
  summary: string | null;
};

export type BackendIncidentDetail = BackendIncidentSummary & {
  description: string | null;
  followUp: string | null;
  evidence: string[] | null;
};

export type BackendVenueEntryRules = {
  active: boolean;
  minimumAge: number;
  requireVerifiedAdult: boolean;
  requireIdentityVerification: boolean;
  requireValidTicket: boolean;
  allowManualReview: boolean;
  notes: string | null;
};

export type BackendOwnerOnboardingStatus = {
  needsOnboarding: boolean;
  hasOperatorProfile: boolean;
  operatorRole: string | null;
  organizationId: string | null;
  organizationName: string | null;
  venueId: string | null;
  venueName: string | null;
};

export type BackendOwnerOnboardingResponse = {
  organizationId: string;
  organizationName: string;
  venueId: string;
  venueName: string;
  operatorId: string;
  operatorRole: string;
};

export type BackendGuestListEntry = {
  id: string;
  status: "ACTIVE" | "USED" | "CANCELLED";
  firstName: string;
  lastName: string;
  dniSuffix: string;
  category: string | null;
  importedAt: string;
};

export type BackendGuestListImportResult = {
  imported: number;
  duplicates: number;
  invalid: number;
  errors: Array<{ row: number; field: string; reason: string }>;
};

export type BackendDashboardMetrics = {
  eventsToday: number;
  activeEventsNow: number;
  admissionsToday: number;
  rejectionsToday: number;
  warningsToday: number;
  openIncidents: number;
};

export type BackendEventReport = {
  eventId: string;
  eventName: string;
  startsAt: string;
  endsAt: string;
  status: string;
  totalEntries: number;
  allowedCount: number;
  allowedWithWarningCount: number;
  rejectedCount: number;
  guestListTotal: number;
  guestListUsed: number;
  guestListCancelled: number;
  incidentCount: number;
};

export type BackendAccessSession = {
  id: string;
  occurredAt: string;
  method: "IDNIGHT_VERIFIED" | "MANUAL_DNI_CHECK" | "GUEST_LIST_DNI_CHECK";
  result: "ALLOWED" | "ALLOWED_WITH_WARNING" | "REJECTED";
  warningType: string | null;
  operatorName: string | null;
  deviceName: string | null;
  eventId: string;
  eventName: string | null;
};

/* ── API error ─────────────────────────────────────────────────── */

export class BackendApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "BackendApiError";
    this.status = status;
  }
}

/* ── Generic request helper ────────────────────────────────────── */

type RequestOptions = {
  token?: string;
  method?: string;
  body?: unknown;
  headers?: HeadersInit;
};

async function backendRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  let response: Response;
  try {
    response = await fetch(`${IDNIGHT_BACKEND_URL}${path}`, {
      method: options.method ?? "GET",
      headers: {
        "Content-Type": "application/json",
        ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
        ...options.headers,
      },
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      cache: "no-store",
      signal: controller.signal,
    });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new BackendApiError("El servicio no está disponible en este momento.", 503);
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    let message = `Backend request failed (${response.status})`;

    try {
      const payload = (await response.json()) as {
        message?: string;
        detail?: string;
        error?: string;
        title?: string;
      };
      if (payload?.message) {
        message = payload.message;
      } else if (payload?.detail) {
        message = payload.detail;
      } else if (payload?.error) {
        message = payload.error;
      } else if (payload?.title) {
        message = payload.title;
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

/* ── Admin profile ─────────────────────────────────────────────── */

export function fetchAdminProfile(token: string) {
  return backendRequest<BackendAdminMe>("/admin/me", { token });
}

export function fetchOwnerOnboardingStatus(token: string) {
  return backendRequest<BackendOwnerOnboardingStatus>("/organizations/onboarding", { token });
}

export function createOwnerOnboarding(
  token: string,
  data: { organizationName: string; venueName: string; city?: string; address?: string },
) {
  return backendRequest<BackendOwnerOnboardingResponse>("/organizations/onboarding", {
    token,
    method: "POST",
    body: data,
  });
}

export function updateAdminProfile(
  token: string,
  data: { firstName: string; lastName: string },
) {
  return backendRequest<BackendAdminMe>("/admin/me", {
    token,
    method: "PUT",
    body: data,
  });
}

/* ── Venue ─────────────────────────────────────────────────────── */

export function fetchMyVenue(token: string) {
  return backendRequest<BackendVenue>("/admin/venues/mine", { token });
}

export function createVenue(
  token: string,
  data: { name: string; address?: string; city?: string },
) {
  return backendRequest<BackendVenue>("/admin/venues", {
    token,
    method: "POST",
    body: data,
  });
}

export function updateVenue(
  token: string,
  data: { name: string; address?: string; city?: string },
) {
  return backendRequest<BackendVenue>("/admin/venues/mine", {
    token,
    method: "PUT",
    body: data,
  });
}

export function fetchMyVenueEntryRules(token: string) {
  return backendRequest<BackendVenueEntryRules>("/admin/venues/mine/entry-rules", { token });
}

export function updateMyVenueEntryRules(
  token: string,
  data: {
    active: boolean;
    minimumAge: number;
    requireVerifiedAdult: boolean;
    requireIdentityVerification: boolean;
    requireValidTicket: boolean;
    allowManualReview: boolean;
    notes?: string;
  },
) {
  return backendRequest<BackendVenueEntryRules>("/admin/venues/mine/entry-rules", {
    token,
    method: "PUT",
    body: data,
  });
}

export function fetchVenueEvents(token: string) {
  return backendRequest<BackendVenueEvent[]>("/admin/venues/mine/events", { token });
}

export function createVenueEvent(
  token: string,
  data: {
    name: string;
    startsAt: string;
    endsAt: string;
    maxCapacity?: number;
    minAge?: number;
    allowManualDniCheck?: boolean;
    requireGuestList?: boolean;
  },
) {
  return backendRequest<BackendVenueEvent>("/admin/venues/mine/events", {
    token,
    method: "POST",
    body: data,
  });
}

export function updateVenueEvent(
  token: string,
  id: string,
  data: {
    name?: string;
    startsAt?: string;
    endsAt?: string;
    maxCapacity?: number | null;
    minAge?: number;
    allowManualDniCheck?: boolean;
    requireGuestList?: boolean;
  },
) {
  return backendRequest<BackendVenueEvent>(`/admin/venues/mine/events/${id}`, {
    token,
    method: "PATCH",
    body: data,
  });
}

export function activateVenueEvent(token: string, id: string) {
  return backendRequest<BackendVenueEvent>(`/admin/venues/mine/events/${id}/activate`, {
    token,
    method: "POST",
  });
}

export function finishVenueEvent(token: string, id: string) {
  return backendRequest<BackendVenueEvent>(`/admin/venues/mine/events/${id}/finish`, {
    token,
    method: "POST",
  });
}

export function cancelVenueEvent(token: string, id: string) {
  return backendRequest<BackendVenueEvent>(`/admin/venues/mine/events/${id}/cancel`, {
    token,
    method: "POST",
  });
}

export function fetchEventGuestList(token: string, eventId: string) {
  return backendRequest<BackendGuestListEntry[]>(
    `/admin/venues/mine/events/${eventId}/guest-list`,
    { token },
  );
}

export async function uploadEventGuestList(
  token: string,
  eventId: string,
  formData: FormData,
): Promise<BackendGuestListImportResult> {
  const response = await fetch(
    `${IDNIGHT_BACKEND_URL}/admin/venues/mine/events/${eventId}/guest-list`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
      cache: "no-store",
    },
  );

  if (!response.ok) {
    let message = `Backend request failed (${response.status})`;
    try {
      const payload = (await response.json()) as { message?: string };
      if (payload?.message) message = payload.message;
    } catch { /* ignore */ }
    throw new BackendApiError(message, response.status);
  }

  return response.json() as Promise<BackendGuestListImportResult>;
}

export function cancelGuestListEntry(token: string, eventId: string, entryId: string) {
  return backendRequest<BackendGuestListEntry>(
    `/admin/venues/mine/events/${eventId}/guest-list/${entryId}`,
    { token, method: "PATCH", body: JSON.stringify({ status: "CANCELLED" }) },
  );
}

/* ── Security users ────────────────────────────────────────────── */

export function fetchSecurityUsers(token: string) {
  return backendRequest<BackendSecurityUser[]>("/admin/venues/mine/security-users", { token });
}

export function createSecurityUser(
  token: string,
  data: { firstName: string; lastName: string; email: string },
) {
  return backendRequest<BackendSecurityUser>("/admin/venues/mine/security-users", {
    token,
    method: "POST",
    body: data,
  });
}

export function updateSecurityUser(
  token: string,
  id: string,
  data: { firstName: string; lastName: string; email: string },
) {
  return backendRequest<BackendSecurityUser>(`/admin/venues/mine/security-users/${id}`, {
    token,
    method: "PUT",
    body: data,
  });
}

export function toggleSecurityUserStatus(token: string, id: string, active: boolean) {
  return backendRequest<BackendSecurityUser>(`/admin/venues/mine/security-users/${id}/status`, {
    token,
    method: "PATCH",
    body: { active },
  });
}

/* ── Authorized venue devices ──────────────────────────────────── */

export function fetchVenueDevices(token: string) {
  return backendRequest<BackendVenueDevice[]>("/admin/venues/mine/devices", { token });
}

export function createVenueDevice(
  token: string,
  data: { name: string; deviceKey: string },
) {
  return backendRequest<BackendVenueDevice>("/admin/venues/mine/devices", {
    token,
    method: "POST",
    body: data,
  });
}

export function updateVenueDevice(
  token: string,
  id: string,
  data: { name: string; deviceKey: string },
) {
  return backendRequest<BackendVenueDevice>(`/admin/venues/mine/devices/${id}`, {
    token,
    method: "PUT",
    body: data,
  });
}

export function toggleVenueDeviceStatus(token: string, id: string, active: boolean) {
  return backendRequest<BackendVenueDevice>(`/admin/venues/mine/devices/${id}/status`, {
    token,
    method: "PATCH",
    body: { active },
  });
}

/* ── Incidents ─────────────────────────────────────────────────── */

export function fetchAccessSessions(
  token: string,
  params: {
    eventId?: string;
    method?: string;
    result?: string;
    fromDate?: string;
    toDate?: string;
  } = {},
) {
  const query = new URLSearchParams();
  if (params.eventId) query.set("eventId", params.eventId);
  if (params.method) query.set("method", params.method);
  if (params.result) query.set("result", params.result);
  if (params.fromDate) query.set("fromDate", params.fromDate);
  if (params.toDate) query.set("toDate", params.toDate);
  const qs = query.toString();
  return backendRequest<BackendAccessSession[]>(
    `/admin/venues/mine/access-sessions${qs ? `?${qs}` : ""}`,
    { token },
  );
}

export function fetchVenueIncidents(token: string) {
  return backendRequest<BackendIncidentSummary[]>("/admin/venues/mine/incidents", { token });
}

export function fetchVenueIncident(token: string, id: string) {
  return backendRequest<BackendIncidentDetail>(`/admin/venues/mine/incidents/${id}`, { token });
}

export function updateVenueIncident(
  token: string,
  id: string,
  data: {
    severity?: string;
    status?: string;
    category?: string | null;
    eventId?: string | null;
    description?: string | null;
  },
) {
  return backendRequest<BackendIncidentDetail>(`/admin/venues/mine/incidents/${id}`, {
    token,
    method: "PATCH",
    body: data,
  });
}

/* ── Dashboard ─────────────────────────────────────────────────── */

export function fetchDashboardMetrics(token: string) {
  return backendRequest<BackendDashboardMetrics>("/admin/venues/mine/dashboard", { token });
}

/* ── Event report ──────────────────────────────────────────────── */

export function fetchEventReport(token: string, eventId: string) {
  return backendRequest<BackendEventReport>(
    `/admin/venues/mine/events/${eventId}/report`,
    { token },
  );
}
