import { Badge, FilterChip, SectionHeader, Surface } from "@/components/ui-kit";

const settingGroups = [
  {
    title: "Reglas del local",
    items: ["Mayoria de edad obligatoria", "Revision manual ante alerta warning", "Escalado supervisor en critica"],
  },
  {
    title: "Alertas y vigencia",
    items: ["Alerta informativa: 72h", "Warning: 14 dias", "Critica: 30 dias o cierre manual"],
  },
  {
    title: "Notificaciones",
    items: ["Resumen previo al evento", "Aviso de dispositivos offline", "Escalado inmediato para incidentes criticos"],
  },
];

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Configuracion"
        title="Parametros y reglas del sistema"
        description="Ajustes operativos del local, politicas basicas, accesos, branding y notificaciones con estructura clara y auditable."
      />

      <div className="flex flex-wrap gap-2">
        <FilterChip label="Reglas" active />
        <FilterChip label="Alertas" />
        <FilterChip label="Accesos" />
        <FilterChip label="Notificaciones" />
        <FilterChip label="Branding" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <div className="space-y-6">
          {settingGroups.map((group) => (
            <Surface key={group.title} className="p-6">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-50">{group.title}</p>
                <Badge label="Editable" tone="info" />
              </div>
              <div className="mt-5 space-y-3">
                {group.items.map((item) => (
                  <div key={item} className="rounded-2xl border border-slate-800 bg-slate-950/25 p-4 text-sm text-slate-300">
                    {item}
                  </div>
                ))}
              </div>
            </Surface>
          ))}
        </div>

        <Surface className="p-6">
          <p className="text-sm font-medium text-slate-50">Politica visual</p>
          <div className="mt-5 space-y-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/25 p-4">
              <p className="text-sm font-medium text-slate-100">Acento funcional</p>
              <p className="mt-2 text-sm text-slate-400">Cian para navegacion, acciones primarias y foco. Nunca decorativo.</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/25 p-4">
              <p className="text-sm font-medium text-slate-100">Estados inequívocos</p>
              <p className="mt-2 text-sm text-slate-400">Verde, ambar y rojo combinados con texto y badges para no depender solo del color.</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/25 p-4">
              <p className="text-sm font-medium text-slate-100">Guardado y feedback</p>
              <p className="mt-2 text-sm text-slate-400">El sistema usa confirmaciones sobrias y estados visibles de cambio.</p>
            </div>
          </div>
        </Surface>
      </div>
    </div>
  );
}
