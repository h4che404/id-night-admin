import { requireReadyPageAccess } from "@/lib/auth-session";
import { fetchAccessSessions, fetchVenueEvents } from "@/lib/idnight-backend";
import { SectionHeader } from "@/components/ui-kit";
import { AccessSessionsSection } from "@/components/access-sessions-section";

export default async function AccessSessionsPage() {
  const readyAccess = await requireReadyPageAccess();

  if (!readyAccess) {
    return null;
  }

  const { session, venueSummary: venue } = readyAccess;

  let events: Array<{ id: string; name: string }> = [];
  try {
    const raw = await fetchVenueEvents(session.accessToken);
    events = raw.map((e) => ({ id: e.id, name: e.name }));
  } catch {
    events = [];
  }

  let initialSessions: Awaited<ReturnType<typeof fetchAccessSessions>> = [];
  let initialError: string | null = null;
  try {
    initialSessions = await fetchAccessSessions(session.accessToken);
  } catch (error) {
    initialError =
      error instanceof Error ? error.message : "Could not load access sessions.";
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Entries"
        title="Access history"
        description={`Entry records for ${venue.name}.`}
      />
      <AccessSessionsSection
        initialSessions={initialSessions}
        initialError={initialError}
        events={events}
      />
    </div>
  );
}
