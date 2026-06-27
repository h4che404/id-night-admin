# Proposal: Admin Auth Session Resolution

## Intent

Admin login/session resolution is unstable. The frontend can loop between `/login` and `/venue`, waterfalls from bootstrap to venues, and guesses active venue from `venues[0]`. This change stabilizes routing first, then moves to explicit backend-provided admin context.

## Scope

### In Scope
- **First slice:** frontend hotfix only: stop degraded-session loops, preserve current coarse recovery redirects, and dedupe per-request session/profile resolution.
- Define `/bootstrap/me`: admin organization context plus one fixed primary venue per admin.
- Document degraded access, first-time owner onboarding, existing-org venue recovery, and deterministic primary venue resolution.

### Out of Scope
- Multi-venue switching or venue selection UX.
- Persistent profile cookies/server caches.
- Backend implementation in Slice 1.

## Capabilities

### New Capabilities
- `admin-session-resolution`: Admin routing, degraded access, owner onboarding, and deterministic operating context.

### Modified Capabilities
- None; no existing OpenSpec capability specs are present.

## Approach

Deliver in chained slices because the urgent bug and durable backend contract have different risk profiles. Slice 1 preserves the current backend contract while making session states explicit. Later slices replace `bootstrap -> venues -> venues[0]` with additive enriched bootstrap, then remove redundant venue lookups.

Backend direction: admin bootstrap distinguishes valid, onboarding-needed, degraded-with-Supabase-session, and invalid/unauthorized states. It returns organization identity plus explicit `primaryVenue` when available, keeps owner onboarding for missing-organization setup, and sends existing-org users without a venue through the existing `/venue` creation path.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `lib/auth-session.ts` | Modified | Redirect policy. |
| `lib/admin-session-access.ts` | Modified | Resolver and request dedupe. |
| `lib/idnight-backend.ts` | Modified | Bootstrap/venue adapters. |
| `app/login/page.tsx`, `app/register/page.tsx`, `app/owner-onboarding/page.tsx` | Modified | Keep public/auth redirects aligned with explicit states. |
| `app/(app)/layout.tsx`, `app/(app)/venue/*`, `components/venue-create-form.tsx`, `app/api/venue/route.ts` | Modified | Reuse context and recover existing-org users through venue creation. |
| `docs/BACKEND_CONTRACT.md` | Modified | Primary venue bootstrap direction. |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Degraded access exposes routes without full context | Medium | Constrain Slice 1 to explicit degraded/partial states. |
| Backend lands after hotfix | High | Keep backend additive and current endpoints working. |
| `venues[0]` remains temporarily | Medium | Remove in chained follow-up. |

## Rollback Plan

Rollback Slice 1 by reverting frontend redirect/resolver changes. Later backend slices stay additive and keep bootstrap + venues fallback until proven.

## Dependencies

- Supabase session cookies remain the frontend auth source.
- Backend/.NET supports additive enriched `/bootstrap/me`.

## Success Criteria

- [ ] Degraded backend plus valid Supabase session no longer loops to login.
- [ ] Missing-organization / first-time owners continue to recover through owner onboarding.
- [ ] Existing-org authenticated users without `primaryVenue` recover through the existing `/venue` creation path after the backend-contract slice.
- [ ] Admin context no longer depends on `venues[0]` after the backend-contract slice.
- [ ] First PR remains a frontend hotfix slice suitable for forced chained delivery.
