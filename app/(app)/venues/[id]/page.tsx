import { notFound } from "next/navigation";

import { Badge, SectionHeader, Surface, Timeline, ValuePair, toneForLabel } from "@/components/ui-kit";
import { requireBackendSession } from "@/lib/auth-session";
import { fetchBackendVenues } from "@/lib/idnight-backend";
import { auditTrail } from "@/lib/data";
import { formatDate } from "@/lib/utils";

export default async function VenueDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireBackendSession();
  const venues = await fetchBackendVenues(session.accessToken);
  const venue = venues.find((item) => item.id === id);

  if (!venue) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Detalle de local"
        title={venue.name}
        description="El summary viene del backend Azure. Las capas operativas profundas siguen preparadas en UI hasta que exista un endpoint admin mas rico."
      />

      <div className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
        <Surface className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Fuente de datos</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Azure `/venues`</h2>
            </div>
            <Badge label={venue.verifiedPartner ? "Partner verificado" : "Pendiente"} tone={toneForLabel(venue.verifiedPartner ? "Verificado" : "Pendiente")} />
          </div>
          <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            <ValuePair label="Venue ID" value={venue.id} />
            <ValuePair label="Nombre" value={venue.name} />
            <ValuePair label="Direccion" value={venue.address} />
            <ValuePair label="Partner" value={venue.verifiedPartner ? "Si" : "No"} />
            <ValuePair label="Cobertura admin" value="Parcial" />
            <ValuePair label="Estado live" value="Conectado" />
          </div>
        </Surface>

        <Surface className="p-6">
          <p className="text-sm font-medium text-slate-50">Que falta en API</p>
          <div className="mt-5 space-y-4">
            {[
              "Horarios, categoria y eventos activos",
              "Puertas por venue",
              "Operadores asignados",
              "Dispositivos por sede",
              "Metricas operativas por local",
            ].map((label) => (
              <div key={label} className="rounded-2xl border border-amber-400/15 bg-amber-400/8 p-4">
                <p className="text-sm font-medium text-amber-100">{label}</p>
              </div>
            ))}
          </div>
        </Surface>
      </div>

      <Surface className="p-6">
        <p className="text-sm font-medium text-slate-50">Bitacora de referencia UX</p>
        <div className="mt-6">
          <Timeline
            items={auditTrail.map((event) => ({
              title: event.action,
              description: `${event.actor} · ${event.entity} · ${event.outcome}`,
              meta: formatDate(event.at),
              tone: toneForLabel(event.outcome),
            }))}
          />
        </div>
      </Surface>
    </div>
  );
}
