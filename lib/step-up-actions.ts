/**
 * Step-up action names, shared by server and client code.
 *
 * These live apart from `lib/idnight-backend.ts` because that module is `server-only` — it
 * imports React's `cache`, which cannot cross into a browser bundle. A client component that
 * needs one of these strings would otherwise drag the whole server module with it, and the
 * build fails on the import trace rather than on anything the component does.
 *
 * Types can stay in the server module: `import type` is erased before it reaches the bundler.
 * Values cannot.
 */

/**
 * Must match `StepUpActions.IncidentLinkPerson` on the backend exactly: the OTP challenge and
 * the `link-person` endpoint both scope the spent proof to this literal action string.
 */
export const INCIDENT_LINK_PERSON_STEP_UP_ACTION = "incident:link-person";
