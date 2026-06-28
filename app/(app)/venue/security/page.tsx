import { Suspense } from "react";
import { UserPlus } from "lucide-react";

import { requireReadyPageAccess } from "@/lib/auth-session";
import { fetchSecurityUsers } from "@/lib/idnight-backend";
import { Badge, DataShell, DataTable, EmptyState, LoadingSkeleton, PaginationBar, SectionHeader } from "@/components/ui-kit";
import { SecurityUserForm } from "@/components/security-user-form";
import { SecurityUserActions } from "@/components/security-user-actions";

async function SecurityUsersData({ token, page }: { token: string; page: number }) {
  let result: Awaited<ReturnType<typeof fetchSecurityUsers>> = { items: [], total: 0, page, pageSize: 20 };
  try {
    result = await fetchSecurityUsers(token, page);
  } catch {
    result = { items: [], total: 0, page, pageSize: 20 };
  }

  const users = result.items;

  if (users.length === 0) {
    return (
      <EmptyState
        title="Sin usuarios de seguridad"
        description="Creá el primer usuario de seguridad usando el formulario de arriba. Este usuario podrá iniciar sesión en la app mobile de ID-Night."
        icon={<UserPlus className="h-5 w-5 text-sky-300" />}
      />
    );
  }

  return (
    <div className="space-y-4">
      <DataShell
        title="Equipo de seguridad"
        subtitle={`${result.total} usuario${result.total === 1 ? "" : "s"} registrado${result.total === 1 ? "" : "s"}`}
      >
        <DataTable
          columns={["Nombre", "Email", "Estado", "Acciones"]}
          rows={users.map((user) => (
            <tr key={user.id} className="hover:bg-slate-950/20">
              <td className="px-5 py-4">
                <p className="font-medium text-slate-100">{user.fullName}</p>
                <p className="mt-1 text-xs text-slate-500">Seguridad</p>
              </td>
              <td className="px-5 py-4 text-sm text-slate-300">{user.email}</td>
              <td className="px-5 py-4">
                <Badge
                  label={user.active ? "Activo" : "Inactivo"}
                  tone={user.active ? "success" : "warning"}
                />
              </td>
              <td className="px-5 py-4">
                <SecurityUserActions userId={user.id} active={user.active} />
              </td>
            </tr>
          ))}
        />
      </DataShell>
      <PaginationBar
        page={result.page}
        pageSize={result.pageSize}
        total={result.total}
        basePath="/venue/security"
      />
    </div>
  );
}

export default async function SecurityPage({
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
        eyebrow="Seguridad"
        title="Usuarios de seguridad"
        description={`Personal de seguridad asociado a ${venue.name}. Estos usuarios acceden a la app mobile para operar el control de accesos.`}
      />

      <SecurityUserForm />

      <Suspense fallback={<LoadingSkeleton />}>
        <SecurityUsersData token={session.accessToken} page={p} />
      </Suspense>
    </div>
  );
}
