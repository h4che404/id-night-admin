import { SmartphoneCharging } from "lucide-react";

import { Badge, DataShell, DataTable, EmptyState, SectionHeader } from "@/components/ui-kit";
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

export default async function VenueDevicesPage() {
  const readyAccess = await requireReadyPageAccess();

  if (!readyAccess) {
    return null;
  }

  const { session, venueSummary: venue } = readyAccess;

  let devices: Awaited<ReturnType<typeof fetchVenueDevices>> = [];
  let devicesError: string | null = null;
  try {
    devices = await fetchVenueDevices(session.accessToken);
  } catch (error) {
    devicesError = error instanceof Error ? error.message : "No se pudieron cargar los dispositivos autorizados.";
  }


  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Dispositivos"
        title="Dispositivos autorizados"
        description={`Controlá qué tablets o teléfonos pueden operar en ${venue.name}. Cada dispositivo usa su clave autorizada para entrar a la operación de puerta.`}
      />

      <VenueDeviceForm />

      {devicesError ? (
        <EmptyState
          title="No se pudieron cargar los dispositivos"
          description={devicesError}
          icon={<SmartphoneCharging className="h-5 w-5 text-sky-300" />}
        />
      ) : devices.length === 0 ? (
        <EmptyState
          title="Sin dispositivos autorizados"
          description="Registrá el primer dispositivo usando el formulario de arriba. Después vas a poder activarlo, desactivarlo o corregir sus datos básicos."
          icon={<SmartphoneCharging className="h-5 w-5 text-sky-300" />}
        />
      ) : (
        <DataShell
          title="Puerta y operación"
          subtitle={`${devices.length} dispositivo${devices.length === 1 ? "" : "s"} autorizado${devices.length === 1 ? "" : "s"}`}
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
      )}
    </div>
  );
}
