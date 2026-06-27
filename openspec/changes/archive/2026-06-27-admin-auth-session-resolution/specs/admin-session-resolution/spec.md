# admin-session-resolution Specification

## Purpose

Stabilize admin authentication routing in the first frontend hotfix slice, then define the additive backend bootstrap contract that provides deterministic admin operating context.

## Requirements

### Requirement: Explicit admin session states and routing

The system MUST classify admin access into explicit states: `anonymous`, `ready`, `onboarding-needed`, `degraded`, and `unauthorized`. A valid Supabase session plus backend degradation MUST yield `degraded` partial access and MUST NOT force logout. Slice 1 MAY preserve the current coarse onboarding redirect while the frontend hotfix lands without backend contract changes. Once enriched admin-context semantics are available, authenticated users missing organization setup MUST be routed to owner onboarding, while authenticated users with an existing organization but missing `primaryVenue` or equivalent operating context MUST be routed to an existing-organization venue-creation recovery path. Anonymous or unauthorized users MUST be routed to login. Authenticated surfaces MUST be treated explicitly across `app/(app)` instead of relying only on parent layout behavior: shared shell in `app/(app)/layout.tsx`, venue pages under `app/(app)/venue/**`, the account page at `app/(app)/account/page.tsx`, and authenticated route handlers under `app/api/venue/**` MUST each use state-aware guards so page-level or handler-level work does not execute unsafely in degraded mode.

#### Scenario: Degraded session avoids login loop

- GIVEN a user has a valid Supabase session
- WHEN backend bootstrap cannot resolve admin context because of a retryable backend failure
- THEN the system returns `degraded` access instead of logging the user out
- AND login/register routes MUST NOT redirect that user back into a login loop

#### Scenario: Missing organization goes to owner onboarding

- GIVEN a user is authenticated but has not completed organization setup
- WHEN the user enters an authenticated admin route
- THEN the system routes the user to owner onboarding

#### Scenario: Existing organization without venue goes to venue recovery

- GIVEN a user is authenticated and has an organization but no `primaryVenue` or equivalent operating context
- WHEN the user enters an authenticated admin route after enriched bootstrap semantics are available
- THEN the system routes the user to the existing-organization venue-creation recovery path
- AND it MUST NOT guess a venue from unordered venue data

#### Scenario: Authenticated page work is blocked outside ready state

- GIVEN a request reaches an authenticated surface such as `/venue` or `/account`
- WHEN resolved admin access is `degraded`, `onboarding-needed`, or `unauthorized`
- THEN layout and page or route guards stop venue-dependent work before it runs
- AND the system returns only the state-appropriate redirect, limited shell, or controlled JSON response

### Requirement: Request-scoped resolution and temporary fallback

The first delivery slice MUST resolve admin session access at most once per React Server Component render request and SHALL reuse that result across layouts and pages participating in that render. Separate route-handler HTTP invocations MUST be treated as independent requests and MUST NOT rely on shared React `cache()` state from other requests, though a handler MAY reuse one locally resolved result within its own body. Until enriched bootstrap is available, the system MAY use the current bootstrap-plus-venues fallback, but it MUST keep state classification unchanged, MUST deduplicate the fallback lookup within the same request scope, and SHOULD treat any venue selection derived from legacy data as temporary.

#### Scenario: Repeated consumers share one resolution

- GIVEN one server request reaches the authenticated layout and a venue page
- WHEN both consumers need admin session access
- THEN the system performs one logical resolution for that request
- AND both consumers receive the same resolved state and context

#### Scenario: Route handlers do not assume shared React cache across requests

- GIVEN two separate HTTP calls hit the same route handler
- WHEN each call resolves admin session access
- THEN each invocation performs its own request-scoped resolution boundary
- AND the handler may reuse that single result only within the active invocation body

#### Scenario: Legacy fallback remains temporary and safe

- GIVEN bootstrap does not yet return an explicit primary venue
- WHEN the frontend resolves context through the legacy venues fallback
- THEN the system may synthesize operating context for the hotfix slice
- AND it MUST preserve degraded or onboarding-needed outcomes without upgrading them to `ready`

### Requirement: Enriched bootstrap provides deterministic admin context

The backend bootstrap contract SHALL support an additive admin response that returns organization identity, a mechanical contract signal `adminContextMode` with values `legacy-fallback` or `enriched`, and one explicit `primaryVenue` for each admin when enriched semantics are available. When `adminContextMode` is `legacy-fallback`, the frontend MAY use one temporary venues lookup compatibility path for Slice 1. When `adminContextMode` is `enriched`, the frontend MUST branch deterministically on that mode, MUST use `primaryVenue` as the initial operating context when present, MUST NOT perform a follow-up venues lookup for first render, and MUST keep the session non-ready (`onboarding-needed` or `degraded`) when the user is authenticated but `primaryVenue` is missing. In that enriched missing-`primaryVenue` case, the recovery target MUST be the existing-organization venue-creation path, not owner onboarding.

#### Scenario: Enriched bootstrap removes venue waterfall

- GIVEN bootstrap returns `adminContextMode: "enriched"`, organization context, and explicit `primaryVenue`
- WHEN the authenticated shell initializes admin context
- THEN the frontend uses bootstrap as the source of truth
- AND it MUST NOT call the venues list only to infer the initial venue

#### Scenario: Authenticated bootstrap without primary venue uses existing-org recovery

- GIVEN bootstrap returns `adminContextMode: "enriched"` and authenticates the user but does not provide `primaryVenue`
- WHEN the frontend evaluates the returned admin state
- THEN the session remains `onboarding-needed` or `degraded`, not `ready`
- AND the system MUST route recovery through the existing-organization venue-creation path instead of owner onboarding

#### Scenario: Legacy bootstrap path may still use temporary fallback

- GIVEN bootstrap returns `adminContextMode: "legacy-fallback"`
- WHEN bootstrap lacks enriched primary venue semantics and the frontend resolves context
- THEN the system may use the legacy venues fallback for the frontend hotfix slice
- AND that compatibility path remains temporary until enriched bootstrap is authoritative
