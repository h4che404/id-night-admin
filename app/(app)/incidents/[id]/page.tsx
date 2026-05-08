import { notFound } from "next/navigation";

import { Badge, SectionHeader, Surface, ValuePair, toneForLabel } from "@/components/ui-kit";
import { requireBackendSession } from "@/lib/auth-session";
import { fetchBackendIncidentDetail } from "@/lib/idnight-backend";
import { formatDate } from "@/lib/utils";

export default async function IncidentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireBackendSession();

  try {
    const incident = await fetchBackendIncidentDetail(session.accessToken, id);

    return (
      <div className="space-y-6">
        <SectionHeader
          eyebrow="Detalle de incidente"
          title={incident.id}
          description="Descripcion, identidad vinculada, revision supervisada y decisiones derivadas en un solo flujo."
        />

        <div className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
          <Surface className="p-6">
            <div className="flex flex-wrap items-center gap-3">
              <Badge label={incident.severity} tone={toneForLabel(incident.severity)} />
              <Badge label={incident.status} tone={toneForLabel(incident.status)} />
              <Badge label={incident.venueName} tone="info" />
            </div>
            <p className="mt-5 text-lg leading-8 text-slate-100">{incident.summary}</p>
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <ValuePair label="Fecha y hora" value={formatDate(incident.createdAt)} />
              <ValuePair label="Operador que registro" value={incident.operatorName} />
              <ValuePair label="Persona asociada" value={incident.profileName} />
              <ValuePair label="Accion sugerida" value={incident.followUp} />
            </div>
          </Surface>

          <Surface className="p-6">
            <p className="text-sm font-medium text-slate-50">Acciones del supervisor</p>
            <div className="mt-5 space-y-4">
              {["Confirmar vinculo", "Cerrar incidente", "Crear alerta derivada"].map((action) => (
                <div key={action} className="rounded-2xl border border-slate-800 bg-slate-950/25 p-4">
                  <p className="text-sm font-medium text-slate-100">{action}</p>
                  <p className="mt-2 text-sm text-slate-400">Disponible como accion contextual con auditoria obligatoria.</p>
                </div>
              ))}
            </div>
          </Surface>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          <Surface className="p-6">
            <p className="text-sm font-medium text-slate-50">Descripción</p>
            <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-950/25 p-4 text-sm leading-6 text-slate-300">
              {incident.description}
            </div>
          </Surface>

          <Surface className="p-6">
            <p className="text-sm font-medium text-slate-50">Evidencia disponible</p>
            <div className="mt-5 space-y-3">
              {incident.evidence.map((item) => (
                <div key={item} className="rounded-2xl border border-slate-800 bg-slate-950/25 p-4 text-sm text-slate-300">
                  {item}
                </div>
              ))}
            </div>
          </Surface>
        </div>
      </div>
    );
  } catch {
    notFound();
  }
}
