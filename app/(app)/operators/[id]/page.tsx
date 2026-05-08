import { notFound } from "next/navigation";

import { Badge, SectionHeader, Surface, ValuePair, toneForLabel } from "@/components/ui-kit";
import { requireBackendSession } from "@/lib/auth-session";
import { fetchBackendOperatorDetail } from "@/lib/idnight-backend";
import { formatDate } from "@/lib/utils";

export default async function OperatorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireBackendSession();

  try {
    const operator = await fetchBackendOperatorDetail(session.accessToken, id);

    return (
      <div className="space-y-6">
        <SectionHeader
          eyebrow="Detalle de operador"
          title={operator.name}
          description="Permisos, rol y ultima actividad visible en la trazabilidad administrativa."
        />

        <div className="grid gap-6 xl:grid-cols-[1.25fr_1fr]">
          <Surface className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">{operator.role}</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">{operator.venueName}</h2>
              </div>
              <Badge label={operator.status} tone={toneForLabel(operator.status)} />
            </div>
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <ValuePair label="Email" value={operator.email} />
              <ValuePair label="Documento" value={operator.documentId} />
              <ValuePair label="Turno" value={operator.role === "SUPERVISOR" ? "Supervisión" : "Operación"} />
              <ValuePair label="Ultima sesion" value={operator.lastSession ? formatDate(operator.lastSession) : "Sin registro"} />
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
      </div>
    );
  } catch {
    notFound();
  }
}
