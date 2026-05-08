import { Badge, DataShell, DataTable, FilterChip, SectionHeader, toneForLabel } from "@/components/ui-kit";
import { accessPoints } from "@/lib/data";
import { formatDate } from "@/lib/utils";

export default function AccessPointsPage() {
  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Accesos"
        title="Gestion de puertas y puntos de control"
        description="Monitoreo claro de cada access point con operador, dispositivo, estado y ritmo operativo."
      />

      <DataShell
        title="Puntos de acceso"
        subtitle="Pensado para reasignar rapido y detectar cuellos de botella."
        filters={
          <>
            <FilterChip label="Operativas" active />
            <FilterChip label="Manual review" />
            <FilterChip label="Offline" />
          </>
        }
      >
        <DataTable
          columns={["Puerta", "Operador", "Dispositivo", "Estado", "Ultima actividad", "Ritmo"]}
          rows={accessPoints.map((point) => (
            <tr key={point.id} className="hover:bg-slate-950/20">
              <td className="px-5 py-4">
                <p className="font-medium text-slate-100">{point.name}</p>
              </td>
              <td className="px-5 py-4 text-sm text-slate-300">{point.operator}</td>
              <td className="px-5 py-4 text-sm text-slate-300">{point.device}</td>
              <td className="px-5 py-4">
                <Badge label={point.status} tone={toneForLabel(point.status)} />
              </td>
              <td className="px-5 py-4 text-sm text-slate-300">{formatDate(point.lastActivity)}</td>
              <td className="px-5 py-4 text-sm text-slate-300">{point.throughput}</td>
            </tr>
          ))}
        />
      </DataShell>
    </div>
  );
}
