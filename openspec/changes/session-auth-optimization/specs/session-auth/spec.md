# Delta for session-auth

## ADDED Requirements

### Requirement: Profile Cookie Caching
The system MUST cache the resolved admin operator profile in an HTTP-only, secure cookie named `idnight_admin_profile` with a TTL of 15 minutes. During session resolution, if a valid authentication token exists, the system MUST check for this cookie:
- If the cookie exists, the profile MUST be read directly from it to avoid backend API requests.
- If the cookie does not exist but the authentication token is present, the system MUST fetch the profile from the backend, write it back to the `idnight_admin_profile` cookie, and return the resolved profile.

#### Scenario: Read profile from cache
- GIVEN a user has a valid Supabase access token cookie
- AND a valid, non-expired `idnight_admin_profile` cookie is present
- WHEN a profile or session resolution request is initiated
- THEN the system reads the profile from the `idnight_admin_profile` cookie
- AND no backend API calls to bootstrap or fetch venues are made

#### Scenario: Repopulate cache when missing
- GIVEN a user has a valid Supabase access token cookie
- AND the `idnight_admin_profile` cookie is absent
- WHEN a profile or session resolution request is initiated
- THEN the system fetches the operator profile from the backend
- AND writes the profile to the `idnight_admin_profile` cookie with a 15-minute TTL
- AND returns the resolved profile

### Requirement: Per-Request Deduplication
The session/profile resolution logic MUST be wrapped in React `cache` to deduplicate resolution attempts within a single React server rendering cycle.

#### Scenario: Deduplicate parallel server-side calls
- GIVEN a single React Server Component request render pass
- AND multiple components call the session resolution function
- WHEN the request is processed
- THEN only one logical session resolution executes
- AND all calling components receive the identical resolved profile

### Requirement: Cache Cleardown on Mutation
The `idnight_admin_profile` cookie MUST be cleared or updated during operations that mutate the operator status or session. Specifically:
- The cookie MUST be cleared upon logout.
- The cookie MUST be cleared or updated upon successful onboarding completion.
- The cookie MUST be cleared upon login or registration.

#### Scenario: Clear cache on logout
- GIVEN a user has a cached profile cookie `idnight_admin_profile`
- WHEN the user calls the logout API route
- THEN the `idnight_admin_profile` cookie is deleted from the client browser

#### Scenario: Clear or update cache on onboarding completion
- GIVEN an owner has an active session and has completed the onboarding flow
- WHEN the onboarding API route returns a successful organization and venue creation response
- THEN the `idnight_admin_profile` cookie is cleared or updated to reflect the new venue and organization data

### Requirement: Venue Resolution via Dedicated Endpoint
The system MUST resolve the operator's venue by invoking GET `/admin/venues/mine` on the backend instead of listing all organization venues and selecting the first one.

#### Scenario: Resolve venue directly
- GIVEN an authenticated operator without a cached profile cookie
- WHEN the system resolves the operator profile
- THEN it calls GET `/admin/venues/mine` on the backend to retrieve the specific active venue details
- AND does not query all venues under the organization
