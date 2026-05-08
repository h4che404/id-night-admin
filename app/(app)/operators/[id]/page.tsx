import { notFound } from "next/navigation";

import { Badge, SectionHeader, Surface, Timeline, ValuePair, toneForLabel } from "@/components/ui-kit";
import { auditTrail, findOperator } from "@/lib/data";
import { formatDate } from "@/lib/utils";

export default async function OperatorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const operator = findOperator(id);

  if (!operator) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Detalle de operador"
        title={operator.name}
        description="Permisos, turno asignado, estado de sesion y acciones sensibles en la trazabilidad administrativa."
      />

      <div className="grid gap-6 xl:grid-cols-[1.25fr_1fr]">
        <Surface className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">{operator.role}</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">{operator.venue}</h2>
            </div>
            <Badge label={operator.status} tone={toneForLabel(operator.status)} />
          </div>
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <ValuePair label="Email" value={operator.email} />
            <ValuePair label="Documento" value={operator.documentId} />
            <ValuePair label="Turno" value={operator.assignedShift} />
            <ValuePair label="Ultima sesion" value={formatDate(operator.lastSession)} />
          </div>
        </Surface>

        <Surface className="p-6">
          <p className="text-sm font-medium text-slate-50">Permisos</p>
          <div className="mt-5 flex flex-wrap gap-2">
            {operator.permissions.map((permission) => (
              <Badge key={permission} label={permission} tone="info" />
            ))}
          </div>
        </Surface>
      </div>

      <Surface className="p-6">
        <p className="text-sm font-medium text-slate-50">Actividad auditada reciente</p>
        <div className="mt-6">
          <Timeline
            items={auditTrail.map((event) => ({
              title: event.action,
              description: `${event.entity} · ${event.device}`,
              meta: formatDate(event.at),
              tone: toneForLabel(event.outcome),
            }))}
          />
        </div>
      </Surface>
    </div>
  );
}
