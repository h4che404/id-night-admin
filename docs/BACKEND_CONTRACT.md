# Canonical Backend Contract — Admin ↔ Backend .NET

This document serves as the single source of truth for the API contract between the Admin Frontend (`id-night-admin`) and the .NET Backend (`Backend-ID-Night`). It aligns with the canonical specification `phase-2-admin-dotnet-contract-canonical` defined in the backend repository.

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

---

## Base URL

```
https://<backend-host>/api/v1
```

---

## Endpoint Details

### 1. Session & Auth

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
- **Response 200:**
  ```json
  [
    {
      "id": "uuid",
      "name": "string",
      "status": "UPCOMING | ACTIVE | FINISHED | CANCELLED",
      "startsAt": "DateTimeOffset",
      "endsAt": "DateTimeOffset",
      "maxCapacity": 500,
      "minAge": 18,
      "allowManualDniCheck": true,
      "requireGuestList": false
    }
  ]
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
- **Response 200:**
  ```json
  [
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
  ]
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
- **Response 200:**
  ```json
  [
    {
      "id": "uuid",
      "name": "string",
      "deviceKey": "string",
      "status": "ACTIVE | INACTIVE",
      "statusLabel": "Activo | Inactivo",
      "active": true,
      "accessPointName": "string | null",
      "lastActivityAt": "DateTimeOffset | null",
      "createdAt": "DateTimeOffset",
      "updatedAt": "DateTimeOffset | null"
    }
  ]
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
- **Response 200:**
  ```json
  [
    {
      "id": "uuid",
      "createdAt": "DateTimeOffset",
      "severity": "LOW | MEDIUM | HIGH | CRITICAL",
      "status": "REPORTED | REVIEWED | DISMISSED",
      "category": "string | null",
      "eventId": "uuid | null",
      "eventName": "string | null",
      "venueName": "string",
      "operatorName": "string | null",
      "profileName": "string | null",
      "summary": "string | null"
    }
  ]
  ```

#### GET /admin/venues/mine/incidents/{id}
Retrieves detailed information for a single incident.
- **Response 200:** Same payload as summary + `description`, `followUp`, and `evidence` (array of strings).

#### PATCH /admin/venues/mine/incidents/{id}
Partially updates incident state.
- **Request:** `{ "severity": "...", "status": "...", "category": "...", "eventId": "...", "description": "..." }`
- **Response 200:** Updated incident detail payload.

---

### 8. Access Sessions

#### GET /admin/venues/mine/access-sessions
Retrieves entry checks and access sessions history.
- **Query Parameters:** `eventId` (optional), `method` (optional), `result` (optional), `fromDate` (optional), `toDate` (optional).
- **Response 200:**
  ```json
  [
    {
      "id": "uuid",
      "occurredAt": "DateTimeOffset",
      "method": "IDNIGHT_VERIFIED | MANUAL_DNI_CHECK | GUEST_LIST_DNI_CHECK",
      "result": "ALLOWED | ALLOWED_WITH_WARNING | REJECTED",
      "warningType": "string | null",
      "operatorName": "string | null",
      "deviceName": "string | null",
      "eventId": "uuid",
      "eventName": "string | null"
    }
  ]
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
