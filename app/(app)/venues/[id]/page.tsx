import { notFound } from "next/navigation";

import { Badge, SectionHeader, Surface, ValuePair, toneForLabel } from "@/components/ui-kit";
import { requireBackendSession } from "@/lib/auth-session";
import { fetchBackendAccessPoints, fetchBackendDevices, fetchBackendOperators, fetchBackendVenues } from "@/lib/idnight-backend";

export default async function VenueDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireBackendSession();
  const [venues, accessPoints, operators, devices] = await Promise.all([
    fetchBackendVenues(session.accessToken),
    fetchBackendAccessPoints(session.accessToken),
    fetchBackendOperators(session.accessToken),
    fetchBackendDevices(session.accessToken),
  ]);
  const venue = venues.find((item) => item.id === id);

  if (!venue) {
    notFound();
  }

  const venueAccessPoints = accessPoints.filter((item) => item.venueId === venue.id);
  const venueOperators = operators.filter((item) => item.venueId === venue.id);
  const venueDevices = devices.filter((item) => item.venueId === venue.id);

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Detalle de local"
        title={venue.name}
        description="Resumen operativo de la sede usando la API administrativa real."
      />

      <div className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
        <Surface className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Fuente de datos</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Azure `/admin/venues`</h2>
            </div>
            <Badge label={venue.active ? "Activo" : "Inactivo"} tone={toneForLabel(venue.active ? "Activo" : "Inactivo")} />
          </div>
          <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            <ValuePair label="Venue ID" value={venue.id} />
            <ValuePair label="Nombre" value={venue.name} />
            <ValuePair label="Razón social" value={venue.legalName ?? "Sin razón social"} />
            <ValuePair label="Puertas" value={String(venueAccessPoints.length)} />
            <ValuePair label="Operadores" value={String(venueOperators.length)} />
            <ValuePair label="Dispositivos" value={String(venueDevices.length)} />
          </div>
        </Surface>

        <Surface className="p-6">
          <p className="text-sm font-medium text-slate-50">Qué muestra hoy la API</p>
          <div className="mt-5 space-y-4">
            {[
              `${venueAccessPoints.length} puertas asociadas`,
              `${venueOperators.length} operadores asociados`,
              `${venueDevices.length} dispositivos vinculados`,
              "Sin eventos activos modelados todavía",
            ].map((label) => (
              <div key={label} className="rounded-2xl border border-sky-400/15 bg-sky-400/8 p-4">
                <p className="text-sm font-medium text-sky-100">{label}</p>
              </div>
            ))}
          </div>
        </Surface>
      </div>
    </div>
  );
}
