import { ArrowLeft, BarChart3 } from "lucide-react";
import Link from "next/link";

import { requireBackendSession } from "@/lib/auth-session";
import { fetchEventReport } from "@/lib/idnight-backend";
import { Badge, EmptyState, SectionHeader, Surface } from "@/components/ui-kit";
import { formatEventDateTime } from "@/lib/venue-events";

function eventStatusTone(status: string) {
  if (status === "ACTIVE") return "success" as const;
  if (status === "CANCELLED") return "danger" as const;
  if (status === "FINISHED") return "neutral" as const;
  return "info" as const;
}

export default async function EventReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: eventId } = await params;
  const session = await requireBackendSession();

  let report = null;
  let reportError: string | null = null;
  try {
    report = await fetchEventReport(session.accessToken, eventId);
  } catch (error) {
    reportError = error instanceof Error ? error.message : "Could not load the event report.";
  }

  return (
    <div className="space-y-6">
      <Link
        href="/venue/events"
        className="inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to events
      </Link>

      <SectionHeader
        eyebrow="Event report"
        title={report?.eventName ?? "Event report"}
        description={
          report
            ? `${formatEventDateTime(report.startsAt)} → ${formatEventDateTime(report.endsAt)}`
            : "Loading event details…"
        }
      />

      {reportError || !report ? (
        <EmptyState
          title="Report unavailable"
          description={reportError ?? "Could not load the event report."}
          icon={<BarChart3 className="h-5 w-5 text-sky-300" />}
        />
      ) : (
        <div className="space-y-6">
          {/* Status */}
          <Surface className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-400">Event status</p>
              <Badge label={report.status} tone={eventStatusTone(report.status)} />
            </div>
          </Surface>

          {/* Entry outcomes grid */}
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
              Entry outcomes
            </h3>
            <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
              <Surface className="p-5">
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Total entries</p>
                <p className="mt-3 text-3xl font-semibold tabular-nums text-slate-200">{report.totalEntries}</p>
              </Surface>
              <Surface className="p-5">
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Allowed</p>
                <p className="mt-3 text-3xl font-semibold tabular-nums text-emerald-300">{report.allowedCount}</p>
              </Surface>
              <Surface className="p-5">
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Allowed w/ warning</p>
                <p className="mt-3 text-3xl font-semibold tabular-nums text-amber-300">{report.allowedWithWarningCount}</p>
              </Surface>
              <Surface className="p-5">
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Rejected</p>
                <p className="mt-3 text-3xl font-semibold tabular-nums text-rose-300">{report.rejectedCount}</p>
              </Surface>
            </div>
          </div>

          {/* Guest list summary */}
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
              Guest list
            </h3>
            <div className="grid gap-4 grid-cols-3">
              <Surface className="p-5">
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Total imported</p>
                <p className="mt-3 text-3xl font-semibold tabular-nums text-slate-200">{report.guestListTotal}</p>
              </Surface>
              <Surface className="p-5">
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Used</p>
                <p className="mt-3 text-3xl font-semibold tabular-nums text-sky-300">{report.guestListUsed}</p>
              </Surface>
              <Surface className="p-5">
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Cancelled</p>
                <p className="mt-3 text-3xl font-semibold tabular-nums text-slate-400">{report.guestListCancelled}</p>
              </Surface>
            </div>
          </div>

          {/* Incidents */}
          <Surface className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-200">Incidents</p>
                <p className="mt-1 text-xs text-slate-500">Incidents linked to this event</p>
              </div>
              <p className="text-2xl font-semibold tabular-nums text-slate-200">{report.incidentCount}</p>
            </div>
          </Surface>
        </div>
      )}
    </div>
  );
}
