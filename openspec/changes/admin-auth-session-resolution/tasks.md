# Tasks: Admin Auth Session Resolution

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 900-1300 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 -> PR 2 -> PR 3 -> PR 4 |
| Delivery strategy | force-chained |
| Chain strategy | feature-branch-chain |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: feature-branch-chain
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Frontend hotfix for explicit states, dedupe, and public-route redirects | PR 1 | Base = tracker branch; keep backend contract untouched |
| 2 | Roll out ready-only guards across authenticated pages and venue APIs | PR 2 | Base = PR 1 branch; includes controlled JSON/limited-shell behavior |
| 3 | Add enriched bootstrap contract support plus existing-org venue recovery | PR 3 | Base = PR 2 branch; decision resolved to reuse `/venue` creation |
| 4 | Remove first-render venue waterfall and finalize docs | PR 4 | Base = PR 3 branch; cleanup only after enriched mode is proven |

## Phase 0: Decision Record

- [x] 0.1 Slice 2+ recovery path is resolved: keep `app/owner-onboarding/page.tsx` + `app/api/owner-onboarding/route.ts` for missing-organization setup, and route existing-org missing-venue recovery through `app/(app)/venue/page.tsx`, `components/venue-create-form.tsx`, and `app/api/venue/route.ts`.

## Phase 1: Slice 1 Frontend Hotfix

- [x] 1.1 RED: extend `lib/admin-session-access.test.ts` and add page tests for `app/login/page.tsx`, `app/register/page.tsx`, `app/owner-onboarding/page.tsx`, and `app/(app)/layout.tsx` covering degraded/onboarding/unauthorized redirects plus request-dedupe expectations.
- [x] 1.2 GREEN: refactor `lib/admin-session-access.ts` to explicit access states and a request-scoped cached wrapper; update `lib/auth-session.ts` helpers without changing backend endpoints.
- [x] 1.3 GREEN: patch `app/login/page.tsx`, `app/register/page.tsx`, `app/owner-onboarding/page.tsx`, and `app/(app)/layout.tsx` to stop login loops and show the limited degraded shell.
- [x] 1.4 REFACTOR: update `app/(app)/venue/page.tsx` and one representative venue page test to consume the resolved access once and keep Slice 1 frontend-only.

## Phase 2: Authenticated Surface Guards

- [x] 2.1 RED: add guard tests for `app/(app)/account/page.tsx`, representative `app/(app)/venue/**` pages, `app/api/venue/route.ts`, and one nested `app/api/venue/**/route.ts` handler for 401/403/503 outcomes.
- [x] 2.2 GREEN: introduce ready-only page/API guards in `lib/auth-session.ts`; wire `app/(app)/account/page.tsx`, remaining `app/(app)/venue/**`, and `app/api/venue/**/route.ts` to block unsafe venue work.

## Phase 3: Enriched Bootstrap Contract

- [ ] 3.1 RED: extend `lib/idnight-backend.test.ts` and `lib/admin-session-access.test.ts` for `adminContextMode`, `primaryVenue`, non-ready enriched responses, normalized `ready.venueSummary`, and existing-org `/venue` recovery.
- [ ] 3.2 GREEN: update `lib/idnight-backend.ts` and `lib/admin-session-access.ts` to normalize `primaryVenue` vs legacy fallback, preserve owner onboarding for missing org, and send existing-org missing-venue users to the `/venue` create-state.

## Phase 4: Waterfall Removal and Verification

- [ ] 4.1 GREEN: replace first-render `fetchMyVenue()` dependency across `app/(app)/venue/**` with `ready.venueSummary`, while keeping the existing `/venue` create-state as the authenticated recovery surface when `organization` exists but `primaryVenue` does not.
- [ ] 4.2 REFACTOR: update `docs/BACKEND_CONTRACT.md` with the missing-org vs existing-org recovery split, then run `npm run test`, `npm run lint`, and `npm run build` for each slice before promoting the next PR base.
