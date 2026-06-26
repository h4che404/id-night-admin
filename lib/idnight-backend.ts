import "server-only";

export const IDNIGHT_BACKEND_URL =
  process.env.IDNIGHT_BACKEND_URL ?? "https://api.idnight.app/api/v1";

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

export type BackendBootstrapResponse = {
  id: string;
  supabaseId: string;
  email: string;
  status: string;
  createdAt: string;
  organization: {
    id: string;
    name: string;
    createdAt: string;
  } | null;
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
  isBodyJson?: boolean;
};

function extractBackendErrorMessage(
  payload: { message?: unknown; detail?: unknown; error?: unknown; title?: unknown } | null,
) {
  if (!payload) {
    return null;
  }

  if (typeof payload.message === "string" && payload.message.trim()) {
    return payload.message.trim();
  }

  if (typeof payload.detail === "string" && payload.detail.trim()) {
    return payload.detail.trim();
  }

  if (typeof payload.error === "string" && payload.error.trim()) {
    return payload.error.trim();
  }

  if (typeof payload.title === "string" && payload.title.trim()) {
    return payload.title.trim();
  }

  return null;
}

async function readBackendErrorMessage(response: Response) {
  const fallbackMessage = `Backend request failed (${response.status})`;

  let rawBody = "";

  try {
    rawBody = await response.text();
  } catch {
    return fallbackMessage;
  }

  const normalizedBody = rawBody.trim();

  if (!normalizedBody) {
    return fallbackMessage;
  }

  try {
    const payload = JSON.parse(normalizedBody) as
      | { message?: unknown; detail?: unknown; error?: unknown; title?: unknown }
      | string;

    if (typeof payload === "string" && payload.trim()) {
      return payload.trim();
    }

    return extractBackendErrorMessage(typeof payload === "object" && payload !== null ? payload : null) ?? normalizedBody;
  } catch {
    return normalizedBody;
  }
}

async function performBackendFetch(path: string, options: RequestOptions = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    return await fetch(`${IDNIGHT_BACKEND_URL}${path}`, {
      method: options.method ?? "GET",
      headers: {
        ...(options.isBodyJson === false ? {} : { "Content-Type": "application/json" }),
        ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
        ...options.headers,
      },
      body:
        options.isBodyJson === false
          ? (options.body as BodyInit | null | undefined)
          : options.body !== undefined
            ? JSON.stringify(options.body)
            : undefined,
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
}

async function backendRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await performBackendFetch(path, options);

  if (!response.ok) {
    const message = await readBackendErrorMessage(response);
    throw new BackendApiError(message, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

/* ── Bootstrap / Auth ───────────────────────────────────────────── */

export function bootstrapMe(token: string) {
  return backendRequest<BackendBootstrapResponse>("/bootstrap/me", {
    token,
    method: "POST",
    headers: {
      "X-Client-Type": "admin",
    },
  });
}

// Deprecated: keeping signature for compatibility, but backing it via bootstrapMe
export async function fetchAdminProfile(token: string): Promise<BackendAdminMe> {
  const bootstrap = await bootstrapMe(token);
  return {
    id: bootstrap.id,
    email: bootstrap.email,
    firstName: "",
    lastName: "",
    fullName: bootstrap.email,
    role: "Owner",
    active: bootstrap.status === "active",
    venueId: null,
    venueName: null,
    organizationId: bootstrap.organization?.id ?? null,
    organizationName: bootstrap.organization?.name ?? null,
    membershipRole: "Owner",
    membershipActive: true,
  };
}

// Deprecated: kept for compatibility
export async function fetchOwnerOnboardingStatus(token: string): Promise<BackendOwnerOnboardingStatus> {
  const bootstrap = await bootstrapMe(token);
  return {
    needsOnboarding: bootstrap.organization === null,
    hasOperatorProfile: true,
    operatorRole: "Owner",
    organizationId: bootstrap.organization?.id ?? null,
    organizationName: bootstrap.organization?.name ?? null,
    venueId: null,
    venueName: null,
  };
}

// Deprecated: replaced by bootstrapped organization + POST /venues
export async function createOwnerOnboarding(
  token: string,
  data: { organizationName: string; venueName: string; city?: string; address?: string },
): Promise<BackendOwnerOnboardingResponse> {
  // First bootstrap user to create organization
  const bootstrap = await bootstrapMe(token);
  const orgId = bootstrap.organization?.id || "";

  // Then create venue under that organization
  const venue = await createVenue(token, {
    name: data.venueName,
    address: data.address,
    city: data.city,
  });

  return {
    organizationId: orgId,
    organizationName: data.organizationName,
    venueId: venue.id,
    venueName: venue.name,
    operatorId: bootstrap.id,
    operatorRole: "Owner",
  };
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

export function fetchVenues(token: string) {
  return backendRequest<BackendVenue[]>("/venues", { token });
}

// Replaced fetchMyVenue dynamically via fetchVenues or direct ID lookup
export async function fetchMyVenue(token: string): Promise<BackendVenue> {
  const venues = await fetchVenues(token);
  if (!venues || venues.length === 0) {
    throw new BackendApiError("No se encontró ningún boliche configurado.", 404);
  }
  return venues[0];
}

export function createVenue(
  token: string,
  data: { name: string; address?: string; city?: string },
) {
  return backendRequest<BackendVenue>("/venues", {
    token,
    method: "POST",
    body: data,
  });
}

export function updateVenue(
  token: string,
  venueId: string,
  data: { name: string; address?: string; city?: string },
) {
  return backendRequest<BackendVenue>(`/venues/${venueId}`, {
    token,
    method: "PATCH",
    body: data,
  });
}

export function fetchMyVenueEntryRules(token: string, venueId: string) {
  return backendRequest<BackendVenueEntryRules>(`/venues/${venueId}/entry-rules`, { token });
}

export function updateMyVenueEntryRules(
  token: string,
  venueId: string,
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
  return backendRequest<BackendVenueEntryRules>(`/venues/${venueId}/entry-rules`, {
    token,
    method: "PUT",
    body: data,
  });
}

export function fetchVenueEvents(token: string, venueId: string) {
  return backendRequest<BackendVenueEvent[]>(`/venues/${venueId}/events`, { token });
}

export function createVenueEvent(
  token: string,
  venueId: string,
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
  return backendRequest<BackendVenueEvent>(`/venues/${venueId}/events`, {
    token,
    method: "POST",
    body: data,
  });
}

export function updateVenueEvent(
  token: string,
  venueId: string,
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
  return backendRequest<BackendVenueEvent>(`/venues/${venueId}/events/${id}`, {
    token,
    method: "PATCH",
    body: data,
  });
}

export function activateVenueEvent(token: string, venueId: string, id: string) {
  return backendRequest<BackendVenueEvent>(`/venues/${venueId}/events/${id}/activate`, {
    token,
    method: "POST",
  });
}

export function finishVenueEvent(token: string, venueId: string, id: string) {
  return backendRequest<BackendVenueEvent>(`/venues/${venueId}/events/${id}/finish`, {
    token,
    method: "POST",
  });
}

export function cancelVenueEvent(token: string, venueId: string, id: string) {
  return backendRequest<BackendVenueEvent>(`/venues/${venueId}/events/${id}/cancel`, {
    token,
    method: "POST",
  });
}

export function fetchEventGuestList(token: string, venueId: string, eventId: string) {
  return backendRequest<BackendGuestListEntry[]>(
    `/venues/${venueId}/events/${eventId}/guest-list`,
    { token },
  );
}

export async function uploadEventGuestList(
  token: string,
  venueId: string,
  eventId: string,
  formData: FormData,
): Promise<BackendGuestListImportResult> {
  const response = await performBackendFetch(`/venues/${venueId}/events/${eventId}/guest-list/upload`, {
    token,
    method: "POST",
    body: formData,
    isBodyJson: false,
  });

  if (!response.ok) {
    const message = await readBackendErrorMessage(response);
    throw new BackendApiError(message, response.status);
  }

  return response.json() as Promise<BackendGuestListImportResult>;
}

export function cancelGuestListEntry(token: string, venueId: string, eventId: string, entryId: string) {
  return backendRequest<BackendGuestListEntry>(
    `/venues/${venueId}/events/${eventId}/guest-list/entries/${entryId}`,
    { token, method: "DELETE" },
  );
}

/* ── Security users ────────────────────────────────────────────── */

export function fetchSecurityUsers(token: string, venueId: string) {
  return backendRequest<BackendSecurityUser[]>(`/venues/${venueId}/operators`, { token });
}

export function createSecurityUser(
  token: string,
  venueId: string,
  data: { firstName: string; lastName: string; email: string; role?: string },
) {
  return backendRequest<BackendSecurityUser>(`/venues/${venueId}/operators`, {
    token,
    method: "POST",
    body: {
      name: `${data.firstName} ${data.lastName}`.trim(),
      email: data.email,
      role: data.role ?? "GUARD",
    },
  });
}

export function updateSecurityUser(
  token: string,
  venueId: string,
  id: string,
  data: { firstName: string; lastName: string; email: string; role?: string },
) {
  return backendRequest<BackendSecurityUser>(`/venues/${venueId}/operators/${id}`, {
    token,
    method: "PATCH",
    body: {
      name: `${data.firstName} ${data.lastName}`.trim(),
      role: data.role ?? "GUARD",
    },
  });
}

export function toggleSecurityUserStatus(token: string, venueId: string, id: string, active: boolean) {
  // Map security user toggle to DELETE (to remove) or POST to re-add, or update if the contract supports active status.
  // In the new operator contract: DELETE removes an operator. We will keep DELETE since it's the standard clean way.
  if (!active) {
    return backendRequest<BackendSecurityUser>(`/venues/${venueId}/operators/${id}`, {
      token,
      method: "DELETE",
    });
  }
  // If active is true, we fallback/noop or throw as operator addition requires full creation.
  return Promise.resolve({ id } as BackendSecurityUser);
}

/* ── Authorized venue devices ──────────────────────────────────── */

export async function fetchVenueDevices(token: string, venueId: string): Promise<BackendVenueDevice[]> {
  const rawDevices = await backendRequest<Array<{
    id: string;
    name: string;
    serialNumber: string;
    status: string;
    deactivatedAt: string | null;
    createdAt: string;
  }>>(`/venues/${venueId}/devices`, { token });

  return rawDevices.map((d) => ({
    id: d.id,
    name: d.name,
    deviceKey: d.serialNumber,
    status: d.status.toUpperCase() === "ACTIVE" ? "ACTIVE" : "INACTIVE",
    statusLabel: d.status.toUpperCase() === "ACTIVE" ? "Activo" : "Inactivo",
    active: d.status.toUpperCase() === "ACTIVE",
    accessPointName: null,
    lastActivityAt: null,
    createdAt: d.createdAt,
    updatedAt: null,
  }));
}

export function createVenueDevice(
  token: string,
  venueId: string,
  data: { name: string; serialNumber: string },
) {
  return backendRequest<BackendVenueDevice>(`/venues/${venueId}/devices`, {
    token,
    method: "POST",
    body: data,
  });
}

export function updateVenueDevice(
  token: string,
  venueId: string,
  id: string,
  data: { name: string; serialNumber: string },
) {
  return backendRequest<BackendVenueDevice>(`/venues/${venueId}/devices/${id}`, {
    token,
    method: "PATCH",
    body: data,
  });
}

export function toggleVenueDeviceStatus(token: string, venueId: string, id: string, active: boolean) {
  if (!active) {
    return backendRequest<BackendVenueDevice>(`/venues/${venueId}/devices/${id}/deactivate`, {
      token,
      method: "PATCH",
    });
  }
  return Promise.resolve({ id } as BackendVenueDevice);
}

/* ── Incidents / Access Sessions ───────────────────────────────── */

export function fetchAccessSessions(
  token: string,
  venueId: string,
  params: {
    eventId?: string;
    method?: string;
    result?: string;
    fromDate?: string;
    toDate?: string;
  } = {},
) {
  // If eventId is missing, access sessions might not be easily fetched at the venue level under the new contract.
  // We default to the path: /venues/{venueId}/events/{eventId}/access-sessions
  const eventId = params.eventId ?? "00000000-0000-0000-0000-000000000000";
  const query = new URLSearchParams();
  if (params.method) query.set("method", params.method);
  if (params.result) query.set("result", params.result);
  if (params.fromDate) query.set("fromDate", params.fromDate);
  if (params.toDate) query.set("toDate", params.toDate);
  const qs = query.toString();
  return backendRequest<BackendAccessSession[]>(
    `/venues/${venueId}/events/${eventId}/access-sessions${qs ? `?${qs}` : ""}`,
    { token },
  );
}

export function fetchVenueIncidents(token: string, venueId: string) {
  return backendRequest<BackendIncidentSummary[]>(`/venues/${venueId}/incidents`, { token });
}

export function fetchVenueIncident(token: string, venueId: string, id: string) {
  return backendRequest<BackendIncidentDetail>(`/venues/${venueId}/incidents/${id}`, { token });
}

export function updateVenueIncident(
  token: string,
  venueId: string,
  id: string,
  data: {
    title?: string;
    severity?: string;
    status?: string;
    category?: string | null;
    eventId?: string | null;
    description?: string | null;
  },
) {
  return backendRequest<BackendIncidentDetail>(`/venues/${venueId}/incidents/${id}`, {
    token,
    method: "PATCH",
    body: data,
  });
}

/* ── Dashboard ─────────────────────────────────────────────────── */

export function fetchDashboardMetrics(token: string, venueId: string) {
  return backendRequest<BackendDashboardMetrics>(`/venues/${venueId}/dashboard`, { token });
}

/* ── Event report ──────────────────────────────────────────────── */

export function fetchEventReport(token: string, venueId: string, eventId: string) {
  return backendRequest<BackendEventReport>(
    `/venues/${venueId}/events/${eventId}/report`,
    { token },
  );
}

