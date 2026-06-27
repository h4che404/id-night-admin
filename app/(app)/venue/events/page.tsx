import { SectionHeader } from "@/components/ui-kit";
import { VenueEventsSection } from "@/components/venue-events-section";
import { requireReadyPageAccess } from "@/lib/auth-session";
import { fetchVenueEvents } from "@/lib/idnight-backend";
import { getSafeEventErrorMessage } from "@/lib/venue-events";

export default async function VenueEventsPage() {
  const readyAccess = await requireReadyPageAccess();

  if (!readyAccess) {
    return null;
  }

  const { session, venueSummary: venue } = readyAccess;

  let events: Awaited<ReturnType<typeof fetchVenueEvents>> = [];
  let eventsError: string | null = null;
  try {
    events = await fetchVenueEvents(session.accessToken);
  } catch (error) {
    eventsError = getSafeEventErrorMessage(error, "Could not load venue events. Please try again.");
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Events"
        title="Venue events"
        description={`Create and manage events scheduled for ${venue.name}. Activate, finish, or cancel events from the lineup below.`}
      />

      <VenueEventsSection events={events} eventsError={eventsError} />
    </div>
  );
}
