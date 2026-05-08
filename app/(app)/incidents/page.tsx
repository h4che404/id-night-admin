import Link from "next/link";

import { ActionLink, Badge, DataShell, DataTable, FilterChip, SectionHeader, Surface, toneForLabel } from "@/components/ui-kit";
import { requireBackendSession } from "@/lib/auth-session";
import { fetchBackendIncidents } from "@/lib/idnight-backend";
import { formatDate } from "@/lib/utils";

export default async function IncidentsPage() {
  const session = await requireBackendSession();
  const incidents = await fetchBackendIncidents(session.accessToken);

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Incidentes"
        title="Gestion y supervision de incidentes"
        description="Modulo central para revisar severidad, estado, identidad vinculada y acciones del supervisor."
        action={incidents[0] ? <ActionLink href={`/incidents/${incidents[0].id}`} label="Abrir caso prioritario" /> : undefined}
      />

      <div className="grid gap-4 lg:grid-cols-4">
        <Surface className="p-5">
          <p className="text-sm text-slate-400">En revision</p>
          <p className="mt-3 text-3xl font-semibold text-white">{incidents.filter((item) => item.status === "En revision").length}</p>
        </Surface>
        <Surface className="p-5">
          <p className="text-sm text-slate-400">Cerrados</p>
          <p className="mt-3 text-3xl font-semibold text-white">{incidents.filter((item) => item.status === "Cerrado").length}</p>
        </Surface>
        <Surface className="p-5">
          <p className="text-sm text-slate-400">Con identidad</p>
          <p className="mt-3 text-3xl font-semibold text-white">{incidents.filter((item) => item.profileName !== "No identificado").length}</p>
        </Surface>
        <Surface className="p-5">
          <p className="text-sm text-slate-400">Criticos</p>
          <p className="mt-3 text-3xl font-semibold text-white">{incidents.filter((item) => item.severity === "Critica").length}</p>
        </Surface>
      </div>

      <DataShell
        title="Cola de incidentes"
        subtitle="Diseñada para lectura rapida, revision supervisada y acciones derivadas."
        filters={
          <>
            <FilterChip label="Criticos" active />
            <FilterChip label="En revision" />
            <FilterChip label="Ultimas 24h" />
          </>
        }
      >
        <DataTable
          columns={["Fecha", "Severidad", "Estado", "Local", "Persona", "Operador", "Descripcion", "Detalle"]}
          rows={incidents.map((incident) => (
            <tr key={incident.id} className="hover:bg-slate-950/20">
              <td className="px-5 py-4 text-sm text-slate-300">{formatDate(incident.createdAt)}</td>
              <td className="px-5 py-4">
                <Badge label={incident.severity} tone={toneForLabel(incident.severity)} />
              </td>
              <td className="px-5 py-4">
                <Badge label={incident.status} tone={toneForLabel(incident.status)} />
              </td>
              <td className="px-5 py-4 text-sm text-slate-300">{incident.venueName}</td>
              <td className="px-5 py-4 text-sm text-slate-300">{incident.profileName}</td>
              <td className="px-5 py-4 text-sm text-slate-300">{incident.operatorName}</td>
              <td className="px-5 py-4 text-sm text-slate-300">{incident.summary}</td>
              <td className="px-5 py-4 text-sm text-sky-300">
                <Link href={`/incidents/${incident.id}`}>Revisar</Link>
              </td>
            </tr>
          ))}
        />
      </DataShell>
    </div>
  );
}
