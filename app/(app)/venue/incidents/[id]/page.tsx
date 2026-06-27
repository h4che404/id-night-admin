import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { SectionHeader, Surface, Badge, ErrorPanel } from "@/components/ui-kit";
import { VenueIncidentForm } from "@/components/venue-incident-form";
import { requireReadyPageAccess } from "@/lib/auth-session";
import { fetchVenueIncident } from "@/lib/idnight-backend";

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
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const readyAccess = await requireReadyPageAccess();

  if (!readyAccess) {
    return null;
  }

  const { session } = readyAccess;

  let incident = null;
  let incidentError = null;

  try {
    incident = await fetchVenueIncident(session.accessToken, resolvedParams.id);
  } catch (error) {
    incidentError = error instanceof Error ? error.message : "No se pudo cargar el incidente.";
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
    </div>
  );
}
