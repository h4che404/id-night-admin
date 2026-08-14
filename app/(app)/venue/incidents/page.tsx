import { Suspense } from "react";
import { FileWarning, ShieldAlert } from "lucide-react";
import Link from "next/link";

import { Badge, DataShell, DataTable, EmptyState, LoadingSkeleton, PaginationBar, SectionHeader, SecondaryButton } from "@/components/ui-kit";
import { requireReadyPageAccess } from "@/lib/auth-session";
import { fetchVenueIncidents } from "@/lib/idnight-backend";

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

function statusTone(status: string) {
  if (status === "open") return "warning" as const;
  if (status === "closed") return "neutral" as const;
  return "neutral" as const;
}

async function IncidentsData({ token, page }: { token: string; page: number }) {
  let result: Awaited<ReturnType<typeof fetchVenueIncidents>> = { items: [], total: 0, page, pageSize: 20 };
  let incidentsError: string | null = null;
  try {
    result = await fetchVenueIncidents(token, page);
  } catch (error) {
    incidentsError = error instanceof Error ? error.message : "No se pudieron cargar los incidentes.";
  }

  if (incidentsError) {
    return (
      <EmptyState
        title="No se pudieron cargar los incidentes"
        description={incidentsError}
        icon={<FileWarning className="h-5 w-5 text-sky-300" />}
      />
    );
  }

  const incidents = result.items;

  if (incidents.length === 0) {
    return (
      <EmptyState
        title="Sin incidentes"
        description="No hay incidentes reportados en este momento."
        icon={<ShieldAlert className="h-5 w-5 text-sky-300" />}
      />
    );
  }

  return (
    <div className="space-y-4">
      <DataShell
        title="Listado de incidentes"
        subtitle={`${result.total} incidente${result.total === 1 ? "" : "s"} reportado${result.total === 1 ? "" : "s"}`}
      >
        <DataTable
          columns={["Fecha", "Título", "Estado", "Resolución", "Acciones"]}
          rows={incidents.map((incident) => (
            <tr key={incident.id} className="align-top hover:bg-slate-950/20">
              <td className="px-5 py-4 text-sm text-slate-300">{formatDateTime(incident.createdAt)}</td>
              <td className="px-5 py-4">
                <p className="font-medium text-slate-100">{incident.title}</p>
                {incident.description && (
                  <p className="mt-1 text-xs text-slate-500 max-w-xs truncate">{incident.description}</p>
                )}
              </td>
              <td className="px-5 py-4">
                <Badge label={incident.status} tone={statusTone(incident.status)} />
              </td>
              <td className="px-5 py-4 text-sm text-slate-300 max-w-xs truncate">
                {incident.resolution || "—"}
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
      <PaginationBar
        page={result.page}
        pageSize={result.pageSize}
        total={result.total}
        basePath="/venue/incidents"
      />
    </div>
  );
}

export default async function VenueIncidentsPage({
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

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Incidentes"
        title="Incidentes reportados"
        description={`Registro de incidentes ocurridos en ${venue.name}.`}
        action={
          <Link href="/venue/incidents/new">
            <SecondaryButton>Nuevo incidente</SecondaryButton>
          </Link>
        }
      />

      <Suspense fallback={<LoadingSkeleton />}>
        <IncidentsData token={session.accessToken} page={p} />
      </Suspense>
    </div>
  );
}
