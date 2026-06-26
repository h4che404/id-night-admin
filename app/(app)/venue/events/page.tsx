import { CalendarDays, CalendarRange } from "lucide-react";

import { EmptyState, SectionHeader } from "@/components/ui-kit";
import { VenueEventsSection } from "@/components/venue-events-section";
import { requireBackendSession } from "@/lib/auth-session";
import { fetchMyVenue, fetchVenueEvents } from "@/lib/idnight-backend";
import { getSafeEventErrorMessage, isVenueMissingError } from "@/lib/venue-events";

export default async function VenueEventsPage() {
  const session = await requireBackendSession();

  let venue: Awaited<ReturnType<typeof fetchMyVenue>> | null = null;
  let venueError: string | null = null;

  try {
    venue = await fetchMyVenue(session.accessToken);
  } catch (error) {
    if (isVenueMissingError(error)) {
      venue = null;
    } else {
      venueError = "Could not load venue details. Please try again.";
    }
  }

  if (venueError) {
    return (
      <div className="space-y-6">
        <SectionHeader
          eyebrow="Events"
          title="Venue events"
          description="Review scheduled events and basic event creation for your venue."
        />
        <EmptyState
          title="Could not load venue details"
          description={venueError}
          icon={<CalendarRange className="h-5 w-5 text-sky-300" />}
        />
      </div>
    );
  }

  if (!venue) {
    return (
      <div className="space-y-6">
        <SectionHeader
          eyebrow="Events"
          title="Venue events"
          description="Create your venue first before scheduling events for your team."
        />
        <EmptyState
          title="No venue configured"
          description="Go back to the main venue page and create your venue before managing events."
          icon={<CalendarDays className="h-5 w-5 text-sky-300" />}
        />
      </div>
    );
  }

  let events: Awaited<ReturnType<typeof fetchVenueEvents>> = [];
  let eventsError: string | null = null;
  try {
    events = await fetchVenueEvents(session.accessToken, venue.id);
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
