import { Badge, DataShell, DataTable, FilterChip, SectionHeader, Surface, toneForLabel } from "@/components/ui-kit";
import { requireBackendSession } from "@/lib/auth-session";
import { fetchBackendDevices } from "@/lib/idnight-backend";
import { formatDate } from "@/lib/utils";

export default async function DevicesPage() {
  const session = await requireBackendSession();
  const devices = await fetchBackendDevices(session.accessToken);

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Dispositivos"
        title="Tablets y equipos registrados"
        description="Estado, última actividad y vinculación operativa del parque de dispositivos."
      />

      <div className="grid gap-4 lg:grid-cols-4">
        <Surface className="p-5">
          <p className="text-sm text-slate-400">Online</p>
          <p className="mt-3 text-3xl font-semibold text-white">{devices.filter((item) => item.status === "Online").length}</p>
        </Surface>
        <Surface className="p-5">
          <p className="text-sm text-slate-400">Atencion</p>
          <p className="mt-3 text-3xl font-semibold text-white">{devices.filter((item) => item.status === "Atencion").length}</p>
        </Surface>
        <Surface className="p-5">
          <p className="text-sm text-slate-400">Offline</p>
          <p className="mt-3 text-3xl font-semibold text-white">{devices.filter((item) => item.status === "Offline").length}</p>
        </Surface>
        <Surface className="p-5">
          <p className="text-sm text-slate-400">Version actual</p>
          <p className="mt-3 text-3xl font-semibold text-white">N/D</p>
        </Surface>
      </div>

      <DataShell
        title="Inventario de dispositivos"
        subtitle="Seguimiento tecnico sin perder el contexto del local y la puerta asociada."
        filters={
          <>
            <FilterChip label="Online" active />
            <FilterChip label="Offline" />
            <FilterChip label="Atencion" />
          </>
        }
      >
        <DataTable
          columns={["Dispositivo", "Local", "Puerta", "Estado", "Ultima sincronizacion", "Version", "Bateria"]}
          rows={devices.map((device) => (
            <tr key={device.id} className="hover:bg-slate-950/20">
              <td className="px-5 py-4 font-medium text-slate-100">{device.name}</td>
              <td className="px-5 py-4 text-sm text-slate-300">{device.venueName}</td>
              <td className="px-5 py-4 text-sm text-slate-300">{device.accessPointName}</td>
              <td className="px-5 py-4">
                <Badge label={device.status} tone={toneForLabel(device.status)} />
              </td>
              <td className="px-5 py-4 text-sm text-slate-300">{device.syncAt ? formatDate(device.syncAt) : "Sin actividad"}</td>
              <td className="px-5 py-4 text-sm text-slate-300">{device.appVersion}</td>
              <td className="px-5 py-4 text-sm text-slate-300">{device.battery}</td>
            </tr>
          ))}
        />
      </DataShell>
    </div>
  );
}
