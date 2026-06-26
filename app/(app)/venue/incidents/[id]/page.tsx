import Link from "next/link";
import { ArrowLeft, ShieldAlert } from "lucide-react";

import { SectionHeader, Surface, Badge, ErrorPanel } from "@/components/ui-kit";
import { VenueIncidentForm } from "@/components/venue-incident-form";
import { requireBackendProfile } from "@/lib/auth-session";
import { fetchVenueIncident, fetchVenueEvents } from "@/lib/idnight-backend";

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

function severityTone(severity: string) {
  if (severity === "LOW") return "info" as const;
  if (severity === "MEDIUM") return "warning" as const;
  if (severity === "HIGH") return "danger" as const;
  if (severity === "CRITICAL") return "danger" as const;
  return "neutral" as const;
}

function statusTone(status: string) {
  if (status === "REPORTED") return "warning" as const;
  if (status === "REVIEWED") return "info" as const;
  if (status === "DISMISSED") return "neutral" as const;
  return "neutral" as const;
}

export default async function VenueIncidentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const { session, profile } = await requireBackendProfile();
  const venueId = profile.venueId || "00000000-0000-0000-0000-000000000000";

  let incident = null;
  let incidentError = null;

  try {
    incident = await fetchVenueIncident(session.accessToken, venueId, resolvedParams.id);
  } catch (error) {
    incidentError = error instanceof Error ? error.message : "No se pudo cargar el incidente.";
  }

  let events: Array<{ id: string; name: string }> = [];
  try {
    const raw = await fetchVenueEvents(session.accessToken, venueId);
    events = raw.map((e) => ({ id: e.id, name: e.name }));
  } catch {
    events = [];
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
        title="Incidente reportado"
        description={`Registrado el ${formatDateTime(incident.createdAt)} en ${incident.venueName}.`}
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
              <div>
                <dt className="text-xs font-medium text-slate-500 mb-1">Severidad</dt>
                <dd><Badge label={incident.severity} tone={severityTone(incident.severity)} /></dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-slate-500 mb-1">Categoría</dt>
                <dd className="text-sm text-slate-200">{incident.category ?? "Sin categoría"}</dd>
              </div>
              {incident.eventId && (
                <div>
                  <dt className="text-xs font-medium text-slate-500 mb-1">Evento</dt>
                  <dd className="text-sm text-slate-200">
                    {incident.eventName ?? incident.eventId}
                  </dd>
                </div>
              )}
              <div className="sm:col-span-2 mt-2">
                <dt className="text-xs font-medium text-slate-500 mb-1">Resumen</dt>
                <dd className="text-sm text-slate-200">{incident.summary || "Sin resumen"}</dd>
              </div>
            </dl>
          </Surface>

          <Surface className="p-6">
            <h3 className="text-lg font-medium text-white mb-4">Descripción y seguimiento</h3>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-slate-400 mb-1">Descripción</h4>
                <p className="text-sm text-slate-200 whitespace-pre-wrap">{incident.description || "Sin descripción detallada"}</p>
              </div>
              
              {incident.followUp && (
                <div className="pt-4 border-t border-slate-800/80">
                  <h4 className="text-sm font-medium text-slate-400 mb-1">Seguimiento</h4>
                  <p className="text-sm text-slate-200 whitespace-pre-wrap">{incident.followUp}</p>
                </div>
              )}
            </div>
          </Surface>

          {incident.evidence && incident.evidence.length > 0 && (
            <Surface className="p-6">
              <h3 className="text-lg font-medium text-white mb-4">Evidencia</h3>
              <ul className="space-y-2">
                {incident.evidence.map((ev, index) => (
                  <li key={index} className="text-sm text-slate-300 bg-slate-900/50 p-3 rounded-lg border border-slate-800">
                    {ev}
                  </li>
                ))}
              </ul>
            </Surface>
          )}
        </div>

        <div className="space-y-6">
          <Surface className="p-6">
            <h3 className="text-lg font-medium text-white mb-4">Involucrados</h3>
            <dl className="space-y-4">
              <div>
                <dt className="text-xs font-medium text-slate-500 mb-1">Operador que reporta</dt>
                <dd className="text-sm text-slate-200 flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-sky-400" />
                  {incident.operatorName || "Desconocido"}
                </dd>
              </div>
              <div className="pt-4 border-t border-slate-800/80">
                <dt className="text-xs font-medium text-slate-500 mb-1">Persona involucrada</dt>
                <dd className="text-sm text-slate-200">
                  {incident.profileName ? (
                    <span className="font-medium text-white">{incident.profileName}</span>
                  ) : (
                    <span className="text-slate-400 italic">Sin perfil asociado</span>
                  )}
                </dd>
              </div>
            </dl>
          </Surface>

          <VenueIncidentForm incident={incident} events={events} />
        </div>
      </div>
    </div>
  );
}