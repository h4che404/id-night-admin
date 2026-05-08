import { FileClock } from "lucide-react";

import { Badge, SectionHeader, Surface, Timeline, toneForLabel } from "@/components/ui-kit";
import { auditTrail } from "@/lib/data";
import { formatDate } from "@/lib/utils";

export default function AuditPage() {
  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Auditoria"
        title="Bitacora y trazabilidad"
        description="Quien hizo que, cuando, desde que dispositivo y sobre que entidad. Este modulo tiene prioridad estructural en la interfaz."
      />

      <Surface className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-50">Timeline auditada</p>
            <p className="mt-1 text-sm text-slate-400">Orden temporal claro para reconstruir decisiones y cambios operativos.</p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950/25 p-3">
            <FileClock className="h-5 w-5 text-slate-500" />
          </div>
        </div>
        <div className="mt-6">
          <Timeline
            items={auditTrail.map((event) => ({
              title: `${event.actor} · ${event.action}`,
              description: `${event.entity} · ${event.device} · ${event.outcome}`,
              meta: formatDate(event.at),
              tone: toneForLabel(event.outcome),
            }))}
          />
        </div>
      </Surface>

      <div className="grid gap-4 lg:grid-cols-3">
        {[
          ["Autorizaciones manuales", "Auditadas"],
          ["Cambios de reglas", "Auditados"],
          ["Acciones de supervisor", "Auditadas"],
        ].map(([label, value]) => (
          <Surface key={label} className="p-5">
            <Badge label={value} tone="success" />
            <p className="mt-4 text-sm leading-6 text-slate-300">{label}</p>
          </Surface>
        ))}
      </div>
    </div>
  );
}
