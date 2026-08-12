import "server-only";

import { cache } from "react";

export const IDNIGHT_BACKEND_URL =
  process.env.IDNIGHT_BACKEND_URL ?? "https://api.idnight.app";

/* ── Types ─────────────────────────────────────────────────────── */

export type BackendPagedResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

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

export type BackendVenueSummary = {
  id: string;
  name: string;
  slug: string | null;
  address: string | null;
  city: string | null;
  active: boolean;
};

export type BackendVenueEvent = {
  id: string;
  venueId: string;
  name: string;
  status: string;
  startsAt: string;
  endsAt: string | null;
  maxCapacity: number | null;
  minAge: number | null;
  maxAge?: number | null;
  allowedFrom?: string | null;
  allowedUntil?: string | null;
  allowManualDniCheck: boolean;
  requireGuestList: boolean;
  createdAt: string;
  updatedAt: string | null;
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
  active: boolean;
  venueId: string;
  createdAt: string;
};

export type BackendIncidentSummary = {
  id: string;
  venueId: string;
  title: string;
  description: string | null;
  status: "open" | "closed";
  createdAt: string;
  resolvedAt: string | null;
  resolution: string | null;
};

export type BackendIncidentDetail = BackendIncidentSummary;

export type BackendVenueEntryRules = {
  active: boolean;
  minimumAge: number | null;
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

export type BackendReactivateResponse = {
  venueId: string;
  venueName: string;
};

export type BackendGuestListEntry = {
  id: string;
  eventId: string;
  firstName: string;
  lastName: string;
  dni: string;
  category: string | null;
  /*
   * The backend emits this via enum `ToString()`, i.e. PascalCase
   * ("Active" | "Used" | "Cancelled"). Consumers must normalize casing
   * before comparing — see lib/guest-list.ts and sdd/backend-audit-trail
   * ADR-7.
   */
  status: "Active" | "Used" | "Cancelled";
  importedAt: string;
};

export type BackendGuestListImportResult = {
  guestListId: string;
  imported: number;
  duplicates: number;
  invalid: number;
  errors: Array<{ row: number; reason: string }>;
};

export type BackendDashboardMetrics = {
  venueId: string;
  totalEvents: number;
  upcomingEvents: number;
  activeEvents: number;
  totalOperators: number;
  activeDevices: number;
  openIncidents: number;
  totalGuestEntriesAllEvents: number;
  admissionsToday: number;
};

export type BackendEventReport = {
  eventId: string;
  eventName: string;
  status: string;
  startsAt: string;
  totalGuestEntries: number;
  cancelledGuestEntries: number;
  accessSessionCount: number;
  lastSessionOpenedAt: string | null;
};

export type BackendScanRecord = {
  id: string;
  eventId: string;
  accessSessionId: string | null;
  documentLookupKey: string;
  outcome: "Allow" | "Deny" | "Warning" | "ManualReview" | "NotFound";
  score: number | null;
  latencyMs: number;
  correlationId: string;
  validatedAt: string;
  /*
   * Guard decision fields exist on the backend DoorScanRecord entity but are
   * not projected into ScanRecordDto yet. Kept optional so the UI renders
   * them as soon as the backend starts returning them.
   */
  guardDecision?: "Accepted" | "Rejected" | "ManualReview" | null;
  guardDecisionAt?: string | null;
  guardDecisionReason?: string | null;
  isOverride?: boolean;
  /*
   * Method, operator attribution, and the mapped PRD result are optional
   * because records created before this backend slice deployed do not carry
   * them. See sdd/backend-audit-trail ADR-7.
   */
  method?: "IDNIGHT_VERIFIED" | "MANUAL_DNI_CHECK" | "GUEST_LIST_DNI_CHECK" | string | null;
  operatorId?: string | null;
  operatorName?: string | null;
  result?: "ALLOWED" | "ALLOWED_WITH_WARNING" | "REJECTED" | string | null;
};

export type BackendScanStats = {
  allow: number;
  deny: number;
  warning: number;
  manualReview: number;
  notFound: number;
  avgLatencyMs: number;
  p95LatencyMs: number;
  total: number;
};

export type BackendAccessSession = {
  id: string;
  venueId: string;
  eventId: string;
  operatorId: string;
  status: "open" | "closed";
  openedAt: string;
  closedAt: string | null;
};

export type BackendBootstrapResponse = {
  id: string;
  supabaseId: string | null;
  email: string;
  adminContextMode?: BackendBootstrapAdminContextMode | null;
  status: "active" | "PENDING_ACTIVATION";
  createdAt: string;
  organizationId: string | null;
  organizationName: string | null;
  membershipRole: string | null;
  primaryVenue?: BackendBootstrapPrimaryVenue | null;
};

export type BackendBootstrapAdminContextMode = "legacy-fallback" | "enriched";

export type BackendBootstrapPrimaryVenue = {
  id: string;
  name: string;
  slug?: string | null;
  address?: string | null;
  city?: string | null;
  active: boolean;
};

/* ── API error ─────────────────────────────────────────────────── */

export class BackendApiError extends Error {
  status: number;
  code: string | null;

  constructor(message: string, status: number, code: string | null = null) {
    super(message);
    this.name = "BackendApiError";
    this.status = status;
    this.code = code;
  }
}

/* ── Generic request helper ────────────────────────────────────── */

type RequestOptions = {
  token?: string;
  method?: string;
  body?: unknown;
  headers?: HeadersInit;
  isBodyJson?: boolean;
  timeoutMs?: number;
  operation?: string;
};

type PerfLogPayload = {
  operation: string;
  durationMs: number;
  status: string;
};

function logPerf(payload: PerfLogPayload) {
  console.info("[perf]", payload);
}

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

async function readBackendError(response: Response): Promise<{ message: string; code: string | null }> {
  const fallbackMessage = `Backend request failed (${response.status})`;
  let code: string | null = null;

  let rawBody = "";
  try {
    rawBody = await response.text();
  } catch {
    return { message: fallbackMessage, code };
  }

  const normalizedBody = rawBody.trim();
  if (!normalizedBody) {
    return { message: fallbackMessage, code };
  }

  try {
    const payload = JSON.parse(normalizedBody) as
      | { message?: unknown; detail?: unknown; error?: unknown; title?: unknown; code?: unknown }
      | string;

    if (typeof payload === "string" && payload.trim()) {
      return { message: payload.trim(), code };
    }

    if (typeof payload === "object" && payload !== null) {
      if (typeof payload.code === "string" && payload.code.trim()) {
        code = payload.code.trim();
      }
      const message = extractBackendErrorMessage(payload) ?? normalizedBody;
      return { message, code };
    }

    return { message: normalizedBody, code };
  } catch {
    return { message: normalizedBody, code };
  }
}

async function performBackendFetch(path: string, options: RequestOptions = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), options.timeoutMs ?? 5000);

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
  const startedAt = Date.now();

  try {
    const response = await performBackendFetch(path, options);

    if (!response.ok) {
      const { message, code } = await readBackendError(response);
      throw new BackendApiError(message, response.status, code);
    }

    if (options.operation) {
      logPerf({
        operation: options.operation,
        durationMs: Date.now() - startedAt,
        status: String(response.status),
      });
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return (await response.json()) as T;
  } catch (error) {
    if (options.operation) {
      logPerf({
        operation: options.operation,
        durationMs: Date.now() - startedAt,
        status:
          error instanceof BackendApiError
            ? String(error.status)
            : error instanceof Error
              ? error.name
              : "error",
      });
    }

    throw error;
  }
}

type VenueSummarySource = Pick<BackendBootstrapPrimaryVenue, "id" | "name" | "active"> & {
  slug?: string | null;
  address?: string | null;
  city?: string | null;
};

export function resolveBootstrapAdminContextMode(
  bootstrap: Pick<BackendBootstrapResponse, "adminContextMode">,
): BackendBootstrapAdminContextMode {
  return bootstrap.adminContextMode === "enriched" ? "enriched" : "legacy-fallback";
}

export function normalizeVenueSummary(venue: VenueSummarySource | null | undefined): BackendVenueSummary | null {
  if (!venue) {
    return null;
  }

  return {
    id: venue.id,
    name: venue.name,
    slug: venue.slug ?? null,
    address: venue.address ?? null,
    city: venue.city ?? null,
    active: venue.active,
  };
}

export function resolveBootstrapPrimaryVenueSummary(
  bootstrap: BackendBootstrapResponse,
): BackendVenueSummary | null {
  if (resolveBootstrapAdminContextMode(bootstrap) !== "enriched") {
    return null;
  }

  return normalizeVenueSummary(bootstrap.primaryVenue);
}

/* ── Bootstrap / Auth ───────────────────────────────────────────── */

export function bootstrapMe(token: string) {
  return backendRequest<BackendBootstrapResponse>("/api/v1/bootstrap/me", {
    token,
    method: "POST",
    headers: { "X-Client-Type": "admin" },
    timeoutMs: 15000,
    operation: "bootstrapMe",
  });
}

export async function fetchAdminProfile(token: string): Promise<BackendAdminMe> {
  const bootstrap = await bootstrapMe(token);
  const venueSummary = resolveBootstrapPrimaryVenueSummary(bootstrap);

  return {
    id: bootstrap.id,
    email: bootstrap.email,
    firstName: "",
    lastName: "",
    fullName: bootstrap.email,
    role: bootstrap.membershipRole ?? "Owner",
    active: bootstrap.status === "active",
    venueId: venueSummary?.id ?? null,
    venueName: venueSummary?.name ?? null,
    organizationId: bootstrap.organizationId,
    organizationName: bootstrap.organizationName,
    membershipRole: bootstrap.membershipRole,
    membershipActive: bootstrap.status === "active",
  };
}

export async function fetchOwnerOnboardingStatus(token: string): Promise<BackendOwnerOnboardingStatus> {
  const bootstrap = await bootstrapMe(token);
  return {
    needsOnboarding: bootstrap.organizationId === null,
    hasOperatorProfile: true,
    operatorRole: bootstrap.membershipRole ?? "Owner",
    organizationId: bootstrap.organizationId,
    organizationName: bootstrap.organizationName,
    venueId: null,
    venueName: null,
  };
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

export function reactivateOperator(token: string) {
  return backendRequest<BackendReactivateResponse>("/organizations/onboarding/reactivate", {
    token,
    method: "POST",
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
  return backendRequest<BackendVenue>("/admin/venues/mine", { token, operation: "fetchMyVenue" });
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

export function fetchVenueEvents(token: string, page = 1) {
  return backendRequest<BackendPagedResult<BackendVenueEvent>>(
    `/admin/venues/mine/events?page=${page}&pageSize=20`,
    { token, operation: "fetchVenueEvents" },
  );
}

/*
 * The "mine" backend family exposes only a paged list (no GET {id}),
 * so resolving a single event walks the list with a defensive page cap.
 * Wrapped in React cache() so the event detail layout and its pages share
 * a single walk per request instead of repeating it.
 */
const FIND_EVENT_MAX_PAGES = 10;

export const findVenueEventById = cache(
  async (token: string, eventId: string): Promise<BackendVenueEvent | null> => {
    for (let page = 1; page <= FIND_EVENT_MAX_PAGES; page += 1) {
      const result = await fetchVenueEvents(token, page);
      const event = result.items.find((item) => item.id === eventId);
      if (event) {
        return event;
      }
      if (page * result.pageSize >= result.total || result.items.length === 0) {
        return null;
      }
    }
    return null;
  },
);

export function createVenueEvent(
  token: string,
  data: {
    name: string;
    startsAt: string;
    endsAt?: string;
    maxCapacity?: number;
    minAge?: number | null;
    maxAge?: number | null;
    allowedFrom?: string | null;
    allowedUntil?: string | null;
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
    endsAt?: string | null;
    maxCapacity?: number | null;
    minAge?: number | null;
    maxAge?: number | null;
    allowedFrom?: string | null;
    allowedUntil?: string | null;
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

export function publishVenueEvent(token: string, id: string) {
  return backendRequest<BackendVenueEvent>(`/admin/venues/mine/events/${id}/publish`, {
    token,
    method: "POST",
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
    { token, operation: "fetchEventGuestList" },
  );
}

export async function uploadEventGuestList(
  token: string,
  eventId: string,
  formData: FormData,
): Promise<BackendGuestListImportResult> {
  const response = await performBackendFetch(
    `/admin/venues/mine/events/${eventId}/guest-list/import`,
    {
      token,
      method: "POST",
      body: formData,
      isBodyJson: false,
    },
  );

  if (!response.ok) {
    const { message, code } = await readBackendError(response);
    throw new BackendApiError(message, response.status, code);
  }

  return response.json() as Promise<BackendGuestListImportResult>;
}

export function cancelGuestListEntry(token: string, eventId: string, entryId: string) {
  return backendRequest<BackendGuestListEntry>(
    `/admin/venues/mine/events/${eventId}/guest-list/${entryId}`,
    { token, method: "PATCH" },
  );
}

/* ── Security users ────────────────────────────────────────────── */

export function fetchSecurityUsers(token: string, page = 1) {
  return backendRequest<BackendPagedResult<BackendSecurityUser>>(
    `/admin/venues/mine/security-users?page=${page}&pageSize=20`,
    { token },
  );
}

export function createSecurityUser(
  token: string,
  data: { firstName: string; lastName: string; email: string; password: string },
) {
  return backendRequest<BackendSecurityUser>("/admin/venues/mine/security-users", {
    token,
    method: "POST",
    body: { firstName: data.firstName, lastName: data.lastName, email: data.email, password: data.password },
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
    body: { firstName: data.firstName, lastName: data.lastName, email: data.email },
  });
}

export function toggleSecurityUserStatus(token: string, id: string, active: boolean) {
  return backendRequest<BackendSecurityUser>(
    `/admin/venues/mine/security-users/${id}/status`,
    { token, method: "PATCH", body: { active } },
  );
}

/* ── Authorized venue devices ──────────────────────────────────── */

export function fetchVenueDevices(token: string, page = 1) {
  return backendRequest<BackendPagedResult<BackendVenueDevice>>(
    `/admin/venues/mine/devices?page=${page}&pageSize=20`,
    { token },
  );
}

export function createVenueDevice(
  token: string,
  data: { name: string; deviceKey: string },
) {
  return backendRequest<BackendVenueDevice>("/admin/venues/mine/devices", {
    token,
    method: "POST",
    body: { name: data.name, deviceKey: data.deviceKey },
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
    body: { name: data.name, deviceKey: data.deviceKey },
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

export function fetchVenueIncidents(token: string, page = 1) {
  return backendRequest<BackendPagedResult<BackendIncidentSummary>>(
    `/admin/venues/mine/incidents?page=${page}&pageSize=20`,
    { token },
  );
}

export function fetchVenueIncident(token: string, id: string) {
  return backendRequest<BackendIncidentDetail>(`/admin/venues/mine/incidents/${id}`, { token });
}

export function updateVenueIncident(
  token: string,
  id: string,
  data: {
    title?: string;
    description?: string | null;
    status?: "open" | "closed";
    resolution?: string | null;
  },
) {
  return backendRequest<BackendIncidentDetail>(`/admin/venues/mine/incidents/${id}`, {
    token,
    method: "PATCH",
    body: data,
  });
}

/* ── Access Sessions ───────────────────────────────────────────── */

export function fetchAccessSessions(
  token: string,
  params: {
    eventId?: string;
    operatorId?: string;
    status?: string;
    page?: number;
  } = {},
) {
  const query = new URLSearchParams();
  if (params.eventId) query.set("eventId", params.eventId);
  if (params.operatorId) query.set("operatorId", params.operatorId);
  if (params.status) query.set("status", params.status);
  query.set("page", String(params.page ?? 1));
  query.set("pageSize", "20");
  return backendRequest<BackendPagedResult<BackendAccessSession>>(
    `/admin/venues/mine/access-sessions?${query.toString()}`,
    { token, operation: "fetchAccessSessions" },
  );
}

/* ── Door scan records ─────────────────────────────────────────── */

export function fetchEventScanRecords(
  token: string,
  eventId: string,
  params: { outcome?: string; page?: number; pageSize?: number } = {},
) {
  const query = new URLSearchParams();
  if (params.outcome) query.set("outcome", params.outcome);
  query.set("page", String(params.page ?? 1));
  query.set("pageSize", String(params.pageSize ?? 50));
  return backendRequest<BackendPagedResult<BackendScanRecord>>(
    `/admin/venues/mine/events/${eventId}/scan-records?${query.toString()}`,
    { token, operation: "fetchEventScanRecords" },
  );
}

export function fetchEventScanStats(token: string, eventId: string) {
  return backendRequest<BackendScanStats>(
    `/admin/venues/mine/events/${eventId}/scan-stats`,
    { token, operation: "fetchEventScanStats" },
  );
}

/* ── Entry-photo gallery ───────────────────────────────────────── */

export type BackendEntryPhotoCard = {
  entryPhotoId: string | null;
  correlationId: string;
  method: "ID_NIGHT_VERIFIED" | "ManualDniCheck" | "GuestListDniCheck" | string;
  outcome: string;
  occurredAt: string;
  documentLookupKey: string | null;
  hasPhoto: boolean;
};

/**
 * Manual-DNI and guest-list entries render as photoless cards (`hasPhoto: false`,
 * `entryPhotoId: null`) rather than being hidden — the backend never invents a photo for
 * them (spec EP-12).
 */
export function fetchEntryPhotoGallery(token: string, venueId: string, eventId: string) {
  return backendRequest<BackendEntryPhotoCard[]>(
    `/api/v1/admin/venues/${venueId}/events/${eventId}/entry-photos`,
    { token, operation: "fetchEntryPhotoGallery" },
  );
}

/* ── Incident lifecycle (person-linking, IL-01/IL-02) ────────────── */

export type BackendIncidentLifecycle = {
  id: string;
  venueId: string;
  lifecycle: "Open" | "PersonLinked" | "Resolved";
  isBlocking: boolean;
  resolvedAt: string | null;
};

/**
 * Must match `StepUpActions.IncidentLinkPerson` on the backend exactly: the OTP challenge and
 * the `link-person` endpoint both scope the spent proof to this literal action string.
 */
export const INCIDENT_LINK_PERSON_STEP_UP_ACTION = "incident:link-person";

export function linkIncidentPerson(
  token: string,
  venueId: string,
  incidentId: string,
  data: { documentLookupKey: string; blocking: boolean },
) {
  return backendRequest<BackendIncidentLifecycle>(
    `/api/v1/admin/venues/${venueId}/incidents/${incidentId}/link-person`,
    { token, method: "POST", body: data },
  );
}

/** No step-up required (owner decision, task 5.6): lifting a ban needs less proof than casting one. */
export function resolveIncident(token: string, venueId: string, incidentId: string) {
  return backendRequest<BackendIncidentLifecycle>(
    `/api/v1/admin/venues/${venueId}/incidents/${incidentId}/resolve`,
    { token, method: "POST" },
  );
}

/* ── Step-up (email OTP fallback — no passkey support in this admin client) ─ */

export type BackendStepUpOtpSent = { expiresAt: string; maxAttempts: number };

export function sendStepUpOtp(token: string, action: string, resource: string) {
  return backendRequest<BackendStepUpOtpSent>("/api/v1/web/step-up/otp/send", {
    token,
    method: "POST",
    body: { action, resource },
  });
}

export function verifyStepUpOtp(token: string, action: string, resource: string, code: string) {
  return backendRequest<void>("/api/v1/web/step-up/otp/verify", {
    token,
    method: "POST",
    body: { action, resource, code },
  });
}

/* ── Dashboard ─────────────────────────────────────────────────── */

export function fetchDashboardMetrics(token: string) {
  return backendRequest<BackendDashboardMetrics>("/admin/venues/mine/dashboard", {
    token,
    operation: "fetchDashboardMetrics",
  });
}

/* ── Event report ──────────────────────────────────────────────── */

export function fetchEventReport(token: string, eventId: string) {
  return backendRequest<BackendEventReport>(
    `/admin/venues/mine/events/${eventId}/report`,
    { token },
  );
}

/* ── Stalled enrolments ────────────────────────────────────────── */

export type BackendStuckEmbeddingJob = {
  state: string;
  attemptCount: number;
  lastErrorClass: string | null;
  lastErrorCode: string | null;
  approvedAt: string;
  waitingDays: number;
};

/**
 * The enrolments the queue gave up on.
 *
 * These people finished verifying, believe they can walk in, and will be turned away at a door
 * without anybody here knowing why. The queue recorded every one of them from the start; what
 * was missing was anywhere that read the record. Six of them sat unseen for two days.
 */
export async function fetchStuckEmbeddingJobs(token: string): Promise<BackendStuckEmbeddingJob[]> {
  return backendRequest<BackendStuckEmbeddingJob[]>("/admin/embedding-jobs/stuck", { token });
}

export type BackendEnrolmentFunnel = {
  verified: number;
  consented: number;
  enrolled: number;
  awaitingConsent: number;
  stalled: number;
};

/**
 * How far people get between finishing verification and being able to walk in.
 *
 * Counts, never identifiers. The question is a rate — is the consent screen losing people — and
 * a rate does not need names.
 */
export async function fetchEnrolmentFunnel(token: string): Promise<BackendEnrolmentFunnel> {
  return backendRequest<BackendEnrolmentFunnel>("/admin/embedding-jobs/funnel", { token });
}
