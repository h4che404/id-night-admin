import { Suspense } from "react";

import {
  EventScanRecordsTable,
  ScanOutcomeFilterBar,
} from "@/components/event-scan-records-table";
import { LoadingSkeleton, PaginationBar } from "@/components/ui-kit";
import { requireReadyPageAccess } from "@/lib/auth-session";
import { fetchEventScanRecords } from "@/lib/idnight-backend";
import { normalizeScanOutcomeFilter } from "@/lib/scan-records";

const PAGE_SIZE = 50;

async function ScanRecordsData({
  token,
  eventId,
  page,
  outcome,
}: {
  token: string;
  eventId: string;
  page: number;
  outcome?: string;
}) {
  let result: Awaited<ReturnType<typeof fetchEventScanRecords>> = {
    items: [],
    total: 0,
    page,
    pageSize: PAGE_SIZE,
  };
  let recordsError: string | null = null;
  try {
    result = await fetchEventScanRecords(token, eventId, {
      outcome,
      page,
      pageSize: PAGE_SIZE,
    });
  } catch (error) {
    recordsError =
      error instanceof Error ? error.message : "No se pudieron cargar los ingresos.";
  }

  return (
    <div className="space-y-4">
      <EventScanRecordsTable
        records={result.items}
        total={result.total}
        error={recordsError}
      />
      <PaginationBar
        page={result.page}
        pageSize={result.pageSize}
        total={result.total}
        basePath={`/venue/events/${eventId}/entries`}
        searchParams={outcome ? { outcome } : undefined}
      />
    </div>
  );
}

export default async function EventEntriesPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string; outcome?: string }>;
}) {
  const { id: eventId } = await params;
  const readyAccess = await requireReadyPageAccess();

  if (!readyAccess) {
    return null;
  }

  const { session } = readyAccess;
  const resolvedSearchParams = await searchParams;
  const page = parseInt(resolvedSearchParams.page ?? "1", 10);
  const outcome = normalizeScanOutcomeFilter(resolvedSearchParams.outcome);

  return (
    <div className="space-y-4">
      <ScanOutcomeFilterBar eventId={eventId} activeOutcome={outcome} />

      <Suspense fallback={<LoadingSkeleton />}>
        <ScanRecordsData
          token={session.accessToken}
          eventId={eventId}
          page={Number.isNaN(page) || page < 1 ? 1 : page}
          outcome={outcome}
        />
      </Suspense>
    </div>
  );
}
