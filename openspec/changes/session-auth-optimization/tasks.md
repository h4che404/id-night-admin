Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: Low

### Phase 1: Foundation / Infrastructure
- [x] Refactor `fetchMyVenue` in [idnight-backend.ts](file:///Users/juancruzeliasmartin/Desktop/ProyectoSaaS/ID-Night/id-night-admin/lib/idnight-backend.ts) to call GET `/admin/venues/mine` instead of listing.
- [x] Update [admin-session-access.ts](file:///Users/juancruzeliasmartin/Desktop/ProyectoSaaS/ID-Night/id-night-admin/lib/admin-session-access.ts) to call `fetchMyVenue` and handle 404 for onboarding fallback.

### Phase 2: Core Implementation
- [x] Implement `getCachedProfile` wrapped in React `cache()` in [auth-session.ts](file:///Users/juancruzeliasmartin/Desktop/ProyectoSaaS/ID-Night/id-night-admin/lib/auth-session.ts).
- [x] Read and validate stringified profile from `idnight_admin_profile` cookie in [auth-session.ts](file:///Users/juancruzeliasmartin/Desktop/ProyectoSaaS/ID-Night/id-night-admin/lib/auth-session.ts).
- [x] Fetch fresh profile on cache miss and write to `idnight_admin_profile` cookie with 15-minute TTL.

### Phase 3: Integration / Wiring
- [x] Clear `idnight_admin_profile` cookie on login in [route.ts](file:///Users/juancruzeliasmartin/Desktop/ProyectoSaaS/ID-Night/id-night-admin/app/api/auth/login/route.ts).
- [x] Clear `idnight_admin_profile` cookie on logout in [route.ts](file:///Users/juancruzeliasmartin/Desktop/ProyectoSaaS/ID-Night/id-night-admin/app/api/auth/logout/route.ts).
- [x] Clear `idnight_admin_profile` cookie on registration in [route.ts](file:///Users/juancruzeliasmartin/Desktop/ProyectoSaaS/ID-Night/id-night-admin/app/api/auth/register/route.ts).
- [x] Clear/update `idnight_admin_profile` cookie on successful onboarding in [route.ts](file:///Users/juancruzeliasmartin/Desktop/ProyectoSaaS/ID-Night/id-night-admin/app/api/owner-onboarding/route.ts).

### Phase 4: Testing
- [x] Update [admin-session-access.test.ts](file:///Users/juancruzeliasmartin/Desktop/ProyectoSaaS/ID-Night/id-night-admin/lib/admin-session-access.test.ts) to mock and assert calls to `fetchMyVenue`.
- [x] Create [auth-session.test.ts](file:///Users/juancruzeliasmartin/Desktop/ProyectoSaaS/ID-Night/id-night-admin/lib/auth-session.test.ts) to verify caching lifecycle, TTL, and React cache request deduplication.
- [x] Run test suite using `npx vitest run lib/admin-session-access.test.ts lib/auth-session.test.ts`.
