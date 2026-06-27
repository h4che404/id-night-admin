# Design: Admin Auth Session Resolution

## Technical Approach

Ship this as chained work. Slice 1 is a frontend-only hotfix: make auth states explicit, let degraded Supabase sessions reach a safe limited shell instead of bouncing to login, and reuse one resolver result per server render request. Later slices extend `/bootstrap/me` with deterministic `primaryVenue` plus an explicit bootstrap contract mode, route existing-org missing-venue users through the existing `/venue` create-state, then remove the legacy venues-list inference.

## Architecture Decisions

| Decision | Choice | Tradeoff / Rationale |
|---|---|---|
| Session model | Replace `admin/onboarding/degraded/login` with `anonymous`, `ready`, `onboarding-needed`, `degraded`, `unauthorized`. | Matches the spec and separates missing cookies from invalid backend authorization. |
| Dedupe | Keep `resolveAdminSessionAccessUncached(token)` pure and export a React `cache()` wrapper for Server Component/layout/page use. | One logical resolution is shared inside a single React Server Component render request because React invalidates `cache()` per request and memoizes by shallow argument equality; route handlers are separate HTTP invocations, cannot share that `cache()` state across requests, and should only reuse one locally resolved result inside their own handler body. |
| Degraded UX boundary | Treat authenticated surfaces as an explicit recursive set: shared `app/(app)/layout.tsx`, every page/layout/loading boundary under `app/(app)/venue/**` including nested dynamic segments, `app/(app)/account/page.tsx`, and authenticated route handlers under `app/api/venue/**`. Layout decides shell rendering, but each venue/account surface and handler still enforces `ready` before venue-dependent work runs. | Next.js App Router can execute page-level work independently of parent intent, so degraded safety cannot rely on layout-only suppression. |
| Recovery target split | Keep `app/owner-onboarding/page.tsx` for missing-organization / first-owner setup only. Reuse the existing `app/(app)/venue/page.tsx` empty state plus `components/venue-create-form.tsx` and `app/api/venue/route.ts` when the authenticated admin already has an organization but lacks `primaryVenue`. | Avoids expanding a brand-new-owner flow to cover an existing-org problem the product already solves elsewhere. |
| Venue source contract | Distinguish two contracts with a mechanical signal: `adminContextMode: "legacy-fallback" | "enriched"`, and make the `ready` state carry a normalized venue summary that is sufficient for first render. Legacy mode may use one temporary `fetchVenues()` fallback, while enriched mode treats missing `primaryVenue` as a non-ready outcome. | Keeps Slice 1 compatible, gives the frontend a deterministic branch instead of inferring semantics from field absence alone, and removes ambiguity about whether first render still needs `fetchMyVenue()`. |
| No persistent session cache | Do not add profile cookies or cross-request server cache. | Avoids stale org/venue data and mutation invalidation complexity. |

## Data Flow

```text
cookies -> readBackendSession -> resolveAdminSessionAccess(cache)
  -> anonymous/unauthorized -> /login
  -> onboarding-needed + missing organization -> /owner-onboarding
  -> onboarding-needed + existing organization but missing primaryVenue -> /venue create-state
  -> degraded -> AppShell + unavailable panel
  -> ready -> AppShell + authenticated pages/API handlers

Legacy contract path only:
bootstrap.adminContextMode = "legacy-fallback"
  -> bootstrap.organization -> fetchVenues once -> temporary profile.venueId

Enriched bootstrap semantics:
bootstrap.adminContextMode = "enriched"
  -> primaryVenue present -> normalize to ready.venueSummary for first render
  -> primaryVenue missing -> remain onboarding-needed or degraded
                        -> MUST NOT infer venue from legacy list lookup

Ready first-render contract:
ready -> profile + venueSummary are enough for AppShell, `/venue` landing/index, and shared page chrome
pages needing fields outside venueSummary -> perform page-local follow-up fetch after the ready guard
                                        -> reason: extended operational data is page-specific, not session identity

Authenticated route/page guard path:
layout reads resolved access -> chooses shell
page or route handler reads same request-scoped access/guard
  -> state = ready -> venue/account work may continue
  -> state != ready -> redirect or controlled JSON/limited UI before venue fetches run
```

## File Changes

| File | Action | Description |
|---|---|---|
| `lib/admin-session-access.ts` | Modify | Define explicit state union, add uncached resolver + cached export, normalize a first-render `venueSummary`, support optional `primaryVenue`, preserve legacy fallback. |
| `lib/auth-session.ts` | Modify | Add state-aware guards (`read/requireAdminAccess`, `requireReadyBackendProfile`) and redirect mapping. |
| `lib/idnight-backend.ts` | Modify | Extend `BackendBootstrapResponse` with optional `primaryVenue`; add helpers to normalize venue summaries and distinguish summary-safe versus detail fetches. |
| `app/login/page.tsx`, `app/register/page.tsx` | Modify | Redirect only `ready`/safe `degraded` to `/venue`; keep first-time owners on `/owner-onboarding`; send existing-org missing-venue users to `/venue`. |
| `app/owner-onboarding/page.tsx` | Modify | Allow only missing-organization onboarding cases; route `ready` to `/venue`, degraded to safe degraded shell/login-neutral path, and existing-org venue recovery away from this page. |
| `app/(app)/layout.tsx` | Modify | Branch by access state; render degraded panel without children; pass ready profile to `AppShell`. |
| `app/(app)/account/page.tsx` | Modify | Treat account as an authenticated surface that still requires explicit state-aware guard behavior, not layout-only protection. |
| `app/(app)/venue/**` | Modify | Apply the same guard/first-render contract across the full recursive venue tree, including nested dynamic routes; keep the existing venue create-state as the recovery surface for authenticated users who already have an organization but lack `primaryVenue`; consume `ready.venueSummary` on first render and only keep page-local follow-up fetches where a page needs fields outside the summary contract. |
| `app/api/venue/route.ts`, `app/api/venue/**/route.ts` | Modify | Reuse venue creation for existing-org recovery and return controlled 401/403/503 JSON for non-ready states where redirects are unsafe. |
| `docs/BACKEND_CONTRACT.md` | Modify later | Document additive `primaryVenue` bootstrap response and legacy lookup removal path. |

## Interfaces / Contracts

```ts
type AdminSessionAccess =
  | { state: "anonymous" }
  | { state: "unauthorized" }
  | { state: "onboarding-needed"; onboarding: BackendOwnerOnboardingStatus }
  | { state: "degraded"; identity: JwtIdentity | null; reason: "bootstrap" | "venue-fallback" }
  | {
      state: "ready";
      profile: BackendAdminMe;
      venueSummary: AdminVenueSummary;
      venueSource: "bootstrap" | "legacy-fallback";
    };

type BackendBootstrapAdminContextMode = "legacy-fallback" | "enriched";

type AdminVenueSummary = {
  id: number;
  name: string;
  slug?: string | null;
  address?: string | null;
  city?: string | null;
  active: boolean;
};
```

Additive backend shape: `organization` remains nullable; `adminContextMode: BackendBootstrapAdminContextMode` explicitly declares whether the response is still on legacy fallback semantics or has adopted enriched semantics; `primaryVenue?: { id; name; slug?; address?; city?; active } | null` is returned only for admin bootstrap context. The resolver MUST normalize either `primaryVenue` or the temporary legacy fallback result into `ready.venueSummary`. That summary is the minimum first-render contract for authenticated venue surfaces: enough for shell selection, `/venue` landing/index UI, breadcrumb/title context, and any guard logic that only needs venue identity plus light display metadata. Pages that need richer operational data (for example, settings sections or nested dynamic views that require fields not present in `AdminVenueSummary`) MUST issue a page-local follow-up fetch after the `ready` guard because those fields are page-specific detail, not session bootstrap identity. In `legacy-fallback` mode, the frontend may use one temporary legacy venues lookup. In `enriched` mode, an authenticated bootstrap response with `organization` present but `primaryVenue: null` or omitted MUST remain non-ready and MUST route to the existing `/venue` create-state instead of `app/owner-onboarding/page.tsx`; only missing-organization cases use owner onboarding.

## Testing Strategy

| Layer | What to Test | Approach |
|---|---|---|
| Unit | State classification, 401/403/5xx handling, primaryVenue preference, fallback preservation. | Extend `lib/admin-session-access.test.ts` with strict TDD red cases first. |
| Server route | API handlers do not redirect for degraded/unauthorized states. | Node-environment route tests with mocked auth helpers. |
| Component/server pages | Login/register/onboarding/layout redirect matrix and degraded panel. | Vitest module mocks for `next/navigation` and auth helpers. |
| E2E | Not available in repo. | Rely on unit/route coverage plus `npm run test`, `npm run lint`, `npm run build`. |

## Migration / Rollout

Slice 1: frontend hotfix only, rollback by reverting resolver/layout/page changes. Slice 2: backend returns `adminContextMode` and `primaryVenue` additively; legacy fallback remains allowed only when bootstrap explicitly says `adminContextMode: "legacy-fallback"`; first-time owners still use `/owner-onboarding`, while existing-org missing-venue users recover on `/venue`. Slice 3: once enriched bootstrap is authoritative, responses switch to `adminContextMode: "enriched"`, missing `primaryVenue` stays non-ready on the existing-org venue creation path, and the `fetchMyVenue()`/`fetchVenues()` first-render inference path is removed.

## Open Questions

- None blocking for task breakdown.
