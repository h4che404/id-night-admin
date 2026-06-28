import { Suspense } from "react";
import { SmartphoneCharging } from "lucide-react";

import { Badge, DataShell, DataTable, EmptyState, LoadingSkeleton, PaginationBar, SectionHeader } from "@/components/ui-kit";
import { VenueDeviceActions } from "@/components/venue-device-actions";
import { VenueDeviceForm } from "@/components/venue-device-form";
import { requireReadyPageAccess } from "@/lib/auth-session";
import { fetchVenueDevices } from "@/lib/idnight-backend";

function formatDateTime(value: string | null) {
  if (!value) {
    return "Sin actividad";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Sin actividad";
  }

  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

async function DevicesData({ token, venueName, page }: { token: string; venueName: string; page: number }) {
  let result: Awaited<ReturnType<typeof fetchVenueDevices>> = { items: [], total: 0, page, pageSize: 20 };
  let devicesError: string | null = null;
  try {
    result = await fetchVenueDevices(token, page);
  } catch (error) {
    devicesError = error instanceof Error ? error.message : "No se pudieron cargar los dispositivos autorizados.";
  }

  if (devicesError) {
    return (
      <EmptyState
        title="No se pudieron cargar los dispositivos"
        description={devicesError}
        icon={<SmartphoneCharging className="h-5 w-5 text-sky-300" />}
      />
    );
  }

  const devices = result.items;

  if (devices.length === 0) {
    return (
      <EmptyState
        title="Sin dispositivos autorizados"
        description="Registrá el primer dispositivo usando el formulario de arriba. Después vas a poder activarlo, desactivarlo o corregir sus datos básicos."
        icon={<SmartphoneCharging className="h-5 w-5 text-sky-300" />}
      />
    );
  }

  return (
    <div className="space-y-4">
      <DataShell
        title="Puerta y operación"
        subtitle={`${result.total} dispositivo${result.total === 1 ? "" : "s"} autorizado${result.total === 1 ? "" : "s"}`}
      >
        <DataTable
          columns={["Dispositivo", "Clave", "Estado", "Registrado", "Acciones"]}
          rows={devices.map((device) => (
            <tr key={device.id} className="align-top hover:bg-slate-950/20">
              <td className="px-5 py-4">
                <p className="font-medium text-slate-100">{device.name}</p>
              </td>
              <td className="px-5 py-4">
                <code className="rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-1.5 text-xs text-sky-100">
                  {device.deviceKey}
                </code>
              </td>
              <td className="px-5 py-4">
                <Badge
                  label={device.active ? "Activo" : "Inactivo"}
                  tone={device.active ? "success" : "warning"}
                />
              </td>
              <td className="px-5 py-4 text-sm text-slate-300">{formatDateTime(device.createdAt)}</td>
              <td className="px-5 py-4">
                <VenueDeviceActions
                  deviceId={device.id}
                  initialName={device.name}
                  initialDeviceKey={device.deviceKey}
                  active={device.active}
                />
              </td>
            </tr>
          ))}
        />
      </DataShell>
      <PaginationBar
        page={result.page}
        pageSize={result.pageSize}
        total={result.total}
        basePath="/venue/devices"
      />
    </div>
  );
}

export default async function VenueDevicesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const readyAccess = await requireReadyPageAccess();

  if (!readyAccess) {
    return null;
  }

  const { session, venueSummary: venue } = readyAccess;
  const p = parseInt((await searchParams).page ?? "1", 10);

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Dispositivos"
        title="Dispositivos autorizados"
        description={`Controlá qué tablets o teléfonos pueden operar en ${venue.name}. Cada dispositivo usa su clave autorizada para entrar a la operación de puerta.`}
      />

      <VenueDeviceForm />

      <Suspense fallback={<LoadingSkeleton />}>
        <DevicesData token={session.accessToken} venueName={venue.name} page={p} />
      </Suspense>
    </div>
  );
}
