import { Badge, DataShell, DataTable, FilterChip, SectionHeader, toneForLabel } from "@/components/ui-kit";
import { requireBackendSession } from "@/lib/auth-session";
import { fetchBackendAccessPoints } from "@/lib/idnight-backend";
import { formatDate } from "@/lib/utils";

export default async function AccessPointsPage() {
  const session = await requireBackendSession();
  const accessPoints = await fetchBackendAccessPoints(session.accessToken);

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Accesos"
        title="Gestion de puertas y puntos de control"
        description="Monitoreo claro de cada access point con operador, dispositivo y última actividad."
      />

      <DataShell
        title="Puntos de acceso"
        subtitle="Pensado para reasignar rapido y detectar puntos ciegos operativos."
        filters={
          <>
            <FilterChip label="Operativas" active />
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
              <td className="px-5 py-4 text-sm text-slate-300">{point.operatorName}</td>
              <td className="px-5 py-4 text-sm text-slate-300">{point.deviceName}</td>
              <td className="px-5 py-4">
                <Badge label={point.status} tone={toneForLabel(point.status)} />
              </td>
              <td className="px-5 py-4 text-sm text-slate-300">{point.lastActivity ? formatDate(point.lastActivity) : "Sin actividad"}</td>
              <td className="px-5 py-4 text-sm text-slate-300">{point.throughput ?? "N/D"}</td>
            </tr>
          ))}
        />
      </DataShell>
    </div>
  );
}
