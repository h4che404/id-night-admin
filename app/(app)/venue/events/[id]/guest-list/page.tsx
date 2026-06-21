import { Users } from "lucide-react";

import { GuestListSection } from "@/components/guest-list-section";
import { EmptyState, SectionHeader } from "@/components/ui-kit";
import { requireBackendSession } from "@/lib/auth-session";
import { fetchEventGuestList, fetchVenueEvents } from "@/lib/idnight-backend";

export default async function EventGuestListPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: eventId } = await params;
  const session = await requireBackendSession();

  let eventName = "Event";
  try {
    const events = await fetchVenueEvents(session.accessToken);
    const event = events.find((e) => e.id === eventId);
    if (event) eventName = event.name;
  } catch { /* ignore, use fallback */ }

  let initialEntries: Awaited<ReturnType<typeof fetchEventGuestList>> = [];
  let initialEntriesError: string | null = null;
  try {
    initialEntries = await fetchEventGuestList(session.accessToken, eventId);
  } catch (error) {
    initialEntriesError =
      error instanceof Error ? error.message : "Could not load the guest list.";
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Guest list"
        title={`${eventName} — Guest list`}
        description="Import and manage the guest list for this event."
      />
      <GuestListSection
        eventId={eventId}
        eventName={eventName}
        initialEntries={initialEntries}
        initialEntriesError={initialEntriesError}
      />
    </div>
  );
}
