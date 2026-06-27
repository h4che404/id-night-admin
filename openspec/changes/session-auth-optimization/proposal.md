# Proposal: Session Auth Optimization

## Intent
Optimize the Next.js admin session resolution to eliminate sequential waterfalls and reduce server-side rendering latency from ~2s to <50ms. Currently, layout/page requests trigger multiple sequential bootstrap and venue listing calls. Caching the profile and moving to `GET /admin/venues/mine` resolves this.

## Scope

### In Scope
- Create an HTTP-only secure cookie `idnight_admin_profile` caching the user profile with a 15-minute TTL.
- Implement a fallback that transparently fetches/repopulates the cookie if missing while the auth token is valid.
- Clear the `idnight_admin_profile` cookie on login, logout, registration, and onboarding.
- Wrap the profile resolution in React `cache` for per-request deduplication.
- Refactor the venue lookup to call `GET /admin/venues/mine` instead of listing organization venues.

### Out of Scope
- Modifying backend authentication logic or JWT payload structures.
- Changing Supabase authorization token lifecycles or settings.

## Capabilities
### New Capabilities
- None
### Modified Capabilities
- `session-auth`: Optimize session resolution by caching operator profile and switching venue loading to `/admin/venues/mine`.

## Approach
Cache the resolved `BackendAdminMe` profile in an HTTP-only secure cookie (`idnight_admin_profile`) with a short 15-minute TTL. Update auth endpoints (`login`, `register`, `logout`, `owner-onboarding`) to clear/repopulate the cookie. If the cookie is absent but token is present, transparently fetch from the backend and store. Wrap `resolveAdminSessionAccess` in React `cache()` for per-request deduplication. Finally, update `lib/idnight-backend.ts` and `lib/admin-session-access.ts` to call `GET /admin/venues/mine` directly instead of querying all venues under an organization.

## Affected Areas
- `lib/auth-session.ts`
- `lib/admin-session-access.ts`
- `lib/idnight-backend.ts`
- `app/api/auth/login/route.ts`
- `app/api/auth/logout/route.ts`
- `app/api/auth/register/route.ts`
- `app/api/owner-onboarding/route.ts`

## Risks
| Risk | Likelihood | Mitigation |
|---|---|---|
| Stale profile cookie | Medium | Set short TTL (15m) and clear/update cookie on login, logout, registration, and onboarding. |
| Cookie size limit | Low | Profile data is under 500 bytes, well below the 4KB limit. |

## Rollback Plan
Revert the frontend code changes to restore direct backend queries and delete the `idnight_admin_profile` cookie.

## Success Criteria
- [ ] Profile resolution takes <50ms after the initial login.
- [ ] No sequential bootstrapMe + fetchVenues calls are made on normal page renders.
