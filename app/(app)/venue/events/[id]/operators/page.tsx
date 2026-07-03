import { Suspense } from "react";
import { Shield } from "lucide-react";

import {
  Badge,
  DataShell,
  DataTable,
  EmptyState,
  ErrorPanel,
  LoadingSkeleton,
  PaginationBar,
} from "@/components/ui-kit";
import { requireReadyPageAccess } from "@/lib/auth-session";
import { fetchSecurityUsers } from "@/lib/idnight-backend";

async function OperatorsData({
  token,
  eventId,
  page,
}: {
  token: string;
  eventId: string;
  page: number;
}) {
  let result: Awaited<ReturnType<typeof fetchSecurityUsers>> = {
    items: [],
    total: 0,
    page,
    pageSize: 20,
  };
  let operatorsError: string | null = null;
  try {
    result = await fetchSecurityUsers(token, page);
  } catch (error) {
    operatorsError =
      error instanceof Error ? error.message : "No se pudieron cargar los operadores.";
  }

  if (operatorsError) {
    return <ErrorPanel message={operatorsError} />;
  }

  const users = result.items;

  if (users.length === 0) {
    return (
      <EmptyState
        title="Sin operadores"
        description="No hay usuarios de seguridad registrados para este boliche."
        icon={<Shield className="h-5 w-5 text-muted-foreground" />}
      />
    );
  }

  return (
    <div className="space-y-4">
      <DataShell
        title="Operadores"
        subtitle="Operadores de seguridad del boliche."
      >
        <DataTable
          columns={["Nombre", "Email", "Estado"]}
          rows={users.map((user) => (
            <tr key={user.id}>
              <td className="px-5">
                <p className="text-sm font-medium text-foreground">{user.fullName}</p>
              </td>
              <td className="px-5 text-sm text-foreground/80">{user.email}</td>
              <td className="px-5">
                <Badge
                  label={user.active ? "Activo" : "Inactivo"}
                  tone={user.active ? "success" : "warning"}
                />
              </td>
            </tr>
          ))}
        />
      </DataShell>
      <PaginationBar
        page={result.page}
        pageSize={result.pageSize}
        total={result.total}
        basePath={`/venue/events/${eventId}/operators`}
      />
    </div>
  );
}

export default async function EventOperatorsPage({
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
        Los operadores son del boliche; la asignación por evento llega en una próxima versión.
      </p>

      <Suspense fallback={<LoadingSkeleton />}>
        <OperatorsData
          token={session.accessToken}
          eventId={eventId}
          page={Number.isNaN(page) || page < 1 ? 1 : page}
        />
      </Suspense>
    </div>
  );
}
