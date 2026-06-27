## Exploration: admin-auth-session-resolution

### Current State
- `readBackendSession()` only reads the Supabase access/refresh cookies.
- `requireBackendProfile()` calls `resolveAdminSessionAccess()` on every authenticated server render or route.
- `resolveAdminSessionAccess()` does a `POST /bootstrap/me` with `X-Client-Type: admin`, then does `GET /admin/organizations/{organizationId}/venues` and picks `venues[0]` as the resolved venue.
- `401/403` become `login`, `5xx` become `degraded`.
- `app/login/page.tsx` incorrectly sends `degraded` to `/venue`, while `requireBackendProfile()` sends degraded sessions back to `/login`, which can loop.
- The authenticated layout and most venue pages call `requireBackendProfile()` again, and several venue pages call `fetchMyVenue()` a second time, repeating the venue lookup.

### Affected Areas
- `lib/auth-session.ts` — server-session gate and redirect policy.
- `lib/admin-session-access.ts` — bootstrap + venue resolution and synthetic profile.
- `lib/idnight-backend.ts` — bootstrap/venues contract and venue lookup helpers.
- `app/login/page.tsx`, `app/register/page.tsx`, `app/owner-onboarding/page.tsx` — redirect behavior for session states.
- `app/(app)/layout.tsx` and `app/(app)/venue/*.tsx` — repeated auth/profile resolution and venue re-fetching.
- `app/api/venue/*.ts` — route handlers using `profile.organizationId` / `profile.venueId`.
- `docs/BACKEND_CONTRACT.md` — contract reference is not aligned with current admin-side usage in a few places.

### Approaches
1. **Front-end guard + request cache** — keep the current backend contract, but fix degraded routing and dedupe `requireBackendProfile()` with request-local cache.
   - Pros: immediate loop fix, less duplicate work per request.
   - Cons: first-load waterfall remains.
   - Effort: Low/Medium

2. **Backend-enriched bootstrap context** — extend `/bootstrap/me` to return a deterministic admin context with organization + primary venue summary.
   - Pros: removes the waterfall safely, avoids guessing `venues[0]`, makes the shell deterministic.
   - Cons: requires .NET/backend contract work.
   - Effort: Medium/High

3. **Persist resolved profile** — cache the resolved profile in an HTTP-only cookie or server cache and invalidate it on mutations.
   - Pros: reduces repeated bootstrap/list calls across requests.
   - Cons: invalidation/staleness complexity; still not the cleanest way to remove the first lookup.
   - Effort: Medium

### Recommendation
- Ship **Approach 1** immediately to stop the degraded-login loop and dedupe per-request work.
- Then implement **Approach 2** as the real fix for the waterfall: the backend should return the admin org/primary venue directly, and the frontend should stop re-resolving venues in pages that already have the profile.

### Risks
- `venues[0]` is an implicit ordering contract; if backend ordering changes, the wrong venue can be selected.
- Any cached profile must be invalidated on onboarding/profile/venue mutations or it will go stale.
- If degraded sessions keep entering the authenticated shell, the login redirect loop returns.

### Ready for Proposal
- **Yes**, but only with an explicit backend decision for primary venue resolution and a fix for degraded-login routing.
