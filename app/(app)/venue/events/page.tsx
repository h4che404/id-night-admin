import { Suspense } from "react";

import { LoadingSkeleton, PaginationBar, SectionHeader } from "@/components/ui-kit";
import { VenueEventsSection } from "@/components/venue-events-section";
import { requireReadyPageAccess } from "@/lib/auth-session";
import { fetchVenueEvents } from "@/lib/idnight-backend";
import { getSafeEventErrorMessage } from "@/lib/venue-events";

async function EventsData({ token, page }: { token: string; page: number }) {
  let result: Awaited<ReturnType<typeof fetchVenueEvents>> = { items: [], total: 0, page, pageSize: 20 };
  let eventsError: string | null = null;
  try {
    result = await fetchVenueEvents(token, page);
  } catch (error) {
    eventsError = getSafeEventErrorMessage(
      error,
      "No se pudieron cargar los eventos del boliche. Intentá de nuevo.",
    );
  }

  return (
    <div className="space-y-4">
      <VenueEventsSection events={result.items} eventsError={eventsError} />
      <PaginationBar
        page={result.page}
        pageSize={result.pageSize}
        total={result.total}
        basePath="/venue/events"
      />
    </div>
  );
}

export default async function VenueEventsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const readyAccess = await requireReadyPageAccess();

  if (!readyAccess) {
    return null;
  }

  const { venueSummary: venue, session } = readyAccess;
  const p = parseInt((await searchParams).page ?? "1", 10);

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Eventos"
        title="Eventos del boliche"
        description={`Creá y gestioná los eventos programados para ${venue.name}. Activá, finalizá o cancelá eventos desde la lista de abajo.`}
      />

      <Suspense fallback={<LoadingSkeleton />}>
        <EventsData token={session.accessToken} page={p} />
      </Suspense>
    </div>
  );
}
