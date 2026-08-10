import { requireReadyPageAccess } from "@/lib/auth-session";
import {
  fetchEventScanStats,
  findVenueEventById,
  type BackendScanStats,
  type BackendVenueEvent,
} from "@/lib/idnight-backend";
import { Badge, ErrorPanel, Surface } from "@/components/ui-kit";
import { formatDateTimeAr } from "@/lib/datetime";

function StatCard({
  label,
  value,
  toneClass,
}: {
  label: string;
  value: number;
  toneClass: string;
}) {
  return (
    <Surface className="p-5">
      <p className="label-sm text-muted-foreground">{label}</p>
      <p className={`mt-3 text-3xl font-semibold tabular-nums ${toneClass}`}>{value}</p>
    </Surface>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="label-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm text-foreground">{value}</p>
    </div>
  );
}

export default async function EventSummaryPage({
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

  // Asked for together rather than one after the other. Neither reads the other's answer, and
  // waiting on the first before starting the second doubled the wait for no reason — about half
  // a second on this page, all of it before anything is drawn.
  //
  // allSettled rather than all: statistics failing must not take the event down with it. Each
  // still reports its own problem, which is why they are not folded into one message.
  const [eventResult, statsResult] = await Promise.allSettled([
    findVenueEventById(session.accessToken, eventId),
    fetchEventScanStats(session.accessToken, eventId),
  ]);

  let event: BackendVenueEvent | null = null;
  let eventError: string | null = null;
  if (eventResult.status === "fulfilled") {
    event = eventResult.value;
    if (!event) {
      eventError = "No se encontró el evento.";
    }
  } else {
    eventError =
      eventResult.reason instanceof Error
        ? eventResult.reason.message
        : "No se pudo cargar el evento.";
  }

  let stats: BackendScanStats | null = null;
  let statsError: string | null = null;
  if (statsResult.status === "fulfilled") {
    stats = statsResult.value;
  } else {
    statsError =
      statsResult.reason instanceof Error
        ? statsResult.reason.message
        : "No se pudieron cargar las estadísticas.";
  }

  return (
    <div className="space-y-6">
      {eventError || !event ? (
        <ErrorPanel message={eventError ?? "No se pudo cargar el evento."} />
      ) : (
        <Surface className="p-5">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <DetailItem label="Inicio" value={formatDateTimeAr(event.startsAt)} />
            <DetailItem
              label="Fin"
              value={event.endsAt ? formatDateTimeAr(event.endsAt) : "Sin definir"}
            />
            <DetailItem
              label="Capacidad"
              value={event.maxCapacity ? `${event.maxCapacity} personas` : "Sin límite"}
            />
            <DetailItem
              label="Edad mínima"
              value={event.minAge ? `${event.minAge} años` : "Sin restricción"}
            />
          </div>
          <div className="mt-5 flex flex-wrap gap-2 border-t border-border pt-5">
            <Badge
              label={
                event.allowManualDniCheck
                  ? "Permite control manual de DNI"
                  : "Sin control manual de DNI"
              }
              tone="neutral"
            />
            <Badge
              label={event.requireGuestList ? "Requiere lista de invitados" : "Lista de invitados opcional"}
              tone="neutral"
            />
          </div>
        </Surface>
      )}

      <section className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold text-foreground">Ingresos</h2>
          <p className="text-xs text-muted-foreground">Estadísticas de hoy</p>
        </div>

        {statsError || !stats ? (
          <ErrorPanel message={statsError ?? "No se pudieron cargar las estadísticas."} />
        ) : (
          <>
            <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
              <StatCard label="Permitidos" value={stats.allow} toneClass="text-verified" />
              <StatCard label="Advertencias" value={stats.warning} toneClass="text-warning" />
              <StatCard label="Rechazados" value={stats.deny} toneClass="text-rejected" />
              <StatCard label="Revisión manual" value={stats.manualReview} toneClass="text-manual" />
              <StatCard label="No encontrados" value={stats.notFound} toneClass="text-foreground" />
            </div>
            <p className="font-mono text-xs text-muted-foreground">
              Latencia promedio: {Math.round(stats.avgLatencyMs)} ms · p95: {Math.round(stats.p95LatencyMs)} ms · Total: {stats.total}
            </p>
          </>
        )}
      </section>
    </div>
  );
}
