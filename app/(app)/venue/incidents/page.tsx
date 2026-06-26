import { FileWarning, ShieldAlert } from "lucide-react";
import Link from "next/link";

import { Badge, DataShell, DataTable, EmptyState, SectionHeader, SecondaryButton } from "@/components/ui-kit";
import { requireBackendProfile } from "@/lib/auth-session";
import { fetchMyVenue, fetchVenueIncidents } from "@/lib/idnight-backend";

function formatDateTime(value: string | null) {
  if (!value) {
    return "Sin fecha";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Fecha inválida";
  }

  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
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

export default async function VenueIncidentsPage() {
  const { session, profile } = await requireBackendProfile();

  let venue = null;
  try {
    venue = await fetchMyVenue(session.accessToken, profile.organizationId);
  } catch {
    venue = null;
  }

  if (!venue) {
    return (
      <div className="space-y-6">
        <SectionHeader
          eyebrow="Incidentes"
          title="Incidentes reportados"
          description="Primero necesitás crear tu boliche para poder ver los incidentes."
        />
        <EmptyState
          title="Sin boliche configurado"
          description="Volvé al panel principal para crear tu boliche."
          icon={<ShieldAlert className="h-5 w-5 text-sky-300" />}
        />
      </div>
    );
  }

  let incidents: Awaited<ReturnType<typeof fetchVenueIncidents>> = [];
  let incidentsError: string | null = null;
  try {
    incidents = await fetchVenueIncidents(session.accessToken, venue.id);
  } catch (error) {
    incidentsError = error instanceof Error ? error.message : "No se pudieron cargar los incidentes.";
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Incidentes"
        title="Incidentes reportados"
        description={`Registro de incidentes ocurridos en ${venue.name}.`}
      />

      {incidentsError ? (
        <EmptyState
          title="No se pudieron cargar los incidentes"
          description={incidentsError}
          icon={<FileWarning className="h-5 w-5 text-sky-300" />}
        />
      ) : incidents.length === 0 ? (
        <EmptyState
          title="Sin incidentes"
          description="No hay incidentes reportados en este momento."
          icon={<ShieldAlert className="h-5 w-5 text-sky-300" />}
        />
      ) : (
        <DataShell
          title="Listado de incidentes"
          subtitle={`${incidents.length} incidente${incidents.length === 1 ? "" : "s"} reportado${incidents.length === 1 ? "" : "s"}`}
        >
          <DataTable
            columns={["Fecha", "Severidad", "Estado", "Categoría", "Operador / Persona", "Resumen", "Acciones"]}
            rows={incidents.map((incident) => (
              <tr key={incident.id} className="align-top hover:bg-slate-950/20">
                <td className="px-5 py-4 text-sm text-slate-300">{formatDateTime(incident.createdAt)}</td>
                <td className="px-5 py-4">
                  <Badge label={incident.severity} tone={severityTone(incident.severity)} />
                </td>
                <td className="px-5 py-4">
                  <Badge label={incident.status} tone={statusTone(incident.status)} />
                </td>
                <td className="px-5 py-4 text-sm text-slate-300">{incident.category ?? "—"}</td>
                <td className="px-5 py-4">
                  <p className="font-medium text-slate-100">{incident.operatorName || "N/A"}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {incident.profileName ? `Persona: ${incident.profileName}` : "Sin persona asociada"}
                  </p>
                </td>
                <td className="px-5 py-4 text-sm text-slate-300 max-w-xs truncate">
                  {incident.summary || "Sin resumen"}
                </td>
                <td className="px-5 py-4">
                  <Link href={`/venue/incidents/${incident.id}`}>
                    <SecondaryButton>Ver detalle</SecondaryButton>
                  </Link>
                </td>
              </tr>
            ))}
          />
        </DataShell>
      )}
    </div>
  );
}