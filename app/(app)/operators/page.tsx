import Link from "next/link";

import { Badge, DataShell, DataTable, FilterChip, SectionHeader, Surface, toneForLabel } from "@/components/ui-kit";
import { requireBackendSession } from "@/lib/auth-session";
import { fetchBackendOperators } from "@/lib/idnight-backend";
import { formatDate } from "@/lib/utils";

export default async function OperatorsPage() {
  const session = await requireBackendSession();
  const operators = await fetchBackendOperators(session.accessToken);

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Operadores"
        title="Guardias, supervisores y administradores"
        description="Roles, permisos y estado operativo desde una vista administrativa densa pero clara."
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Surface className="p-5">
          <p className="text-sm text-slate-400">Supervisores activos</p>
          <p className="mt-3 text-3xl font-semibold text-white">
            {operators.filter((item) => item.role === "SUPERVISOR" && item.status === "Activo").length}
          </p>
        </Surface>
        <Surface className="p-5">
          <p className="text-sm text-slate-400">Guardias en turno</p>
          <p className="mt-3 text-3xl font-semibold text-white">
            {operators.filter((item) => item.role === "GUARD" && item.status === "Activo").length}
          </p>
        </Surface>
        <Surface className="p-5">
          <p className="text-sm text-slate-400">Permisos sensibles auditados</p>
          <p className="mt-3 text-3xl font-semibold text-white">100%</p>
        </Surface>
      </div>

      <DataShell
        title="Directorio operativo"
        subtitle="Alta, edicion, desactivacion y trazabilidad administrativa."
        filters={
          <>
            <FilterChip label="Activos" active />
            <FilterChip label="Supervisores" />
            <FilterChip label="Permisos sensibles" />
          </>
        }
      >
        <DataTable
          columns={["Operador", "Rol", "Local", "Estado", "Ultima sesion", "Turno", "Detalle"]}
          rows={operators.map((operator) => (
            <tr key={operator.id} className="hover:bg-slate-950/20">
              <td className="px-5 py-4">
                <p className="font-medium text-slate-100">{operator.name}</p>
                <p className="mt-1 text-sm text-slate-500">{operator.email}</p>
              </td>
              <td className="px-5 py-4 text-sm text-slate-300">{operator.role}</td>
              <td className="px-5 py-4 text-sm text-slate-300">{operator.venueName}</td>
              <td className="px-5 py-4">
                <Badge label={operator.status} tone={toneForLabel(operator.status)} />
              </td>
              <td className="px-5 py-4 text-sm text-slate-300">
                {operator.lastSession ? formatDate(operator.lastSession) : "Sin registro"}
              </td>
              <td className="px-5 py-4 text-sm text-slate-300">
                {operator.role === "SUPERVISOR" ? "Supervisión" : operator.role === "ADMIN" ? "Administración" : "Operación"}
              </td>
              <td className="px-5 py-4 text-sm text-sky-300">
                <Link href={`/operators/${operator.id}`}>Abrir detalle</Link>
              </td>
            </tr>
          ))}
        />
      </DataShell>
    </div>
  );
}
