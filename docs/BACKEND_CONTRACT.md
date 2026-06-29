# Canonical Backend Contract — Admin ↔ Backend .NET

> Last updated: 2026-06-28
> Status: **canonical mirror** for the current Admin frontend ↔ .NET backend contract.

This document mirrors the current contract between the Admin frontend (`id-night-admin`) and the .NET backend (`Backend-ID-Night`). For the pagination work, the backend remains the canonical producer and the frontend MUST consume the response as documented here without runtime normalizers or fallback reshaping.

## Decisiones vigentes

| Tema | Decisión actual |
|---|---|
| Bootstrap admin | `POST /api/v1/bootstrap/me` debe soportar `adminContextMode: "legacy-fallback" | "enriched"`. |
| Venue inicial | En `enriched`, el backend debe devolver `primaryVenue` explícito cuando el admin está listo. |
| Routing de onboarding | Sin organización → `/owner-onboarding`. Con organización pero sin `primaryVenue`/contexto de venue → flujo de creación de venue existente en `/venue`, **no** owner onboarding. |
| List endpoints | `events`, `security-users`, `devices`, `incidents`, and `access-sessions` MUST return paginated envelopes; **never** raw arrays. |
| Forma paginada | `{ "items": [], "total": 0, "page": 1, "pageSize": 20 }` |
| Pagination rules | `page` is 1-based, missing `pageSize` defaults to `20`, `page < 1 => 1`, `pageSize < 1 => 1`, `pageSize > 100 => 100`, and ordering is stable before pagination. |
| Performance | El frontend ya removió `router.refresh()` redundante en navegación auth y deshabilitó `prefetch` del sidebar. La mejora pendiente depende del backend: bootstrap enriquecido y paginación real. |

---

## Global Rules

- **Authentication:** All requests require `Authorization: Bearer <supabase_jwt>`.
- **Error Shape:** All non-2xx JSON responses MUST follow the RFC 7807 `ProblemDetails` standard and include a top-level `message` field (human-readable string).
  ```json
  {
    "type": "https://httpstatuses.com/422",
    "title": "Validation failed",
    "status": 422,
    "message": "La edad mínima debe estar entre 0 y 120.",
    "code": "VALIDATION_ERROR",
    "traceId": "00-abc123xyz...",
    "errors": {
      "minimumAge": ["La edad mínima debe estar entre 0 y 120."]
    }
  }
  ```
- **Dates:** ISO 8601 with UTC offset (e.g. `2026-06-26T23:50:00+00:00`).
- **IDs:** UUID v4 strings.
- **PATCH / PUT Semantics:** PATCH/PUT requests are partial updates where omitted fields remain unchanged. Sending `maxCapacity: null` explicitly clears the capacity constraint.
- **Pagination Contract:** These endpoints MUST return the exact envelope `{ items, total, page, pageSize }`: `GET /api/v1/admin/venues/mine/events`, `GET /api/v1/admin/venues/mine/security-users`, `GET /api/v1/admin/venues/mine/devices`, `GET /api/v1/admin/venues/mine/incidents`, and `GET /api/v1/admin/venues/mine/access-sessions`. The backend MUST NOT return a raw array for them.
- **Stable Ordering:** Every paginated list MUST apply deterministic ordering before `Skip/Take` or equivalent pagination logic.
- **Frontend Consumption Rule:** The frontend MUST NOT add runtime normalizers or fallback adapters for these paginated responses. Contract drift must be fixed in the backend or documented here.

---

## Base URL

```
https://<backend-host>/api/v1
```

---

## Canonical Admin Pagination Contract

Use this section as the fast path for the five Admin venue list endpoints.

### Covered Endpoints

| Endpoint | Optional filters | Stable sort | Notes |
|---|---|---|---|
| `GET /api/v1/admin/venues/mine/events` | `page`, `pageSize`, `status` | `startsAt DESC`, then `id ASC` | `total` is the filtered total before slicing. |
| `GET /api/v1/admin/venues/mine/security-users` | `page`, `pageSize` | `createdAt DESC`, then `id ASC` | No frontend re-sorting. |
| `GET /api/v1/admin/venues/mine/devices` | `page`, `pageSize` | `createdAt DESC`, then `id ASC` | No frontend re-sorting. |
| `GET /api/v1/admin/venues/mine/incidents` | `status`, `page`, `pageSize` | `createdAt DESC`, then `id ASC` | `status` filter changes both `items` and `total`. |
| `GET /api/v1/admin/venues/mine/access-sessions` | `eventId`, `operatorId`, `status`, `page`, `pageSize` | `openedAt DESC`, then `id ASC` | `status` values in the response MUST be lowercase `open` / `closed`. |

### Shared Response Envelope

All five endpoints MUST return exactly:

```json
{
  "items": [],
  "total": 0,
  "page": 1,
  "pageSize": 20
}
```

Rules:

- `items` is always an array, including empty results.
- `total` is the filtered total **before** pagination.
- `page` is base 1.
- Missing `pageSize` defaults to `20`.
- `page < 1` normalizes to `1`.
- `pageSize < 1` normalizes to `1`.
- `pageSize > 100` normalizes to `100`.
- Non-integer pagination query values fail with the backend validation error contract (`400`).
- The frontend MUST consume `access-sessions.status` exactly as returned (`open` / `closed`) and MUST NOT lowercase it client-side.

---

## Endpoint Details

### 1. Session & Auth

#### POST /bootstrap/me
Retrieves the authenticated admin bootstrap payload used for first-render session resolution.
- **Header requerido:** `X-Client-Type: admin`
- **Response 200:**
  ```json
  {
    "id": "uuid",
    "supabaseId": "uuid | null",
    "email": "string",
    "adminContextMode": "legacy-fallback | enriched",
    "organizationId": "uuid | null",
    "organizationName": "string | null",
    "membershipRole": "Owner | Admin | string | null",
    "status": "active | inactive | string",
    "primaryVenue": {
      "id": "uuid",
      "name": "string",
      "slug": "string | null",
      "address": "string | null",
      "city": "string | null",
      "active": true
    }
  }
  ```

Bootstrap semantics:
- `organizationId: null` means the authenticated user still needs owner onboarding and MUST recover through `GET/POST /organizations/onboarding`.
- `organizationId != null` with `adminContextMode: "enriched"` and `primaryVenue: null` means the user already has an organization but still needs venue setup and MUST recover through the existing venue-creation flow (`POST /admin/venues` surfaced in the frontend at `/venue`). This case MUST NOT be treated as owner onboarding.
- `adminContextMode: "enriched"` with `primaryVenue` present means the frontend MUST use `primaryVenue` as the first-render venue identity and MUST NOT call `GET /admin/venues/mine` only to infer the initial venue.
- `adminContextMode: "legacy-fallback"` keeps the temporary compatibility path where the frontend MAY still call `GET /admin/venues/mine` to synthesize first-render venue context until enriched bootstrap is fully rolled out.

**Ejemplos de decisión de routing**

| Estado backend | Resultado esperado en frontend |
|---|---|
| `organizationId = null` | Ir a owner onboarding |
| `organizationId != null` + `adminContextMode = "enriched"` + `primaryVenue = null` | Ir a `/venue` para crear el venue faltante |
| `organizationId != null` + `adminContextMode = "enriched"` + `primaryVenue` presente | Sesión `ready` sin lookup adicional |
| `adminContextMode = "legacy-fallback"` | Se permite lookup temporal a `GET /admin/venues/mine` |

#### GET /admin/me
Retrieves the current authenticated administrator's profile.
- **Response 200:**
  ```json
  {
    "id": "uuid",
    "email": "string",
    "firstName": "string",
    "lastName": "string",
    "fullName": "string",
    "role": "string",
    "active": true,
    "venueId": "uuid | null",
    "venueName": "string | null",
    "organizationId": "uuid | null",
    "organizationName": "string | null",
    "membershipRole": "string | null",
    "membershipActive": true
  }
  ```

#### PUT /admin/me
Updates the administrator's profile.
- **Request:**
  ```json
  {
    "firstName": "string",
    "lastName": "string"
  }
  ```
- **Response 200:** Same profile payload as `GET /admin/me`.

---

### 2. Owner Onboarding

#### GET /organizations/onboarding
Checks the current owner onboarding state.
- **Response 200:**
  ```json
  {
    "needsOnboarding": true,
    "hasOperatorProfile": true,
    "operatorRole": "Owner",
    "organizationId": "uuid | null",
    "organizationName": "string | null",
    "venueId": "uuid | null",
    "venueName": "string | null"
  }
  ```

#### POST /organizations/onboarding
Creates organization, venue, and links them to the owner. This call is idempotent.
- **Request:**
  ```json
  {
    "organizationName": "string",
    "venueName": "string",
    "city": "string | null",
    "address": "string | null"
  }
  ```
- **Response 201:** Same onboarding profile payload as `GET /organizations/onboarding`.

---

### 3. Venue & Entry Rules

#### POST /admin/venues
Creates a new venue.
- **Request:**
  ```json
  {
    "name": "string",
    "address": "string | null",
    "city": "string | null"
  }
  ```
- **Response 201:**
  ```json
  {
    "id": "uuid",
    "name": "string",
    "address": "string | null",
    "city": "string | null",
    "active": true
  }
  ```

#### GET /admin/venues/mine
Retrieves the administrator's current active venue details.
- **Response 200:** Same venue response shape as `POST /admin/venues`.

#### PUT /admin/venues/mine
Updates the active venue details.
- **Request:** Same as `POST /admin/venues` (all fields optional).
- **Response 200:** Same venue response shape.

#### GET /admin/venues/mine/entry-rules
Retrieves admission rules config.
- **Response 200:**
  ```json
  {
    "active": true,
    "minimumAge": 18,
    "requireVerifiedAdult": true,
    "requireIdentityVerification": true,
    "requireValidTicket": false,
    "allowManualReview": true,
    "notes": "string | null"
  }
  ```

#### PUT /admin/venues/mine/entry-rules
Updates admission rules.
- **Request:** Same payload as `GET /admin/venues/mine/entry-rules`.
- **Response 200:** Updated rules payload.

---

### 4. Events Lifecycle

#### GET /admin/venues/mine/events
Retrieves events for the current active venue.
- **Query Parameters:** `page` (optional, default `1`), `pageSize` (optional, default `20`, recommended max `100`)
- **Response 200:**
  ```json
  {
    "items": [
      {
        "id": "uuid",
        "venueId": "uuid",
        "name": "string",
        "status": "Draft | Published | Active | Finished | Cancelled",
        "startsAt": "DateTimeOffset",
        "endsAt": "DateTimeOffset | null",
        "maxCapacity": 500,
        "minAge": 18,
        "allowManualDniCheck": true,
        "requireGuestList": false,
        "createdAt": "DateTimeOffset",
        "updatedAt": "DateTimeOffset | null"
      }
    ],
    "total": 0,
    "page": 1,
    "pageSize": 20
  }
  ```

#### POST /admin/venues/mine/events
Creates an event in `UPCOMING` status.
- **Request:**
  ```json
  {
    "name": "string",
    "startsAt": "DateTimeOffset",
    "endsAt": "DateTimeOffset",
    "maxCapacity": 500,
    "minAge": 18,
    "allowManualDniCheck": true,
    "requireGuestList": false
  }
  ```
- **Response 201:** Created event object payload.

#### PATCH /admin/venues/mine/events/{id}
Partially updates event details.
- **Request:** All fields optional.

#### POST /admin/venues/mine/events/{id}/activate
Moves event to `ACTIVE` status.
- **Response 200:** Updated event object payload.

#### POST /admin/venues/mine/events/{id}/finish
Moves event to `FINISHED` status.
- **Response 200:** Updated event object payload.

#### POST /admin/venues/mine/events/{id}/cancel
Moves event to `CANCELLED` status.
- **Response 200:** Updated event object payload.

---

### 5. Staff & Operators

#### GET /admin/venues/mine/security-users
Lists staff operators.
- **Query Parameters:** `page` (optional, default `1`), `pageSize` (optional, default `20`, recommended max `100`)
- **Response 200:**
  ```json
  {
    "items": [
      {
        "id": "uuid",
        "firstName": "string",
        "lastName": "string",
        "fullName": "string",
        "email": "string",
        "role": "ADMIN | SUPERVISOR | GUARD",
        "active": true,
        "venueId": "uuid",
        "createdAt": "DateTimeOffset"
      }
    ],
    "total": 0,
    "page": 1,
    "pageSize": 20
  }
  ```

#### POST /admin/venues/mine/security-users
Invites a new staff member (starts as `PENDING_ACTIVATION` placeholder).
- **Request:**
  ```json
  {
    "firstName": "string",
    "lastName": "string",
    "email": "string"
  }
  ```
- **Response 201:** Created security-user payload.

#### PUT /admin/venues/mine/security-users/{id}
Updates operator information.
- **Request:** `{ "firstName": "string", "lastName": "string", "email": "string" }`
- **Response 200:** Updated security-user payload.

#### PATCH /admin/venues/mine/security-users/{id}/status
Activates/Deactivates an operator.
- **Request:** `{ "active": false }`
- **Response 200:** Updated security-user payload.

---

### 6. Devices

#### GET /admin/venues/mine/devices
Lists authorized scanning devices.
- **Query Parameters:** `page` (optional, default `1`), `pageSize` (optional, default `20`, recommended max `100`)
- **Response 200:**
  ```json
  {
    "items": [
      {
        "id": "uuid",
        "name": "string",
        "deviceKey": "string",
        "active": true,
        "venueId": "uuid",
        "createdAt": "DateTimeOffset"
      }
    ],
    "total": 0,
    "page": 1,
    "pageSize": 20
  }
  ```

#### POST /admin/venues/mine/devices
Registers a scanning device.
- **Request:** `{ "name": "string", "deviceKey": "string" }`
- **Response 201:** Created device payload.

#### PUT /admin/venues/mine/devices/{id}
Updates device registration info.
- **Request:** `{ "name": "string", "deviceKey": "string" }`
- **Response 200:** Updated device payload.

#### PATCH /admin/venues/mine/devices/{id}/status
Enables/Disables scanning access.
- **Request:** `{ "active": false }`
- **Response 200:** Updated device payload.

---

### 7. Incidents

#### GET /admin/venues/mine/incidents
Lists all incidents reported at the venue.
- **Query Parameters:** `status` (optional), `page` (optional, default `1`), `pageSize` (optional, default `20`, recommended max `100`)
- **Response 200:**
  ```json
  {
    "items": [
      {
        "id": "uuid",
        "venueId": "uuid",
        "title": "string",
        "description": "string | null",
        "status": "open | closed",
        "createdAt": "DateTimeOffset",
        "resolvedAt": "DateTimeOffset | null",
        "resolution": "string | null"
      }
    ],
    "total": 0,
    "page": 1,
    "pageSize": 20
  }
  ```

#### GET /admin/venues/mine/incidents/{id}
Retrieves detailed information for a single incident.
- **Response 200:** Same payload shape as the list item.

#### PATCH /admin/venues/mine/incidents/{id}
Partially updates incident state.
- **Request:** `{ "title": "...", "description": "...", "status": "open | closed", "resolution": "..." }`
- **Response 200:** Updated incident detail payload.

---

### 8. Access Sessions

#### GET /admin/venues/mine/access-sessions
Retrieves entry checks and access sessions history.
- **Query Parameters:** `eventId` (optional), `operatorId` (optional), `status` (optional), `page` (optional, default `1`), `pageSize` (optional, default `20`, recommended max `100`).
- **Response 200:**
  ```json
  {
    "items": [
      {
        "id": "uuid",
        "venueId": "uuid",
        "eventId": "uuid",
        "operatorId": "uuid",
        "status": "open | closed",
        "openedAt": "DateTimeOffset",
        "closedAt": "DateTimeOffset | null"
      }
    ],
    "total": 0,
    "page": 1,
    "pageSize": 20
  }
  ```

---

### 9. Guest Lists

#### GET /admin/venues/mine/events/{eventId}/guest-list
Retrieves event guest list.
- **Response 200:**
  ```json
  [
    {
      "id": "uuid",
      "status": "ACTIVE | USED | CANCELLED",
      "firstName": "string",
      "lastName": "string",
      "dniSuffix": "string",
      "category": "string | null",
      "importedAt": "DateTimeOffset"
    }
  ]
  ```

#### POST /admin/venues/mine/events/{eventId}/guest-list
Uploads guest list via a CSV or XLSX file (`multipart/form-data`).
- **File columns:** `dni`, `nombre`, `apellido`, and optional `categoria` (case-insensitive headers).
- **Response 201:**
  ```json
  {
    "imported": 150,
    "duplicates": 2,
    "invalid": 1,
    "errors": [
      { "row": 5, "field": "dni", "reason": "required" }
    ]
  }
  ```

#### PATCH /admin/venues/mine/events/{eventId}/guest-list/{entryId}
Updates a guest list entry status (e.g. to cancel it).
- **Request:** `{ "status": "CANCELLED" }`
- **Response 200:** Updated guest list entry object.

---

### 10. Dashboard & Event Report

#### GET /admin/venues/mine/dashboard
Provides general venue statistics.
- **Response 200:**
  ```json
  {
    "eventsToday": 0,
    "activeEventsNow": 0,
    "admissionsToday": 0,
    "rejectionsToday": 0,
    "warningsToday": 0,
    "openIncidents": 0
  }
  ```

#### GET /admin/venues/mine/events/{eventId}/report
Generates stats report for a specific event.
- **Response 200:**
  ```json
  {
    "eventId": "uuid",
    "eventName": "string",
    "startsAt": "DateTimeOffset",
    "endsAt": "DateTimeOffset",
    "status": "string",
    "totalEntries": 0,
    "allowedCount": 0,
    "allowedWithWarningCount": 0,
    "rejectedCount": 0,
    "guestListTotal": 0,
    "guestListUsed": 0,
    "guestListCancelled": 0,
    "incidentCount": 0
  }
  ```
