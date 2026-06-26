# Backend Contract — Admin ↔ Backend .NET

> **Source of truth** for the API contract between the Admin Frontend (`id-night-admin`) and the Backend .NET (`Backend-ID-Night`).
> Replaces `BACKEND_MVP.md` as the active contract reference.
>
> **Last updated**: 2026-06-22
> **Backend stack**: .NET 10 / ASP.NET Core / EF Core / PostgreSQL (schema: `idnight_core`)
> **SDD change**: `phase-2-admin-contract-api` — full spec at `Backend-ID-Night/openspec/changes/phase-2-admin-contract-api/`

---

## Global rules (apply to every endpoint)

- All requests require `Authorization: Bearer <supabase_jwt>` unless marked `[public]`
- All **error responses** include `{ "message": "string" }` (human-readable). Also include ProblemDetails fields (`type`, `title`, `status`, `code`, `traceId`).
- All **dates** are ISO 8601 with UTC offset: `2026-06-22T03:00:00+00:00`
- All **IDs** are UUID v4 strings
- **PATCH** is always partial — omitted fields are NOT modified
- `"maxCapacity": null` in a PATCH body **clears** capacity; omitting `maxCapacity` **keeps** the current value
- Venue-scoped endpoints return **403** if the caller is not an Operator or Owner of that venue

---

## Base URL

```
https://<backend-host>/api/v1
```

---

## Delivery status

| Slice | PR | Status | Endpoints |
|-------|----|--------|-----------|
| Error contract fix | PR 1 | Pending | (all error responses) |
| Organization onboarding | PR 2 | Pending | POST /bootstrap/me (extended) |
| Venue CRUD | PR 3 | Pending | /venues |
| Operators | PR 4 | Pending | /venues/{id}/operators |
| Events + lifecycle | PR 5 | Pending | /venues/{id}/events |
| Incidents | PR 6 | Pending | /venues/{id}/incidents |
| Devices | PR 7 | Pending | /venues/{id}/devices |
| Guest lists | PR 8 | Pending | /venues/{id}/events/{id}/guest-list |
| Access sessions | PR 9 | Pending | /venues/{id}/events/{id}/access-sessions |
| Dashboard + Reports | PR 10 | Pending | /venues/{id}/dashboard, /events/{id}/report |

**Currently live**: `POST /api/v1/bootstrap/me` (user-app only), `GET /api/v1/info`, `/health*`

---

## Auth / Onboarding

### POST /api/v1/bootstrap/me

Provisions the authenticated user. Pass `X-Client-Type` header to control organization creation.

**Headers**:
- `Authorization: Bearer <jwt>` (required)
- `X-Client-Type: admin | user-app` (optional — defaults to `user-app` behavior)

**Response 200**:
```json
{
  "id": "uuid",
  "supabaseId": "uuid",
  "email": "string",
  "status": "active",
  "createdAt": "DateTimeOffset",
  "organization": {
    "id": "uuid",
    "name": "string",
    "createdAt": "DateTimeOffset"
  }
}
```

> `organization` is `null` when `X-Client-Type` is `user-app` or header is absent.
> Call is idempotent — safe to call on every login.

---

## Venues

### POST /api/v1/venues
```json
// Request
{ "name": "string (required)", "address": "string (required)" }

// Response 201
{
  "id": "uuid",
  "organizationId": "uuid",
  "name": "string",
  "address": "string",
  "createdAt": "DateTimeOffset",
  "updatedAt": "DateTimeOffset | null"
}
```

### GET /api/v1/venues
Response 200: array of venue objects (scoped to caller's organization).

### GET /api/v1/venues/{venueId}
Response 200: single venue object. 404 if not in caller's org.

### PATCH /api/v1/venues/{venueId}
```json
// Request (all fields optional)
{ "name": "string", "address": "string" }

// Response 200: updated venue object
```

### DELETE /api/v1/venues/{venueId}
Response 204 No Content.

---

## Events

### POST /api/v1/venues/{venueId}/events
```json
// Request
{
  "name": "string (required)",
  "description": "string | null",
  "date": "DateTimeOffset (required)",
  "endDate": "DateTimeOffset | null",
  "maxCapacity": "int | null"
}

// Response 201 — status defaults to "Draft"
{
  "id": "uuid",
  "venueId": "uuid",
  "name": "string",
  "description": "string | null",
  "date": "DateTimeOffset",
  "endDate": "DateTimeOffset | null",
  "maxCapacity": "int | null",
  "status": "Draft",
  "createdAt": "DateTimeOffset",
  "updatedAt": "DateTimeOffset | null"
}
```

### GET /api/v1/venues/{venueId}/events
Query params: `?status=Draft|Published|Active|Closed|Cancelled`
Response 200: array.

### GET /api/v1/venues/{venueId}/events/{eventId}
Response 200: single event object. 404 if not found.

### PATCH /api/v1/venues/{venueId}/events/{eventId}
```json
// Request (all fields optional — omitted = unchanged)
{
  "name": "string",
  "description": "string | null",
  "date": "DateTimeOffset",
  "endDate": "DateTimeOffset | null",
  "maxCapacity": "int | null",
  "status": "Draft | Published | Active | Closed | Cancelled"
}
```

> **`"maxCapacity": null`** → clears capacity (sets to NULL in DB)
> **Omit `maxCapacity`** → keeps current value

**Event state machine** (MUST follow — invalid transition = 422):
```
Draft      → Published, Cancelled
Published  → Active, Cancelled
Active     → Closed, Cancelled
Closed     → (terminal)
Cancelled  → (terminal)
```

Error on invalid transition:
```json
{ "message": "Invalid status transition from Active to Draft", "code": "INVALID_TRANSITION", "status": 422 }
```

### DELETE /api/v1/venues/{venueId}/events/{eventId}
Only allowed if status is `Draft` or `Cancelled`. Returns 422 otherwise.
Response 204 No Content.

---

## Operators (security users)

### POST /api/v1/venues/{venueId}/operators
```json
// Request
{ "email": "string (required)", "name": "string (required)", "role": "ADMIN | SUPERVISOR | GUARD" }

// Response 201
{
  "id": "uuid",
  "venueId": "uuid",
  "appUserId": "uuid",
  "name": "string",
  "email": "string",
  "role": "ADMIN | SUPERVISOR | GUARD",
  "createdAt": "DateTimeOffset"
}
```

> If `email` has no existing account, a placeholder user is created with `status: "pending"`.

409 if same email already assigned to this venue.

### GET /api/v1/venues/{venueId}/operators
Response 200: array.

### PATCH /api/v1/venues/{venueId}/operators/{operatorId}
```json
{ "role": "ADMIN | SUPERVISOR | GUARD", "name": "string" }
// Response 200: updated operator
```

### DELETE /api/v1/venues/{venueId}/operators/{operatorId}
Response 204.

---

## Incidents

### POST /api/v1/venues/{venueId}/incidents
```json
// Request
{
  "title": "string (required)",
  "description": "string | null",
  "severity": "LOW | MEDIUM | HIGH | CRITICAL",
  "reportedAt": "DateTimeOffset"
}
// Response 201
{
  "id": "uuid",
  "venueId": "uuid",
  "title": "string",
  "description": "string | null",
  "severity": "LOW | MEDIUM | HIGH | CRITICAL",
  "reportedAt": "DateTimeOffset",
  "resolvedAt": "DateTimeOffset | null",
  "createdAt": "DateTimeOffset",
  "updatedAt": "DateTimeOffset | null"
}
```

### GET /api/v1/venues/{venueId}/incidents
Query params: `?severity=LOW|MEDIUM|HIGH|CRITICAL`
Response 200: array.

### PATCH /api/v1/venues/{venueId}/incidents/{incidentId}
```json
{ "title": "string", "description": "string | null", "severity": "...", "resolvedAt": "DateTimeOffset | null" }
// Response 200: updated incident
```

### DELETE /api/v1/venues/{venueId}/incidents/{incidentId}
Response 204.

---

## Devices

### POST /api/v1/venues/{venueId}/devices
```json
// Request
{ "name": "string (required)", "serialNumber": "string (required)" }
// Response 201
{
  "id": "uuid",
  "venueId": "uuid",
  "name": "string",
  "serialNumber": "string",
  "status": "Active",
  "registeredAt": "DateTimeOffset",
  "deactivatedAt": "DateTimeOffset | null",
  "createdAt": "DateTimeOffset"
}
```

409 if `serialNumber` already registered for this venue.

### GET /api/v1/venues/{venueId}/devices
Response 200: array.

### PATCH /api/v1/venues/{venueId}/devices/{deviceId}/deactivate
No body. Response 200: updated device with `status: "Inactive"` and `deactivatedAt` set.

---

## Guest lists

### POST /api/v1/venues/{venueId}/events/{eventId}/guest-list/upload

**Content-Type**: `multipart/form-data`
**Field**: `file` (CSV file)

CSV columns: `fullName` (required), `docNumber` (optional), `email` (optional)

Response 201 (all valid):
```json
{
  "guestListId": "uuid",
  "totalEntries": 150,
  "validEntries": 150,
  "errors": []
}
```

Response 207 (partial — some rows invalid):
```json
{
  "guestListId": "uuid",
  "totalEntries": 150,
  "validEntries": 148,
  "errors": [
    { "row": 5, "field": "fullName", "message": "required" }
  ]
}
```

422 if file is not a valid CSV.

### GET /api/v1/venues/{venueId}/events/{eventId}/guest-list
Response 200:
```json
[
  {
    "id": "uuid",
    "fullName": "string",
    "docNumber": "string | null",
    "email": "string | null",
    "status": "Pending | Confirmed | Rejected"
  }
]
```

### DELETE /api/v1/venues/{venueId}/events/{eventId}/guest-list/entries/{entryId}
Response 204.

---

## Access sessions

### POST /api/v1/venues/{venueId}/events/{eventId}/access-sessions/open
No body. Response 201:
```json
{
  "id": "uuid",
  "eventId": "uuid",
  "openedAt": "DateTimeOffset",
  "closedAt": null,
  "openedByUserId": "uuid"
}
```

409 if a session is already open for this event.

### POST /api/v1/venues/{venueId}/events/{eventId}/access-sessions/close
No body. Response 200: session object with `closedAt` set.
404 if no active session.

### GET /api/v1/venues/{venueId}/events/{eventId}/access-sessions
Response 200: array of sessions.

---

## Dashboard

### GET /api/v1/venues/{venueId}/dashboard
Response 200:
```json
{
  "venueId": "uuid",
  "venueName": "string",
  "stats": {
    "totalEvents": 0,
    "activeEvents": 0,
    "totalOperators": 0,
    "incidentsToday": 0,
    "activeDevices": 0,
    "activeAccessSessions": 0
  },
  "generatedAt": "DateTimeOffset"
}
```

> `incidentsToday` = incidents where `reportedAt` falls within today's UTC calendar day.

403 if caller is not an Operator or Owner of this venue.

---

## Event reports

### GET /api/v1/venues/{venueId}/events/{eventId}/report
Response 200:
```json
{
  "eventId": "uuid",
  "eventName": "string",
  "status": "string",
  "date": "DateTimeOffset",
  "maxCapacity": "int | null",
  "guestListEntries": 0,
  "accessSessionCount": 0,
  "incidents": 0,
  "incidentsBySeverity": {
    "LOW": 0,
    "MEDIUM": 0,
    "HIGH": 0,
    "CRITICAL": 0
  },
  "generatedAt": "DateTimeOffset"
}
```

---

## Error response shape

All errors follow this shape (ProblemDetails + `message` extension):

```json
{
  "type": "https://httpstatuses.com/422",
  "title": "Validation failed",
  "status": 422,
  "message": "Validation failed",
  "code": "VALIDATION_ERROR",
  "traceId": "00-abc123...",
  "errors": {
    "name": ["required"]
  }
}
```

| HTTP | `code` | When |
|------|--------|------|
| 400 | `BAD_REQUEST` | Malformed request |
| 401 | `UNAUTHORIZED` | Missing or invalid JWT |
| 403 | `FORBIDDEN` | Caller not operator/owner of venue |
| 404 | `NOT_FOUND` | Resource not found |
| 409 | `CONFLICT` | Duplicate (serial number, operator email) |
| 422 | `VALIDATION_ERROR` | Validation failed |
| 422 | `INVALID_TRANSITION` | Invalid event status transition |
| 422 | `INVALID_OPERATION` | e.g. delete active event |
| 500 | `INTERNAL_ERROR` | Unexpected server error |

---

## Currently implemented (live)

| Endpoint | Status |
|----------|--------|
| POST /api/v1/bootstrap/me (user-app only, no org) | ✅ Live |
| GET /api/v1/info | ✅ Live |
| GET /health, /health/live, /health/ready | ✅ Live |
| Error `message` field in responses | ❌ PR 1 pending |
| All other endpoints above | ❌ PR 2–10 pending |

---

## Full spec

See `Backend-ID-Night/openspec/changes/phase-2-admin-contract-api/` for:
- `proposal.md` — intent and decisions
- `specs/admin-contract-api/spec.md` — formal requirements with Given/When/Then
- `design.md` — implementation architecture
- `tasks.md` — PR-by-PR task checklist
