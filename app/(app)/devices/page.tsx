import { Badge, DataShell, DataTable, FilterChip, SectionHeader, Surface, toneForLabel } from "@/components/ui-kit";
import { devices } from "@/lib/data";
import { formatDate } from "@/lib/utils";

export default function DevicesPage() {
  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Dispositivos"
        title="Tablets y equipos registrados"
        description="Estado, sincronizacion, version de app y capacidad de bloqueo o revision sobre el parque operativo."
      />

      <div className="grid gap-4 lg:grid-cols-4">
        <Surface className="p-5">
          <p className="text-sm text-slate-400">Online</p>
          <p className="mt-3 text-3xl font-semibold text-white">11</p>
        </Surface>
        <Surface className="p-5">
          <p className="text-sm text-slate-400">Atencion</p>
          <p className="mt-3 text-3xl font-semibold text-white">2</p>
        </Surface>
        <Surface className="p-5">
          <p className="text-sm text-slate-400">Offline</p>
          <p className="mt-3 text-3xl font-semibold text-white">1</p>
        </Surface>
        <Surface className="p-5">
          <p className="text-sm text-slate-400">Version actual</p>
          <p className="mt-3 text-3xl font-semibold text-white">v0.9.4</p>
        </Surface>
      </div>

      <DataShell
        title="Inventario de dispositivos"
        subtitle="Seguimiento tecnico sin perder el contexto del local y la puerta asignada."
        filters={
          <>
            <FilterChip label="Online" active />
            <FilterChip label="Offline" />
            <FilterChip label="Desactualizados" />
          </>
        }
      >
        <DataTable
          columns={["Dispositivo", "Local", "Puerta", "Estado", "Ultima sincronizacion", "Version", "Bateria"]}
          rows={devices.map((device) => (
            <tr key={device.id} className="hover:bg-slate-950/20">
              <td className="px-5 py-4 font-medium text-slate-100">{device.name}</td>
              <td className="px-5 py-4 text-sm text-slate-300">{device.venue}</td>
              <td className="px-5 py-4 text-sm text-slate-300">{device.accessPoint}</td>
              <td className="px-5 py-4">
                <Badge label={device.status} tone={toneForLabel(device.status)} />
              </td>
              <td className="px-5 py-4 text-sm text-slate-300">{formatDate(device.syncAt)}</td>
              <td className="px-5 py-4 text-sm text-slate-300">{device.appVersion}</td>
              <td className="px-5 py-4 text-sm text-slate-300">{device.battery}</td>
            </tr>
          ))}
        />
      </DataShell>
    </div>
  );
}
