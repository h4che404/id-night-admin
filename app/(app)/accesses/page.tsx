import Link from "next/link";

import { Badge, DataShell, DataTable, FilterChip, SectionHeader, toneForLabel } from "@/components/ui-kit";
import { accesses } from "@/lib/data";
import { formatDate } from "@/lib/utils";

export default function AccessesPage() {
  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Historial de ingresos"
        title="Accesos registrados"
        description="Busqueda por fecha, local, operador y resultado, con trazabilidad suficiente para reconstruir cada decision de admision."
      />

      <DataShell
        title="Accesos recientes"
        subtitle="Tabla principal para seguimiento y analisis post-evento."
        filters={
          <>
            <FilterChip label="Hoy" active />
            <FilterChip label="Sala Prisma" />
            <FilterChip label="Permitidos" />
            <FilterChip label="Revision manual" />
          </>
        }
      >
        <DataTable
          columns={["Fecha y hora", "Persona", "Local", "Puerta", "Operador", "Resultado", "Motivo", "Detalle"]}
          rows={accesses.map((access) => (
            <tr key={access.id} className="hover:bg-slate-950/20">
              <td className="px-5 py-4 text-sm text-slate-300">{formatDate(access.timestamp)}</td>
              <td className="px-5 py-4 font-medium text-slate-100">{access.person}</td>
              <td className="px-5 py-4 text-sm text-slate-300">{access.venue}</td>
              <td className="px-5 py-4 text-sm text-slate-300">{access.gate}</td>
              <td className="px-5 py-4 text-sm text-slate-300">{access.operator}</td>
              <td className="px-5 py-4">
                <Badge label={access.result} tone={toneForLabel(access.result)} />
              </td>
              <td className="px-5 py-4 text-sm text-slate-300">{access.reason}</td>
              <td className="px-5 py-4 text-sm text-sky-300">
                <Link href={`/accesses/${access.id}`}>Ver acceso</Link>
              </td>
            </tr>
          ))}
        />
      </DataShell>
    </div>
  );
}
