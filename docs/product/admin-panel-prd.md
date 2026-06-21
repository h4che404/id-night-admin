# ID Night Admin Panel PRD

Status: MVP Core scope frozen  
Last updated: 2026-06-19

## 1. Product vision

ID Night is a secure admission and traceability platform for nightlife venues, events, and private security operations.

The Admin Panel is the customer-facing control center where venue owners and managers configure their venue, create events, manage security operators/devices, load guest lists, review access history, and inspect basic operational reports.

The full product vision includes evidence handling, operational alerts, advanced incident review, ticketing integrations, legal retention workflows, and internal governance tooling. Those capabilities are important, but they are **not part of the MVP Core**.

## 2. MVP Core proposition

The MVP Core must prove this promise:

> ID Night improves event or venue admission control with identity, traceability, guest lists, and audited entry records.

The MVP Core must stay focused on:

- venues;
- events;
- basic roles;
- security app entry control;
- ID Night verification;
- manual physical-DNI entry;
- guest-list entry;
- access history;
- simple dashboard;
- basic event report;
- simple incidents without evidence.

## 3. MVP Core Scope

### 3.1 Authentication

MVP Core includes:

- Admin login and registration.
- Email/password authentication.
- Optional social login if already available through the chosen auth provider.
- Basic session management.

MVP Core does not require advanced account recovery, SSO, enterprise login, or multi-factor authentication.

### 3.2 Venue / establishment

MVP Core includes venue creation/request flow.

Venue states:

- `PENDING_REVIEW`
- `APPROVED`
- `REJECTED`
- `SUSPENDED`

Rules:

- A venue does not become active automatically.
- Only ID Night can approve a venue.
- While pending, the venue may have limited access depending on product policy.

### 3.3 Roles

MVP Core uses only basic roles.

Customer roles:

| Role | Responsibility |
| --- | --- |
| `OWNER` | Main venue account owner. Can manage venue, events, operators, guest lists, and reports. |
| `MANAGER` | Operational admin. Can manage events, operators, guest lists, and reports. |
| `OPERATOR` | Door/security user. Uses the security app to validate people and register access outcomes. |

Internal role:

| Role | Responsibility |
| --- | --- |
| `IDNIGHT_ADMIN` | Internal ID Night role that approves venues and performs internal review from a separate console. |

MVP Core does not implement complex permission matrices or extra roles such as `SUPERVISOR`, `AUDITOR`, `BILLING_ADMIN`, `READ_ONLY`, or `EVENT_MANAGER`.

### 3.4 Events

MVP Core includes:

- create event;
- edit basic event data;
- activate event;
- finish event;
- cancel event;
- view event state.

Event states:

- `UPCOMING`
- `ACTIVE`
- `FINISHED`
- `CANCELLED`

Minimum event data:

- name;
- date;
- start time;
- end time;
- venue;
- optional location description;
- optional max capacity.

MVP Core does not require draft/test-mode lifecycle, advanced scheduling, automated event billing, or advanced event templates.

### 3.5 Simple event rules

MVP Core includes only these event rules:

- `minAge`
- `allowManualDniCheck`
- `requireGuestList`
- `maxCapacity`
- `capacityPolicy = WARNING_ONLY`

Capacity behavior:

- Capacity is an operational warning, not a hard legal occupancy control.
- Show registered entries against max capacity, for example: `Ingresos registrados: 420 / 500`.
- Do not show “people currently inside” unless exit tracking exists in a later version.

MVP Core does not include:

- ticket rules;
- exits;
- advanced re-entry;
- per-category guest-list rules;
- supervisor-required policies;
- complex venue-default plus event-override rule inheritance.

### 3.6 Security app / entry control

MVP Core security app must allow an operator to:

- verify a person registered in ID Night;
- search by DNI;
- register manual entry with physical DNI;
- register entry through guest list;
- allow entry;
- reject entry;
- allow entry with warning.

If a person is not recognized, show:

```text
Persona no encontrada en ID-Night
Verificá el DNI físico antes de permitir el ingreso.
```

If the operator registers external physical-DNI access, the record must not be treated as ID Night verified.

### 3.7 Guest list

MVP Core includes guest-list support because it is central to event admission value.

Capabilities:

- import CSV/XLSX;
- optionally add entries manually;
- search DNI in the event list;
- mark an entry as used when access is allowed;
- avoid double use when re-entry is not implemented.

Minimum import fields:

- `dni`
- `nombre`
- `apellido`
- optional `categoria`

Guest-list statuses:

- `ACTIVE`
- `USED`
- `CANCELLED`

Privacy rules:

- Normalize DNI before lookup.
- Do not expose full DNI in reports.
- Prefer storing DNI as hash and only minimal display data where needed.

MVP Core does not include advanced category rules, category capacity limits, category-specific re-entry, or category-specific access points.

### 3.8 Access sessions and traceability

Every access attempt is recorded as an `AccessSession` or equivalent audit record.

Minimum fields:

- `eventId`
- `venueId`
- `method`
- `result`
- `operatorId`
- `deviceId`
- `occurredAt`
- optional `warningType`
- optional `relatedUserId`
- optional `relatedGuestListEntryId`

Methods:

- `IDNIGHT_VERIFIED`
- `MANUAL_DNI_CHECK`
- `GUEST_LIST_DNI_CHECK`

Results:

- `ALLOWED`
- `ALLOWED_WITH_WARNING`
- `REJECTED`

Manual physical-DNI entry stores only the operational audit record. It must not create an external person profile.

### 3.9 Basic dashboard

The Admin dashboard must be simple and operational.

Cards:

- events today;
- registered entries;
- ID Night verified entries;
- manual physical-DNI entries;
- guest-list entries;
- rejected entries;
- warnings;
- active operators.

The dashboard must show aggregate metrics only. It must not expose unnecessary personal data.

### 3.10 Event detail

Minimum event detail tabs:

1. Summary
2. Entries
3. Guest list
4. Simple incidents
5. Operators
6. Basic report

The goal is operational traceability, not advanced analytics.

### 3.11 Entries tab

Minimum filters:

- method;
- result;
- operator;
- warnings;
- time range.

Minimum table columns:

- time;
- method;
- result;
- operator;
- device;
- warning;
- detail action.

### 3.12 Simple incidents

MVP Core includes a lightweight incident model.

Fields:

- `eventId`
- `venueId`
- `incidentScope`: `PERSON_RELATED` / `EVENT_GENERAL`
- `category`
- `severity`
- `status`
- `description`
- `locationDescription`
- `occurredAt`
- `createdByUserId`
- optional `relatedAccessSessionId`
- optional `relatedUserId`

Statuses:

- `REPORTED`
- `REVIEWED`
- `DISMISSED`

Categories:

- `ACCESS_ISSUE`
- `DOCUMENT_OR_IDENTITY_ISSUE`
- `TICKET_OR_GUEST_LIST_ISSUE`
- `AGGRESSIVE_BEHAVIOR`
- `PHYSICAL_ALTERCATION`
- `HARASSMENT_OR_THREAT`
- `INTOXICATION_OR_MEDICAL_ASSISTANCE`
- `PROPERTY_DAMAGE_OR_REPORTED_THEFT`
- `OTHER`

MVP Core incident rules:

- Incidents are operational reports.
- Incidents do not automatically create future alerts.
- Incidents do not include evidence upload in MVP Core.
- Incidents do not trigger biometric matching or automated identity inference.

### 3.13 Basic event report

MVP Core report shows or exports:

- event summary;
- total entries;
- entries by method;
- manual physical-DNI entries;
- guest-list entries;
- rejected entries;
- warnings;
- operators;
- simple incidents.

No evidence files, legal packages, advanced exports, or financial reports are included in MVP Core.

## 4. Out of Scope for MVP Core

The following features are explicitly out of scope for MVP Core and must not be implemented before the MVP Core is validated.

### 4.1 Evidence and legal workflows

Out of MVP Core:

- image/video evidence upload;
- evidence viewer;
- evidence view audit;
- evidence download/export;
- `EvidenceExportRequest`;
- evidence retention by severity;
- `legalHold`;
- approved export packages;
- legal/audit evidence bundles.

### 4.2 Operational alerts

Out of MVP Core:

- future operational alerts from incidents;
- incident-to-alert conversion;
- `IncidentAlertRule` engine;
- alert expiration/renewal;
- operational alert display in future entries;
- internal alert governance console.

### 4.3 Advanced incident handling

Out of MVP Core:

- evidence-based review;
- incident rule matrix;
- confirmed incident lifecycle;
- future warnings from confirmed incidents;
- cross-event/cross-venue escalation;
- ID-Night sensitive case review.

### 4.4 Ticketing integrations

Out of MVP Core:

- real ticketing integrations;
- `TicketEntitlement` enforcement at the door;
- partner APIs;
- external event mapping;
- QR validation;
- ticket transfer;
- real-time purchase/cancellation/refund sync.

### 4.5 Advanced entry rules

Out of MVP Core:

- advanced re-entry;
- exit tracking;
- estimated current occupancy;
- per-category guest-list policies;
- supervisor-required policies;
- venue-default and event-override rule engine beyond the simple MVP fields.

### 4.6 AI / biometric advanced review

Out of MVP Core:

- face detection in incident videos;
- automatic person identification from evidence;
- biometric 1:N matching for incident review;
- automatic involved-person suggestions;
- automatic alert generation from media;
- Assisted Incident Review.

### 4.7 Advanced reporting

Out of MVP Core:

- advanced analytics dashboards;
- historical comparisons;
- financial reports;
- demographic business analytics;
- legal report packages;
- evidence export packages.

## 5. MVP Extended

MVP Extended is the first expansion after MVP Core proves value.

Candidate features:

- event draft/test mode;
- limited pending-review demo mode;
- richer guest-list validation preview;
- soft-delete and field-level audit history for guest-list entries;
- capacity warnings with better reporting;
- improved dashboard filters;
- basic venue approval UX improvements;
- simple CSV/XLSX error export;
- optional manual guest-list entry editing.

MVP Extended must still avoid evidence, legal hold, operational alerts, real ticketing integrations, and AI-assisted incident review unless explicitly promoted by product decision.

## 6. Post-MVP Roadmap

Post-MVP includes features that are valuable but too large or sensitive for MVP Core.

### 6.1 Incident evidence

- image/video evidence upload;
- private storage;
- evidence metadata;
- evidence viewer;
- evidence access audit;
- retention by severity;
- export requests;
- ID-Night-approved evidence packages.

### 6.2 Operational alerts

- confirmed incident to operational alert flow;
- venue-local alerts;
- mandatory expiration;
- alert renewal;
- alert display in future entries;
- non-blocking warning actions.

### 6.3 Internal rule governance

- `IncidentAlertRule` model;
- seeded global rules;
- versioned rule snapshots;
- internal-console management by `IDNIGHT_ADMIN`.

### 6.4 Ticketing preparation and integrations

- `TicketEntitlement` model;
- ticket associated to event and DNI hash;
- ticket status validation;
- partner event mapping;
- external ticketing API;
- QR/external validation only when legally and technically ready.

### 6.5 Advanced reports

- event analytics;
- operator performance;
- demographic aggregate insights where legally supported;
- downloadable reports;
- evidence-separated report packages.

## 7. Future Advanced

Future Advanced features require separate legal, privacy, and technical review.

- Assisted Incident Review.
- Face detection in evidence.
- Suggested person matches from evidence.
- Cross-venue data sharing.
- Province-wide or multi-venue networks.
- Advanced risk/decision support.
- Partner ecosystem.
- Enterprise compliance workflows.

Any future biometric or cross-venue feature must preserve human review, auditability, minimization, consent, and legal review.

## 8. Required product language

Use objective operational language:

- “Incidente reportado”
- “Ingreso manual con DNI físico”
- “Ingreso verificado por ID-Night”
- “Persona no encontrada en ID-Night”
- “Requiere revisión”
- “Advertencia operativa”

Avoid:

- “lista negra”
- “persona peligrosa”
- “persona problemática”
- “culpable detectado”
- “identificado automáticamente”
- “reconocimiento confirmado por IA”
- “risk score”
- “reputation score”

## 9. Implementation guardrail

This PRD describes both the MVP Core and the broader product direction.

Implementation agents must not treat Post-MVP or Future Advanced sections as current implementation scope.

Before implementing any feature outside MVP Core, require an explicit product decision and a new scoped task/spec.

The MVP Core is limited to:

- venues;
- events;
- basic roles;
- security app entry control;
- ID Night verification;
- manual physical-DNI access;
- guest lists;
- access sessions/history;
- basic dashboard;
- basic event report;
- simple incidents without evidence.

## 10. Archived Detailed Future Notes

This section preserves detailed product ideas that were discussed during PRD discovery.

These notes are **not MVP Core scope**. They exist to avoid losing product thinking while preventing premature implementation.

### 10.1 Evidence for incidents

Future evidence handling may support:

- image evidence;
- video evidence;
- private storage only;
- `storageKey`;
- `originalFileName`;
- `mimeType`;
- `sizeBytes`;
- `durationSeconds` for videos;
- `uploadedByUserId`;
- `uploadedAt`;
- `hashChecksum`;
- `containsPersonalData`;
- `evidenceStatus`;
- `retentionUntil`.

Possible evidence statuses:

- `ACTIVE`
- `REMOVED`
- `ARCHIVED`

Evidence should never be public by default. No public URLs should exist.

### 10.2 Evidence retention

Future retention policy discussed:

- `LOW`: 15 days;
- `MEDIUM`: 30 days;
- `HIGH`: 90 days;
- `CRITICAL`: 180 days.

Rules discussed:

- `retentionUntil` should be mandatory;
- expired evidence should not be visible in Admin or Security App;
- expired evidence should be archived or deleted automatically;
- dismissed incidents may allow earlier deletion unless legal hold applies.

### 10.3 Legal hold

Future legal hold workflow discussed:

- only `IDNIGHT_ADMIN` can activate legal hold;
- `OWNER` and `MANAGER` can request retention;
- legal hold prevents automatic deletion after `retentionUntil`.

Possible statuses:

- `NO_HOLD`
- `HOLD_REQUESTED`
- `LEGAL_HOLD_ACTIVE`
- `LEGAL_HOLD_RELEASED`

Possible fields:

- `legalHold`
- `legalHoldStatus`
- `legalHoldReason`
- `legalHoldRequestedByUserId`
- `legalHoldRequestedAt`
- `legalHoldApprovedByIdnightAdminId`
- `legalHoldApprovedAt`
- `legalHoldReviewAt`
- `legalHoldReleasedByIdnightAdminId`
- `legalHoldReleasedAt`
- `legalHoldReleaseReason`

### 10.4 Evidence export requests

Future evidence export should not be a direct download.

Discussed model:

- `OWNER` / `MANAGER` can request export;
- `IDNIGHT_ADMIN` approves or rejects;
- approval generates a private temporary link;
- every download is audited;
- no bulk evidence export in early versions.

Possible `EvidenceExportRequest` fields:

- `id`
- `incidentEvidenceId`
- `incidentId`
- `venueId`
- `requestedByUserId`
- `requestedAt`
- `requestReason`
- `status`: `REQUESTED`, `APPROVED`, `REJECTED`, `EXPIRED`
- `reviewedByIdnightAdminId`
- `reviewedAt`
- `reviewReason`
- `downloadUrlExpiresAt`
- `downloadedByUserId`
- `downloadedAt`

### 10.5 Evidence access audit

Future evidence access should audit real content access.

Actions discussed:

- `EVIDENCE_UPLOADED`
- `EVIDENCE_VIEWED`
- `EVIDENCE_EXPORT_REQUESTED`
- `EVIDENCE_EXPORT_APPROVED`
- `EVIDENCE_EXPORT_REJECTED`
- `EVIDENCE_DOWNLOADED`
- `EVIDENCE_REMOVED`
- `EVIDENCE_ARCHIVED`
- `EVIDENCE_ACCESS_DENIED`

What counts as view:

- opening an image;
- opening a video;
- generating a private temporary evidence URL;
- opening evidence from incident detail.

Noise control discussed:

- same user viewing the same evidence multiple times within 10 minutes should count as one view audit.

### 10.6 Operational alerts from incidents

Future alerts should be local to one venue and should never become a blacklist.

Rules discussed:

- incident does not automatically create alert;
- only confirmed incidents can generate alerts;
- alert applies only inside the same venue for early versions;
- alert does not auto-block entry;
- `expiresAt` is mandatory;
- no indefinite alerts.

Possible alert statuses:

- `ACTIVE`
- `EXPIRED`
- `DISABLED`

Possible alert model:

- `id`
- `venueId`
- `userId`
- `sourceIncidentId`
- `category`
- `severity`
- `message`
- `status`
- `createdBy`
- `createdAt`
- `expiresAt`
- `reviewRequired`
- `reviewedAt`
- `renewedFromAlertId`

### 10.7 Incident alert rules

Future alert generation should be governed by ID Night global rules, not arbitrary venue configuration.

Possible `IncidentAlertRule` fields:

- `id`
- `incidentCategory`
- `defaultSeverity`
- `minSeverity`
- `maxSeverity`
- `canGenerateAlert`
- `defaultAlertDurationDays`
- `maxAlertDurationDays`
- `requiresSupervisorReview`
- `requiresManagerConfirmation`
- `requiresOwnerConfirmation`
- `requiresIdNightReview`
- `alertMessageTemplate`
- `ruleVersion`
- `isActive`
- `createdAt`
- `updatedAt`
- `updatedByIdnightAdminId`

Rule versioning discussed:

- new rule versions affect only new incidents;
- existing incidents keep a snapshot of the rule applied when created;
- do not reapply rule changes automatically.

Possible snapshot fields on incident:

- `appliedRuleId`
- `appliedRuleVersion`
- `appliedSeverity`
- `appliedAlertDurationDays`
- `appliedCanGenerateAlert`
- `appliedRequiresSupervisorReview`
- `appliedRequiresManagerConfirmation`
- `appliedRequiresOwnerConfirmation`
- `appliedRequiresIdNightReview`

### 10.8 Future ticketing integrations

Future ticketing integration principle:

> The ticketing provider informs purchase/cancellation/refund. ID Night decides access.

Future partner model may include:

- `partnerId`;
- `apiKey`;
- `apiSecret`;
- integration status;
- allowed events.

Event mapping must not rely on event name, date, or location.

Preferred mapping:

```text
partnerId + externalEventId = idnightEventId
```

Alternative link code example:

```text
IDN-EVT-123-9KQ7
```

Future `TicketEntitlement` may include:

- event association;
- DNI hash;
- ticket status;
- provider/ticketing partner;
- partial external reference;
- used timestamp.

Ticket statuses discussed:

- `ACTIVE`
- `USED`
- `CANCELLED`
- `REFUNDED`

### 10.9 Advanced guest-list rules

Future guest-list capabilities discussed:

- category-level max capacity;
- category-level re-entry policy;
- category-specific access points;
- category requiring supervisor;
- richer import error exports;
- field-level edit history;
- advanced audit UI.

MVP Core keeps categories informational only.

### 10.10 Advanced access movement

Future access movement may include:

- `ENTRY`
- `EXIT`
- `RE_ENTRY`
- `trackExits`
- estimated current inside count.

If exit tracking is enabled later:

```text
estimatedCurrentInside = entries - exits
```

This must be shown as estimated occupancy, not exact occupancy.

### 10.11 Assisted Incident Review

Future advanced feature only.

Possible capabilities:

- detect faces in incident evidence;
- suggest possible matches;
- assist human review;
- audit every suggestion and decision.

Non-negotiable constraints:

- no automatic confirmation;
- no automatic guilt/culpability label;
- no automatic alert generation from media;
- human review required;
- legal/privacy review required before implementation.

### 10.12 Internal ID Night console

The internal console is a separate product surface and needs its own PRD.

Future internal console may handle:

- venue approval/rejection;
- request more information;
- evidence export approval;
- legal hold approval/release;
- incident-alert rule management;
- sensitive case review;
- support and account suspension.

This customer Admin PRD should reference internal dependencies but should not define internal-console UX in detail.
