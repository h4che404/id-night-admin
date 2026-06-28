import { Suspense } from "react";

import { requireReadyPageAccess } from "@/lib/auth-session";
import { fetchAccessSessions, fetchVenueEvents } from "@/lib/idnight-backend";
import { LoadingSkeleton, PaginationBar, SectionHeader } from "@/components/ui-kit";
import { AccessSessionsSection } from "@/components/access-sessions-section";

async function AccessSessionsData({
  token,
  page,
  events,
}: {
  token: string;
  page: number;
  events: Array<{ id: string; name: string }>;
}) {
  let result: Awaited<ReturnType<typeof fetchAccessSessions>> = { items: [], total: 0, page, pageSize: 20 };
  let initialError: string | null = null;
  try {
    result = await fetchAccessSessions(token, { page });
  } catch (error) {
    initialError =
      error instanceof Error ? error.message : "Could not load access sessions.";
  }

  return (
    <div className="space-y-4">
      <AccessSessionsSection
        initialSessions={result.items}
        initialError={initialError}
        events={events}
      />
      <PaginationBar
        page={result.page}
        pageSize={result.pageSize}
        total={result.total}
        basePath="/venue/access-sessions"
      />
    </div>
  );
}

export default async function AccessSessionsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const readyAccess = await requireReadyPageAccess();

  if (!readyAccess) {
    return null;
  }

  const { session, venueSummary: venue } = readyAccess;
  const p = parseInt((await searchParams).page ?? "1", 10);

  let events: Array<{ id: string; name: string }> = [];
  try {
    const raw = await fetchVenueEvents(session.accessToken);
    events = raw.items.map((e) => ({ id: e.id, name: e.name }));
  } catch {
    events = [];
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Entries"
        title="Access history"
        description={`Entry records for ${venue.name}.`}
      />
      <Suspense fallback={<LoadingSkeleton />}>
        <AccessSessionsData token={session.accessToken} page={p} events={events} />
      </Suspense>
    </div>
  );
}
