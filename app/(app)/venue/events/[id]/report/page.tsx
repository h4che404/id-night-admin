import { BarChart3 } from "lucide-react";

import { requireReadyPageAccess } from "@/lib/auth-session";
import { fetchEventReport } from "@/lib/idnight-backend";
import { Badge, EmptyState, SectionHeader, Surface } from "@/components/ui-kit";
import { eventStatusTone, formatEventStatusLabel } from "@/lib/venue-events";
import { formatDateTimeAr } from "@/lib/datetime";

export default async function EventReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: eventId } = await params;
  const readyAccess = await requireReadyPageAccess();

  if (!readyAccess) {
    return null;
  }

  const { session } = readyAccess;

  let report = null;
  let reportError: string | null = null;
  try {
    report = await fetchEventReport(session.accessToken, eventId);
  } catch (error) {
    reportError = error instanceof Error ? error.message : "No se pudo cargar el reporte del evento.";
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Reporte del evento"
        title={report?.eventName ?? "Reporte del evento"}
        description={
          report
            ? formatDateTimeAr(report.startsAt)
            : "Cargando datos del evento…"
        }
      />

      {reportError || !report ? (
        <EmptyState
          title="Reporte no disponible"
          description={reportError ?? "No se pudo cargar el reporte del evento."}
          icon={<BarChart3 className="h-5 w-5 text-sky-300" />}
        />
      ) : (
        <div className="space-y-6">
          {/* Status */}
          <Surface className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-400">Estado del evento</p>
              <Badge label={formatEventStatusLabel(report.status)} tone={eventStatusTone(report.status)} />
            </div>
          </Surface>

          {/* Guest list summary */}
          <div>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
              Lista de invitados
            </h3>
            <div className="grid gap-4 grid-cols-2 md:grid-cols-3">
              <Surface className="p-5">
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Entradas totales</p>
                <p className="mt-3 text-3xl font-semibold tabular-nums text-slate-200">{report.totalGuestEntries}</p>
              </Surface>
              <Surface className="p-5">
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Canceladas</p>
                <p className="mt-3 text-3xl font-semibold tabular-nums text-slate-400">{report.cancelledGuestEntries}</p>
              </Surface>
              <Surface className="p-5">
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-500">Sesiones de acceso</p>
                <p className="mt-3 text-3xl font-semibold tabular-nums text-sky-300">{report.accessSessionCount}</p>
              </Surface>
            </div>
          </div>

          {/* Last session */}
          {report.lastSessionOpenedAt && (
            <Surface className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-200">Última sesión iniciada</p>
                  <p className="mt-1 text-xs text-slate-500">{formatDateTimeAr(report.lastSessionOpenedAt)}</p>
                </div>
              </div>
            </Surface>
          )}
        </div>
      )}
    </div>
  );
}
