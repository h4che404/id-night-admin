# Admin Panel — Backend API Contract

> Last updated: 2026-06-27  
> Backend: .NET 10, Clean Architecture  
> Source of truth: `Backend-ID-Night/src/`

---

## Critical: Base URL Change

The admin panel must change its base URL:

```diff
- const IDNIGHT_BACKEND_URL = "https://api.idnight.app/api/v1"
+ const IDNIGHT_BACKEND_URL = "https://api.idnight.app"
```

All new admin routes are at root level (no `/api/v1`). The only exception is `POST /api/v1/bootstrap/me`.

---

## Authentication

All endpoints require `Authorization: Bearer <supabase-jwt>`.  
The JWT `sub` claim is the Supabase user ID. The backend resolves the internal `AppUser` from it.

---

## Error Format

All errors return RFC 7807 ProblemDetails with a `message` field:

```json
{
  "type": "...",
  "title": "...",
  "status": 404,
  "message": "Human-readable error description"
}
```

---

## 1. Bootstrap

**POST** `/api/v1/bootstrap/me`  
Header: `X-Client-Type: admin`

Creates or updates the user profile. Idempotent. The `admin` client type triggers org + owner membership creation on first call.

**Response:**
```typescript
{
  id: string              // AppUser UUID
  supabaseId: string | null
  email: string
  status: "active" | "PENDING_ACTIVATION"
  createdAt: string       // ISO 8601
  organizationId: string | null   // FLAT — not nested
  organizationName: string | null // FLAT — not nested
  membershipRole: string | null   // e.g. "Owner"
}
```

> **Migration note:** The old frontend type expected `organization: { id, name, createdAt }`. The backend returns flat fields. Update `fetchAdminProfile` and `fetchOwnerOnboardingStatus` to read `bootstrap.organizationId` instead of `bootstrap.organization?.id`.

---

## 2. Onboarding

**GET** `/organizations/onboarding`

Returns the onboarding status for the authenticated user.

**Response:**
```typescript
{
  needsOnboarding: boolean
  hasOperatorProfile: boolean
  operatorRole: string | null
  organizationId: string | null
  organizationName: string | null
  venueId: string | null
  venueName: string | null
}
```

---

**POST** `/organizations/onboarding`

Completes onboarding: creates organization, venue, and operator record. Idempotent — returns existing data if already onboarded.

**Body:**
```typescript
{
  organizationName: string  // required
  venueName: string         // required
  city?: string
  address?: string
}
```

**Response:**
```typescript
{
  organizationId: string
  organizationName: string
  venueId: string
  venueName: string
  operatorId: string
  operatorRole: string  // "Owner"
}
```

**Errors:** `409` if already onboarded with different data (check `needsOnboarding` first).

---

## 3. Admin Profile

**GET** `/admin/me`

Returns the full profile of the authenticated admin operator.

**Response:**
```typescript
{
  id: string
  email: string
  firstName: string
  lastName: string
  fullName: string
  role: string | null
  active: boolean | null
  venueId: string | null
  venueName: string | null
  organizationId: string | null
  organizationName: string | null
  membershipRole: string | null
  membershipActive: boolean | null
}
```

---

**PUT** `/admin/me`

Updates first and last name.

**Body:**
```typescript
{
  firstName: string  // required
  lastName: string   // required
}
```

**Response:** same as `GET /admin/me`

**Errors:** `403` if user status is `PENDING_ACTIVATION`.

---

## 4. Venues

**GET** `/admin/venues/mine`

Returns the venue owned by the authenticated operator.

**Response:**
```typescript
{
  id: string
  name: string
  address: string | null
  city: string | null
  active: boolean
}
```

**Errors:** `404` if no venue configured yet.

---

**POST** `/admin/venues`

Creates a new venue for the authenticated operator's organization. Use after onboarding if a second venue is needed.

**Body:**
```typescript
{
  name: string   // required
  address?: string
  city?: string
}
```

**Response:** same as `GET /admin/venues/mine`

---

**PUT** `/admin/venues/mine`

Updates the authenticated operator's venue.

**Body:** same as POST

**Response:** same as `GET /admin/venues/mine`

---

## 5. Entry Rules

**GET** `/admin/venues/mine/entry-rules`

**Response:**
```typescript
{
  active: boolean
  minimumAge: number | null
  requireVerifiedAdult: boolean
  requireIdentityVerification: boolean
  requireValidTicket: boolean
  allowManualReview: boolean
  notes: string | null
}
```

---

**PUT** `/admin/venues/mine/entry-rules`

**Body:** same shape as response (all fields required)

**Response:** same shape

---

## 6. Events

**GET** `/admin/venues/mine/events`

**Response:** `EventResponse[]`

```typescript
{
  id: string
  venueId: string
  name: string
  status: "Draft" | "Published" | "Active" | "Finished" | "Cancelled"
  startsAt: string       // ISO 8601 with offset
  endsAt: string | null
  maxCapacity: number | null
  minAge: number | null
  allowManualDniCheck: boolean
  requireGuestList: boolean
  createdAt: string
  updatedAt: string | null
}
```

---

**POST** `/admin/venues/mine/events`

**Body:**
```typescript
{
  name: string           // required
  startsAt: string       // ISO 8601, required
  endsAt?: string
  maxCapacity?: number
  minAge?: number
  allowManualDniCheck?: boolean  // default false
  requireGuestList?: boolean     // default false
}
```

**Response:** `EventResponse`

---

**PATCH** `/admin/venues/mine/events/{id}`

Partial update — all fields optional.

**Body:**
```typescript
{
  name?: string
  startsAt?: string
  endsAt?: string | null
  maxCapacity?: number | null
  minAge?: number
  allowManualDniCheck?: boolean
  requireGuestList?: boolean
}
```

**Response:** `EventResponse`

---

### Event lifecycle transitions

All return `EventResponse`. Invalid transitions return `409`.

| Action | Endpoint | Valid from |
|--------|----------|------------|
| Publish | `POST /admin/venues/mine/events/{id}/publish` | Draft |
| Activate | `POST /admin/venues/mine/events/{id}/activate` | Published |
| Finish | `POST /admin/venues/mine/events/{id}/finish` | Active |
| Cancel | `POST /admin/venues/mine/events/{id}/cancel` | Draft, Published, Active |

---

## 7. Guest List

**GET** `/admin/venues/mine/events/{eventId}/guest-list`

**Response:**
```typescript
{
  id: string
  eventId: string
  firstName: string
  lastName: string
  dni: string        // full DNI — use last 4 chars for dniSuffix display
  category: string | null
  status: "active" | "used" | "cancelled"   // lowercase
  importedAt: string
}[]
```

> **Migration note:** Backend returns `dni` (full), not `dniSuffix`. Status values are lowercase (`"active"` not `"ACTIVE"`).

---

**POST** `/admin/venues/mine/events/{eventId}/guest-list/import`

> **Migration note:** Path was `/guest-list/upload` — it is now `/guest-list/import`.

Multipart form upload. Field name: `file`. Accepts `.xlsx` / `.xls` / `.csv`.

**Response:**
```typescript
{
  guestListId: string
  imported: number
  duplicates: number
  invalid: number
  errors: { row: number; reason: string }[]
}
```

---

**PATCH** `/admin/venues/mine/events/{eventId}/guest-list/{entryId}`

> **Migration note:** Old contract used `DELETE .../entries/{entryId}`. Now use `PATCH` to toggle status.

**Body:** *(currently no body required — toggles to cancelled)*

**Response:** `GuestEntryDto` (same shape as list item)

**Errors:** `404` if entry not found.

---

## 8. Security Users

> **Migration note:** Path changed from `/operators` to `/security-users`. Body for create/update changed from `{ name }` to `{ firstName, lastName }`.

**GET** `/admin/venues/mine/security-users`

**Response:**
```typescript
{
  id: string
  firstName: string
  lastName: string
  fullName: string
  email: string
  role: string    // "Guard" | "Supervisor"
  active: boolean
  venueId: string
  createdAt: string
}[]
```

---

**POST** `/admin/venues/mine/security-users`

Creates a placeholder operator (no Supabase account yet).

**Body:**
```typescript
{
  firstName: string  // required
  lastName: string   // required
  email: string      // required — unique per venue
}
```

**Response:** `SecurityUserResponse`

**Errors:** `409` if email already registered at this venue.

---

**PUT** `/admin/venues/mine/security-users/{id}`

**Body:** same as POST

**Response:** `SecurityUserResponse`

**Errors:** `404` if not found.

---

**PATCH** `/admin/venues/mine/security-users/{id}/status`

> **Migration note:** Old contract used `DELETE` to deactivate. Now use `PATCH /status` with `{ active: false }`.

**Body:**
```typescript
{
  active: boolean
}
```

**Response:** `SecurityUserResponse`

---

## 9. Devices

> **Migration note:** Path unchanged. Field `serialNumber` renamed to `deviceKey`. Deactivate path changed from `/deactivate` to `/status`.

**GET** `/admin/venues/mine/devices`

**Response:**
```typescript
{
  id: string
  name: string
  deviceKey: string   // was serialNumber in old contract
  active: boolean
  venueId: string
  createdAt: string
}[]
```

---

**POST** `/admin/venues/mine/devices`

**Body:**
```typescript
{
  name: string       // required
  deviceKey: string  // required — unique per venue (was serialNumber)
}
```

**Response:** `DeviceResponse`

**Errors:** `409` if `deviceKey` already registered at this venue.

---

**PUT** `/admin/venues/mine/devices/{id}`

**Body:** same as POST

**Response:** `DeviceResponse`

---

**PATCH** `/admin/venues/mine/devices/{id}/status`

> **Migration note:** Old contract used `PATCH .../deactivate`. Now use `PATCH /status`.

**Body:**
```typescript
{
  active: boolean
}
```

**Response:** `DeviceResponse`

---

## 10. Incidents

> **Migration note:** Incident model is simplified. Old contract had `severity`, `category`, `eventId`, `operatorName`, `profileName`, `summary`. Current model has `title`, `description`, `status`, `resolution`.

**GET** `/admin/venues/mine/incidents?status=open|closed`

`status` filter is optional. Omit to get all.

**Response:**
```typescript
{
  id: string
  venueId: string
  title: string
  description: string | null
  status: "open" | "closed"
  createdAt: string
  resolvedAt: string | null
  resolution: string | null
}[]
```

---

**GET** `/admin/venues/mine/incidents/{id}`

**Response:** same shape as list item

**Errors:** `404` if not found or belongs to a different venue.

---

**PATCH** `/admin/venues/mine/incidents/{id}`

**Body:** *(all optional)*
```typescript
{
  title?: string
  description?: string | null
  status?: "open" | "closed"
  resolution?: string | null
}
```

**Response:** `IncidentResponse`

---

## 11. Access Sessions

> **Migration note:** The backend `AccessSession` is an operational model (guard opens/closes a session at the door). It is NOT a list of individual admissions/rejections. For admission scan history, use **Scan Records** (section 13).

**GET** `/admin/venues/mine/access-sessions`

Query params (all optional): `?eventId={uuid}&operatorId={uuid}&status=open|closed`

**Response:**
```typescript
{
  id: string
  venueId: string
  eventId: string
  operatorId: string
  status: "open" | "closed"
  openedAt: string   // ISO 8601 with offset
  closedAt: string | null
}[]
```

---

## 12. Dashboard

**GET** `/admin/venues/mine/dashboard`

**Response:**
```typescript
{
  venueId: string
  totalEvents: number
  upcomingEvents: number
  activeEvents: number
  totalOperators: number
  activeDevices: number
  openIncidents: number
  totalGuestEntriesAllEvents: number
  admissionsToday: number
}
```

> **Migration note:** Old frontend type had `eventsToday`, `rejectionsToday`, `warningsToday`. Current backend provides `totalEvents`, `upcomingEvents`, `activeEvents`. Rejection/warning counts are available per-event via scan stats (section 13).

---

## 13. Event Reports and Scan Data

**GET** `/admin/venues/mine/events/{eventId}/report`

**Response:**
```typescript
{
  eventId: string
  eventName: string
  status: string
  startsAt: string
  totalGuestEntries: number
  cancelledGuestEntries: number
  accessSessionCount: number
  lastSessionOpenedAt: string | null
}
```

---

**GET** `/admin/venues/mine/events/{eventId}/scan-stats`

Aggregated scan outcomes for the event.

**Response:**
```typescript
{
  allow: number
  deny: number
  warning: number
  manualReview: number
  notFound: number
  avgLatencyMs: number
  p95LatencyMs: number
  total: number
}
```

---

**GET** `/admin/venues/mine/events/{eventId}/scan-records?page=1&pageSize=50&outcome=allow|deny|warning`

Paginated list of individual door scan records.

**Response:**
```typescript
{
  items: {
    id: string
    eventId: string
    accessSessionId: string | null
    documentLookupKey: string
    outcome: "allow" | "deny" | "warning" | "manual_review" | "not_found"
    score: number | null
    latencyMs: number
    correlationId: string
    validatedAt: string
  }[]
  page: number
  pageSize: number
  total: number
}
```

---

## Migration Checklist for Frontend Developer

| # | Change | Priority |
|---|--------|----------|
| 1 | Change `IDNIGHT_BACKEND_URL` to `https://api.idnight.app` (remove `/api/v1`) | **Critical** |
| 2 | Bootstrap: read flat `organizationId` / `organizationName` instead of `organization.id` / `organization.name` | **Critical** |
| 3 | All `/admin/venues/${venueId}/...` → `/admin/venues/mine/...` (remove venueId from path) | **Critical** |
| 4 | `/admin/organizations/${orgId}/venues` → GET `/admin/venues/mine`, POST `/admin/venues`, PUT `/admin/venues/mine` | **Critical** |
| 5 | Security users path: `/operators` → `/security-users` | **Critical** |
| 6 | Security user body: `{ name }` → `{ firstName, lastName }` | **Critical** |
| 7 | Devices field: `serialNumber` → `deviceKey` | **Critical** |
| 8 | Device deactivate: `PATCH .../deactivate` → `PATCH .../status` with `{ active: false }` | **Critical** |
| 9 | Guest list upload path: `/upload` → `/import` | **Critical** |
| 10 | Guest list cancel: `DELETE .../entries/{id}` → `PATCH .../{id}` | **Critical** |
| 11 | Security user toggle: `DELETE .../operators/{id}` → `PATCH .../security-users/{id}/status` with `{ active }` | **Critical** |
| 12 | Bootstrap: add `POST /api/v1/bootstrap/me` (keep the `/api/v1` prefix for this one endpoint) | **Critical** |
| 13 | Dashboard: update type definition (different field names, see section 12) | Medium |
| 14 | Incident: update type definition (simplified model, see section 10) | Medium |
| 15 | Guest entry: `dniSuffix` → take last chars of `dni`; status lowercase | Medium |
| 16 | Event report: update type definition (fewer fields; use scan-stats for counts) | Medium |
| 17 | Access sessions: use `/mine/access-sessions?eventId=` instead of per-event path | Low |
