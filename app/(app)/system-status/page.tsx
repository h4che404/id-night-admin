import { AlertTriangle, ServerCrash, ShieldCheck } from "lucide-react";

import { Badge, EmptyState, SectionHeader, Surface, toneForLabel } from "@/components/ui-kit";
import { requireBackendSession } from "@/lib/auth-session";
import { fetchBackendHealth, fetchBackendSnapshot, fetchBackendSystemHealth, IDNIGHT_BACKEND_URL } from "@/lib/idnight-backend";

export default async function SystemStatusPage() {
  const session = await requireBackendSession();
  const [health, snapshot, adminHealth] = await Promise.all([
    fetchBackendHealth(),
    fetchBackendSnapshot(session.accessToken),
    fetchBackendSystemHealth(session.accessToken),
  ]);

  const services = [
    {
      name: "Azure App Service",
      status: health.status,
      detail: "Validado contra /actuator/health en el host publicado.",
      latency: "Health endpoint",
    },
    {
      name: "Autenticacion JWT admin",
      status: snapshot.me ? "Operativo" : "Pendiente",
      detail: snapshot.me
        ? `Sesion validada para ${snapshot.me.email}.`
        : "No se pudo validar la sesion actual.",
      latency: "GET /admin/me",
    },
    {
      name: "Catalogo de venues",
      status: snapshot.venues.length > 0 ? "Operativo" : "Pendiente",
      detail: snapshot.venues.length > 0
        ? `${snapshot.venues.length} venues recuperados desde Azure.`
        : "Sin venues en respuesta o endpoint no accesible.",
      latency: "GET /admin/venues",
    },
    {
      name: "Dominio administrativo",
      status: adminHealth.status,
      detail: `${adminHealth.operators} operadores, ${adminHealth.devices} dispositivos, ${adminHealth.auditLogs} eventos de auditoria.`,
      latency: "GET /admin/system/health",
    },
  ];

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Estado del sistema"
        title="Salud real del backend Azure"
        description="Esta vista ya consume la healthcheck pública y la superficie administrativa autenticada del backend publicado."
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Surface className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Backend core</p>
              <p className="mt-3 text-3xl font-semibold text-white">{health.status}</p>
            </div>
            <ShieldCheck className="h-5 w-5 text-emerald-300" />
          </div>
        </Surface>
        <Surface className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Host activo</p>
              <p className="mt-3 text-lg font-semibold text-white">Azure</p>
            </div>
            <AlertTriangle className="h-5 w-5 text-sky-300" />
          </div>
        </Surface>
        <Surface className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Admin API</p>
              <p className="mt-3 text-lg font-semibold text-white">{adminHealth.status}</p>
            </div>
            <ServerCrash className="h-5 w-5 text-amber-300" />
          </div>
        </Surface>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        <Surface className="p-6">
          <p className="text-sm font-medium text-slate-50">Servicios y contratos validados</p>
          <div className="mt-5 space-y-4">
            {services.map((service) => (
              <div key={service.name} className="rounded-2xl border border-slate-800 bg-slate-950/25 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium text-slate-100">{service.name}</p>
                  <Badge label={service.status} tone={toneForLabel(service.status)} />
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-400">{service.detail}</p>
                <p className="mt-3 text-xs uppercase tracking-[0.16em] text-slate-500">{service.latency}</p>
              </div>
            ))}
          </div>
        </Surface>

        <div className="space-y-6">
          <Surface className="p-6">
            <p className="text-sm font-medium text-slate-50">Endpoint base</p>
            <p className="mt-3 break-all text-sm leading-6 text-slate-300">{IDNIGHT_BACKEND_URL}</p>
            <p className="mt-4 text-sm leading-6 text-slate-400">
              El frontend entra por proxy server-side porque la instancia Azure no publica cabeceras CORS para este panel.
            </p>
          </Surface>

          <EmptyState
            title="Sistema administrativo validado"
            description={`La healthcheck responde ${health.status} y la foto administrativa actual devuelve ${adminHealth.alerts} alertas y ${adminHealth.accessSessions} accesos.`}
          />
        </div>
      </div>
    </div>
  );
}
