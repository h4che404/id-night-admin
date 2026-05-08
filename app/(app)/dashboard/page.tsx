import Link from "next/link";
import { Activity, AlertTriangle, DatabaseZap, ShieldCheck, Siren, Users2 } from "lucide-react";

import { requireBackendSession } from "@/lib/auth-session";
import { fetchBackendSnapshot, IDNIGHT_BACKEND_URL } from "@/lib/idnight-backend";
import { formatDate } from "@/lib/utils";
import {
  ActionLink,
  Badge,
  MetricCard,
  SectionHeader,
  Surface,
  Timeline,
  toneForLabel,
} from "@/components/ui-kit";

export default async function DashboardPage() {
  const session = await requireBackendSession();
  const snapshot = await fetchBackendSnapshot(session.accessToken);

  const liveStats = [
    {
      label: "Venues disponibles",
      value: String(snapshot.venues.length),
      delta: snapshot.health?.status ?? "Sin health",
      tone: toneForLabel(snapshot.health?.status ?? "Pendiente"),
    },
    {
      label: "Operadores",
      value: String(snapshot.operators.length),
      delta: snapshot.operators.length > 0 ? "Directorio cargado" : "Sin operadores",
      tone: snapshot.operators.length > 0 ? "success" : "warning",
    },
    {
      label: "Incidentes",
      value: String(snapshot.incidents.length),
      delta: snapshot.incidents.length > 0 ? "Con actividad" : "Sin incidentes",
      tone: snapshot.incidents.length > 0 ? "warning" : "success",
    },
    {
      label: "Alertas",
      value: String(snapshot.alerts.length),
      delta: snapshot.alerts.length > 0 ? "Seguimiento activo" : "Sin alertas",
      tone: snapshot.alerts.length > 0 ? "warning" : "success",
    },
  ] as const;

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Centro de comando"
        title="Operacion general y cobertura backend"
        description="Este dashboard ya vive sobre la API administrativa real en Azure. Los datos salen del dominio operativo actual, sin vender humo."
        action={<ActionLink href="/system-status" label="Ver estado backend" />}
      />

      <Surface className="p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Badge label="Azure conectado" tone="success" />
            <p className="mt-4 text-2xl font-semibold text-white">Backend administrativo validado en App Service</p>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
              Base URL activa: {IDNIGHT_BACKEND_URL}. Auth admin, venues, operadores, dispositivos, accesos,
              incidentes, alertas y auditoria ya salen del backend publicado.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950/25 px-4 py-3 text-sm text-slate-300">
            Health actual: <span className="font-medium text-white">{snapshot.health?.status ?? "No disponible"}</span>
          </div>
        </div>
      </Surface>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {liveStats.map((stat) => (
          <MetricCard key={stat.label} label={stat.label} value={stat.value} delta={stat.delta} tone={stat.tone} />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
        <Surface className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-50">Datos live del backend</p>
              <p className="mt-1 text-sm text-slate-400">Lo que hoy existe de verdad en Azure para esta sesion administrativa.</p>
            </div>
            <DatabaseZap className="h-5 w-5 text-slate-600" />
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/25 p-4">
              <p className="text-sm font-medium text-slate-100">Operador autenticado</p>
              <p className="mt-3 text-lg font-semibold text-white">{snapshot.me?.fullName ?? "Sin operador"}</p>
              <p className="mt-2 text-sm text-slate-400">{snapshot.me?.email ?? "No disponible"}</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/25 p-4">
              <p className="text-sm font-medium text-slate-100">Rol y contexto</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge label={snapshot.me?.role ?? "N/D"} tone="info" />
                <Badge label={snapshot.me?.venueName ?? "Sin sede"} tone="success" />
              </div>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/25 p-4 md:col-span-2">
              <p className="text-sm font-medium text-slate-100">Venues disponibles</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {snapshot.venues.map((venue) => (
                  <Link key={venue.id} href="/venues" className="rounded-full border border-slate-700 bg-slate-950/40 px-3 py-2 text-sm text-slate-300">
                    {venue.name}
                  </Link>
                ))}
                {snapshot.venues.length === 0 ? <p className="text-sm text-slate-500">No se pudieron recuperar venues.</p> : null}
              </div>
            </div>
          </div>
        </Surface>

        <Surface className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-50">Cobertura operativa live</p>
              <p className="mt-1 text-sm text-slate-400">Conteos reales del backend administrativo.</p>
            </div>
            <Siren className="h-5 w-5 text-slate-600" />
          </div>
          <div className="mt-6 space-y-3">
            {[
              ["Access points", String(snapshot.accessPoints.length)],
              ["Dispositivos", String(snapshot.devices.length)],
              ["Perfiles", String(snapshot.profiles.length)],
              ["Accesos", String(snapshot.accesses.length)],
              ["Auditoria", String(snapshot.audit.length)],
            ].map(([item, value]) => (
              <div key={item} className="rounded-2xl border border-sky-400/15 bg-sky-400/8 p-4 text-sm text-sky-100">
                {item}: {value}
              </div>
            ))}
          </div>
        </Surface>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_1fr_1fr]">
        <Surface className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-50">Accesos globales recientes</p>
              <p className="mt-1 text-sm text-slate-400">Respuesta real de `/admin/access-sessions`.</p>
            </div>
            <Activity className="h-5 w-5 text-slate-600" />
          </div>
          <div className="mt-6 space-y-4">
            {snapshot.accesses.length === 0 ? (
              <div className="rounded-2xl border border-slate-800 bg-slate-950/25 p-4 text-sm text-slate-400">
                Todavía no hay accesos globales en la instancia Azure.
              </div>
            ) : (
              snapshot.accesses.slice(0, 4).map((access) => (
                <div key={access.id} className="rounded-2xl border border-slate-800 bg-slate-950/25 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-slate-100">{access.personName} · {access.venueName}</p>
                    <Badge label={access.result} tone={toneForLabel(access.result)} />
                  </div>
                  <p className="mt-2 text-sm text-slate-400">{access.accessPointName} · {access.operatorName}</p>
                  <p className="mt-3 text-sm text-slate-400">{formatDate(access.occurredAt)}</p>
                </div>
              ))
            )}
          </div>
        </Surface>

        <Surface className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-50">Incidentes globales</p>
              <p className="mt-1 text-sm text-slate-400">Cola real de incidentes administrativos.</p>
            </div>
            <AlertTriangle className="h-5 w-5 text-slate-600" />
          </div>
          <div className="mt-6 space-y-4">
            {snapshot.incidents.length === 0 ? (
              <div className="rounded-2xl border border-slate-800 bg-slate-950/25 p-4 text-sm text-slate-400">
                Sin incidentes en esta instancia de prueba.
              </div>
            ) : (
              snapshot.incidents.slice(0, 4).map((incident) => (
                <div key={incident.id} className="rounded-2xl border border-slate-800 bg-slate-950/25 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <Badge label={incident.severity} tone={toneForLabel(incident.severity)} />
                    <Badge label={incident.status} tone={toneForLabel(incident.status)} />
                  </div>
                  <p className="mt-3 text-sm text-slate-300">{incident.venueName} · {incident.profileName}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.16em] text-slate-500">{formatDate(incident.createdAt)}</p>
                </div>
              ))
            )}
          </div>
        </Surface>

        <Surface className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-50">Bitácora administrativa</p>
              <p className="mt-1 text-sm text-slate-400">Timeline real de `/admin/audit`.</p>
            </div>
            <Users2 className="h-5 w-5 text-slate-600" />
          </div>
          <div className="mt-6">
            <Timeline
              items={snapshot.audit.slice(0, 8).map((event) => ({
                title: event.action,
                description: `${event.actor} · ${event.entity ?? "Sin target"} · ${event.venueName ?? "Sin sede"}`,
                meta: formatDate(event.occurredAt),
                tone: toneForLabel(event.action),
              }))}
            />
          </div>
        </Surface>
      </div>

      <Surface className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-50">Incidentes priorizados</p>
            <p className="mt-1 text-sm text-slate-400">Atajos rápidos al detalle real del incidente.</p>
          </div>
          <Badge label="Backend live" tone="success" />
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {snapshot.incidents.slice(0, 3).map((incident) => (
            <Link
              key={incident.id}
              href={`/incidents/${incident.id}`}
              className="block rounded-2xl border border-slate-800 bg-slate-950/25 p-4 transition hover:border-slate-700"
            >
              <div className="flex items-center justify-between gap-3">
                <Badge label={incident.severity} tone={toneForLabel(incident.severity)} />
                <span className="text-xs uppercase tracking-[0.16em] text-slate-500">{formatDate(incident.createdAt)}</span>
              </div>
              <p className="mt-3 font-medium text-slate-100">{incident.summary}</p>
              <p className="mt-2 text-sm leading-6 text-slate-400">{incident.venueName} · {incident.profileName}</p>
            </Link>
          ))}
        </div>
      </Surface>
    </div>
  );
}
