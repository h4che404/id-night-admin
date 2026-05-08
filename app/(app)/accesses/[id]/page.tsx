import { notFound } from "next/navigation";

import { Badge, SectionHeader, Surface, ValuePair, toneForLabel } from "@/components/ui-kit";
import { requireBackendSession } from "@/lib/auth-session";
import { fetchBackendAccessSessionDetail } from "@/lib/idnight-backend";
import { formatDate } from "@/lib/utils";

export default async function AccessDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireBackendSession();

  try {
    const access = await fetchBackendAccessSessionDetail(session.accessToken, id);

    return (
      <div className="space-y-6">
        <SectionHeader
          eyebrow="Detalle de acceso"
          title={access.id}
          description="Registro puntual de admision con persona, operador, puerta, resultado, motivo y señal de alerta asociada."
        />

        <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
          <Surface className="p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-slate-400">{access.personName}</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">{access.venueName} · {access.accessPointName}</h2>
              </div>
              <Badge label={access.result} tone={toneForLabel(access.result)} />
            </div>
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <ValuePair label="Fecha y hora" value={formatDate(access.occurredAt)} />
              <ValuePair label="Operador" value={access.operatorName} />
              <ValuePair label="Motivo" value={access.reason ?? "Sin motivo"} />
              <ValuePair label="Alerta" value={access.alertSummary ?? "Sin alerta"} />
            </div>
          </Surface>

          <Surface className="p-6">
            <p className="text-sm font-medium text-slate-50">Lectura rapida</p>
            <div className="mt-5 space-y-4">
              <div className="rounded-2xl border border-slate-800 bg-slate-950/25 p-4">
                <p className="text-sm font-medium text-slate-100">Decision</p>
                <p className="mt-2 text-sm text-slate-400">Resultado inequívoco y explicacion corta para analisis posterior.</p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950/25 p-4">
                <p className="text-sm font-medium text-slate-100">Trazabilidad</p>
                <p className="mt-2 text-sm text-slate-400">Cada acceso queda listo para cruzarse con incidentes, alertas y auditoria.</p>
              </div>
            </div>
          </Surface>
        </div>
      </div>
    );
  } catch {
    notFound();
  }
}
