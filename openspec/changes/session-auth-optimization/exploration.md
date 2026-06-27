## Exploration: session-auth-optimization

### Current State
`requireBackendProfile` in `lib/auth-session.ts` calls `resolveAdminSessionAccess(accessToken)` sequentially on every authenticated page layout and route handler. This function performs two sequential HTTP requests to the backend:
1. `bootstrapMe(accessToken)` -> `POST /api/v1/bootstrap/me`
2. `fetchVenues(accessToken, organizationId)` -> `GET /api/v1/admin/organizations/{organizationId}/venues`

This sequential call (waterfall) is blocking and executes on every server request, adding 1.5 to 3 seconds of server-side latency. Additionally, during a page load, both `layout.tsx` and `page.tsx` call `requireBackendProfile()`, repeating these queries up to 4 times per request.

### Affected Areas
- `lib/auth-session.ts` — contains `requireBackendProfile` which triggers the session resolution process.
- `lib/admin-session-access.ts` — contains `resolveAdminSessionAccess` which executes the sequential API calls.
- `app/api/auth/login/route.ts` — needs to set the cached profile cookie upon successful login.
- `app/api/auth/register/route.ts` — needs to set the cached profile cookie upon successful registration.
- `app/api/auth/logout/route.ts` — needs to clear the cached profile cookie upon logout.
- `app/api/owner-onboarding/route.ts` — needs to clear or update the cached profile cookie after creating an organization and venue.

### Approaches
1. **Cookie-based Profile Caching** — Cache the resolved `BackendAdminMe` profile as an HTTP-only secure cookie (`idnight_admin_profile`) alongside the access token. On subsequent requests, `requireBackendProfile` reads directly from the cookie, reducing API calls to 0. The cookie is updated/cleared on login, logout, onboarding, and profile/venue updates.
   - Pros: Eliminates waterfall completely for page/route requests, reducing latency to <50ms. Highly performant.
   - Cons: Cookie must be explicitly cleared or updated on mutating operations to prevent stale data. Cookie size must be under 4KB (not an issue as the profile is <500 bytes).
   - Effort: Medium

2. **React Cache (Per-Request Deduplication)** — Wrap `resolveAdminSessionAccess` and backend calls in React `cache()`.
   - Pros: Standard Next.js mechanism, trivial to implement, guarantees zero duplicate requests within the same server render pass (e.g. layout + page).
   - Cons: Does not cache across different requests/routes. The latency remains 1.5s–3s for the initial page load or client-side navigation that hits a server route.
   - Effort: Low

3. **Parallel API Call Integration / Enriched JWT** — Modify the backend to return venues in the bootstrap API or sync venue/org IDs to the Supabase custom JWT claims.
   - Pros: Cleanest architectural solution; reduces requests or parallelizes them naturally.
   - Cons: Requires backend service modifications, which are out of scope of the frontend application.
   - Effort: High

### Recommendation
Use **Approach 1 (Cookie-based Profile Caching)** combined with **Approach 2 (React Cache)** for per-request deduplication. Caching the profile in an HTTP-only cookie resolves the cross-request latency, while React `cache()` prevents redundant reads/parsing during a single rendering cycle.

### Risks
- **Stale Cache:** If organization or venue details change, the cached profile cookie might contain stale data until cleared. Mitigation: Explicitly clear/update the cookie during operations that modify the profile or venue (such as onboarding completion, venue updates, or profile updates).
- **Cookie Tampering/Security:** The profile is stored in a cookie. Mitigation: Use `httpOnly`, `secure`, and `sameSite: "lax"`. Since actual operations still authenticate using the `accessToken`, any tampering with the profile cookie wouldn't bypass backend security.

### Ready for Proposal
Yes — The orchestrator should tell the user that we are ready to proceed with implementing a hybrid cookie-caching approach combined with React per-request cache to resolve the waterfall latency.
