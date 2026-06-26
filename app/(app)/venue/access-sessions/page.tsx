import { ClipboardList } from "lucide-react";

import { requireBackendProfile } from "@/lib/auth-session";
import { fetchAccessSessions, fetchMyVenue, fetchVenueEvents } from "@/lib/idnight-backend";
import { EmptyState, SectionHeader } from "@/components/ui-kit";
import { AccessSessionsSection } from "@/components/access-sessions-section";

export default async function AccessSessionsPage() {
  const { session, profile } = await requireBackendProfile();

  let venue = null;
  try {
    venue = await fetchMyVenue(session.accessToken);
  } catch {
    venue = null;
  }

  if (!venue) {
    return (
      <div className="space-y-6">
        <SectionHeader
          eyebrow="Entries"
          title="Access history"
          description="View access attempt records for your venue."
        />
        <EmptyState
          title="No venue configured"
          description="Set up your venue first to view access records."
          icon={<ClipboardList className="h-5 w-5 text-sky-300" />}
        />
      </div>
    );
  }

  let events: Array<{ id: string; name: string }> = [];
  try {
    const raw = await fetchVenueEvents(session.accessToken, venue.id);
    events = raw.map((e) => ({ id: e.id, name: e.name }));
  } catch {
    events = [];
  }

  let initialSessions: Awaited<ReturnType<typeof fetchAccessSessions>> = [];
  let initialError: string | null = null;
  try {
    initialSessions = await fetchAccessSessions(session.accessToken, venue.id);
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

