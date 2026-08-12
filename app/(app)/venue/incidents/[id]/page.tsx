import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { SectionHeader, Surface, Badge, ErrorPanel } from "@/components/ui-kit";
import { VenueIncidentForm } from "@/components/venue-incident-form";
import { VenueIncidentLifecyclePanel } from "@/components/venue-incident-lifecycle-panel";
import { requireReadyPageAccess } from "@/lib/auth-session";
import {
  fetchEntryPhotoGallery,
  fetchVenueEvents,
  fetchVenueIncident,
  type BackendEntryPhotoCard,
} from "@/lib/idnight-backend";

function formatDateTime(value: string | null) {
  if (!value) {
    return "Sin fecha";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Fecha inválida";
  }

  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "full",
    timeStyle: "short",
  }).format(date);
}

function statusTone(status: string) {
  if (status === "open") return "warning" as const;
  if (status === "closed") return "neutral" as const;
  return "neutral" as const;
}

export default async function VenueIncidentDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ eventId?: string }>;
}) {
  const resolvedParams = await params;
  const { eventId } = await searchParams;
  const readyAccess = await requireReadyPageAccess();

  if (!readyAccess) {
    return null;
  }

  const { session, venueSummary } = readyAccess;

  let incident = null;
  let incidentError = null;

  try {
    incident = await fetchVenueIncident(session.accessToken, resolvedParams.id);
  } catch (error) {
    incidentError = error instanceof Error ? error.message : "No se pudo cargar el incidente.";
  }

  // Venue events feed the gallery picker below — an incident carries no eventId today (no
  // backend field exposes one), so the operator chooses which night's gallery to browse.
  let events: Array<{ id: string; name: string }> = [];
  try {
    events = (await fetchVenueEvents(session.accessToken)).items;
  } catch (error) {
    // Degrades to an empty picker rather than failing the whole page; still logged so a
    // silent backend outage on this call does not go unnoticed.
    console.error("[incident-detail] failed to load venue events for the gallery picker", error);
  }

  let galleryCards: BackendEntryPhotoCard[] = [];
  let galleryError: string | null = null;
  if (eventId) {
    try {
      galleryCards = await fetchEntryPhotoGallery(session.accessToken, venueSummary.id, eventId);
    } catch (error) {
      galleryError =
        error instanceof Error ? error.message : "No se pudieron cargar las fotos de ingreso.";
    }
  }

  if (incidentError || !incident) {
    return (
      <div className="space-y-6">
        <Link href="/venue/incidents" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition">
          <ArrowLeft className="h-4 w-4" />
          Volver a incidentes
        </Link>
        <ErrorPanel message={incidentError || "Incidente no encontrado"} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link href="/venue/incidents" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition">
        <ArrowLeft className="h-4 w-4" />
        Volver a incidentes
      </Link>

      <SectionHeader
        eyebrow="Detalle de incidente"
        title={incident.title}
        description={`Registrado el ${formatDateTime(incident.createdAt)}.`}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <Surface className="p-6">
            <h3 className="text-lg font-medium text-white mb-4">Información principal</h3>

            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-medium text-slate-500 mb-1">Estado</dt>
                <dd><Badge label={incident.status} tone={statusTone(incident.status)} /></dd>
              </div>
              {incident.resolvedAt && (
                <div>
                  <dt className="text-xs font-medium text-slate-500 mb-1">Resuelto el</dt>
                  <dd className="text-sm text-slate-200">{formatDateTime(incident.resolvedAt)}</dd>
                </div>
              )}
              {incident.description && (
                <div className="sm:col-span-2 mt-2">
                  <dt className="text-xs font-medium text-slate-500 mb-1">Descripción</dt>
                  <dd className="text-sm text-slate-200 whitespace-pre-wrap">{incident.description}</dd>
                </div>
              )}
              {incident.resolution && (
                <div className="sm:col-span-2 mt-2">
                  <dt className="text-xs font-medium text-slate-500 mb-1">Resolución</dt>
                  <dd className="text-sm text-slate-200 whitespace-pre-wrap">{incident.resolution}</dd>
                </div>
              )}
            </dl>
          </Surface>
        </div>

        <div className="space-y-6">
          <VenueIncidentForm incident={incident} />
        </div>
      </div>

      <Surface className="space-y-4 p-6">
        <h3 className="text-lg font-medium text-white">Galería del evento</h3>
        <form className="flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor="eventId" className="mb-2 block text-sm font-medium text-slate-300">
              Evento
            </label>
            <select
              id="eventId"
              name="eventId"
              defaultValue={eventId ?? ""}
              className="rounded-2xl border border-slate-800 bg-slate-950/40 px-4 py-3 text-slate-100 outline-none focus:border-sky-400/30 transition"
            >
              <option value="">Elegí un evento…</option>
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.name}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="rounded-2xl border border-slate-800 bg-slate-950/40 px-4 py-3 text-sm text-slate-100 hover:border-sky-400/30 transition"
          >
            Ver galería
          </button>
        </form>

        {galleryError ? <ErrorPanel message={galleryError} /> : null}
      </Surface>

      <VenueIncidentLifecyclePanel incidentId={incident.id} cards={galleryCards} />
    </div>
  );
}
