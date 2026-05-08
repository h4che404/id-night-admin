import { Badge, DataShell, DataTable, EmptyState, FilterChip, SectionHeader, toneForLabel } from "@/components/ui-kit";
import { requireBackendSession } from "@/lib/auth-session";
import { fetchBackendAlerts } from "@/lib/idnight-backend";
import { formatShortDate } from "@/lib/utils";

export default async function AlertsPage() {
  const session = await requireBackendSession();
  const alerts = await fetchBackendAlerts(session.accessToken);

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Alertas"
        title="Alertas operativas"
        description="Vigencia, severidad, motivo, origen y responsable en una vista clara para seguimiento y cierre."
      />

      <DataShell
        title="Alertas vigentes"
        subtitle="Priorizadas por nivel y fecha de expiracion."
        filters={
          <>
            <FilterChip label="Criticas" active />
            <FilterChip label="Warning" />
            <FilterChip label="Informativas" />
            <FilterChip label="Por vencer" />
          </>
        }
      >
        <DataTable
          columns={["Nivel", "Perfil", "Local", "Motivo", "Origen", "Vigencia", "Responsable"]}
          rows={alerts.map((alert) => (
            <tr key={alert.id} className="hover:bg-slate-950/20">
              <td className="px-5 py-4">
                <Badge label={alert.level} tone={toneForLabel(alert.level)} />
              </td>
              <td className="px-5 py-4 font-medium text-slate-100">{alert.profileName}</td>
              <td className="px-5 py-4 text-sm text-slate-300">{alert.venueName}</td>
              <td className="px-5 py-4 text-sm text-slate-300">{alert.reason}</td>
              <td className="px-5 py-4 text-sm text-slate-300">{alert.sourceIncidentId ?? "Sin incidente"}</td>
              <td className="px-5 py-4 text-sm text-slate-300">{alert.expiresAt ? formatShortDate(alert.expiresAt) : "Sin vencimiento"}</td>
              <td className="px-5 py-4 text-sm text-slate-300">{alert.owner}</td>
            </tr>
          ))}
        />
      </DataShell>

      <EmptyState
        title="No hay alertas vencidas pendientes de cierre"
        description="El diseño contempla estados vacios limpios y utiles, con foco en la siguiente accion operativa y sin ruido visual."
      />
    </div>
  );
}
