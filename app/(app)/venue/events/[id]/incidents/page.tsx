import { Suspense } from "react";
import { ShieldAlert } from "lucide-react";
import Link from "next/link";

import {
  Badge,
  DataShell,
  DataTable,
  EmptyState,
  ErrorPanel,
  LoadingSkeleton,
  PaginationBar,
  SecondaryButton,
} from "@/components/ui-kit";
import { requireReadyPageAccess } from "@/lib/auth-session";
import { fetchVenueIncidents } from "@/lib/idnight-backend";
import { formatDateTimeAr } from "@/lib/datetime";

async function IncidentsData({
  token,
  eventId,
  page,
}: {
  token: string;
  eventId: string;
  page: number;
}) {
  let result: Awaited<ReturnType<typeof fetchVenueIncidents>> = {
    items: [],
    total: 0,
    page,
    pageSize: 20,
  };
  let incidentsError: string | null = null;
  try {
    result = await fetchVenueIncidents(token, page);
  } catch (error) {
    incidentsError =
      error instanceof Error ? error.message : "No se pudieron cargar los incidentes.";
  }

  if (incidentsError) {
    return <ErrorPanel message={incidentsError} />;
  }

  const incidents = result.items;

  if (incidents.length === 0) {
    return (
      <EmptyState
        title="Sin incidentes"
        description="No hay incidentes reportados en este momento."
        icon={<ShieldAlert className="h-5 w-5 text-muted-foreground" />}
      />
    );
  }

  return (
    <div className="space-y-4">
      <DataShell
        title="Incidentes"
        subtitle={`${result.total} incidente${result.total === 1 ? "" : "s"} reportado${result.total === 1 ? "" : "s"}`}
      >
        <DataTable
          columns={["Fecha", "Título", "Estado", "Acciones"]}
          rows={incidents.map((incident) => (
            <tr key={incident.id} className="align-top">
              <td className="px-5 text-sm text-foreground/80">
                {formatDateTimeAr(incident.createdAt)}
              </td>
              <td className="px-5">
                <p className="text-sm font-medium text-foreground">{incident.title}</p>
                {incident.description && (
                  <p className="mt-1 max-w-xs truncate text-xs text-muted-foreground">
                    {incident.description}
                  </p>
                )}
              </td>
              <td className="px-5">
                <Badge
                  label={incident.status === "open" ? "Abierto" : "Cerrado"}
                  tone={incident.status === "open" ? "warning" : "neutral"}
                />
              </td>
              <td className="px-5">
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
        basePath={`/venue/events/${eventId}/incidents`}
      />
    </div>
  );
}

export default async function EventIncidentsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { id: eventId } = await params;
  const readyAccess = await requireReadyPageAccess();

  if (!readyAccess) {
    return null;
  }

  const { session } = readyAccess;
  const page = parseInt((await searchParams).page ?? "1", 10);

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Los incidentes son del boliche; el vínculo por evento llega en una próxima versión.
      </p>

      <Suspense fallback={<LoadingSkeleton />}>
        <IncidentsData
          token={session.accessToken}
          eventId={eventId}
          page={Number.isNaN(page) || page < 1 ? 1 : page}
        />
      </Suspense>
    </div>
  );
}
