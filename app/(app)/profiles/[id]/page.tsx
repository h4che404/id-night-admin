import { notFound } from "next/navigation";

import { Badge, SectionHeader, Surface, Timeline, ValuePair, toneForLabel } from "@/components/ui-kit";
import { accesses, alerts, auditTrail, findProfile, incidents } from "@/lib/data";
import { formatDate, formatShortDate } from "@/lib/utils";

export default async function ProfileDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = findProfile(id);

  if (!profile) {
    notFound();
  }

  const relatedAlerts = alerts.filter((alert) => alert.profile === profile.name);
  const relatedIncidents = incidents.filter((incident) => incident.profileName === profile.name);
  const relatedAccesses = accesses.filter((access) => access.person === profile.name);

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Detalle de perfil"
        title={profile.name}
        description="Identidad, verificacion, consentimiento, historial de accesos e incidencias asociados al perfil."
      />

      <div className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
        <Surface className="p-6">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-18 w-18 items-center justify-center rounded-3xl border border-slate-800 bg-slate-950/40 text-2xl font-semibold text-sky-100">
                {profile.name
                  .split(" ")
                  .map((word) => word[0])
                  .join("")
                  .slice(0, 2)}
              </div>
              <div>
                <p className="text-sm text-slate-400">Perfil de identidad</p>
                <h2 className="mt-1 text-2xl font-semibold text-white">{profile.documentMasked}</h2>
              </div>
            </div>
            <Badge label={profile.verification} tone={toneForLabel(profile.verification)} />
          </div>
          <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            <ValuePair label="Alta" value={formatShortDate(profile.enrolledAt)} />
            <ValuePair label="Consentimiento" value={profile.consentAccepted ? "Aceptado" : "Pendiente"} />
            <ValuePair label="Ultima sede" value={profile.recentVenue} />
            <ValuePair label="Acceso reciente" value={<Badge label={profile.recentAccessResult} tone={toneForLabel(profile.recentAccessResult)} />} />
            <ValuePair label="Alertas vigentes" value={`${profile.alerts}`} />
            <ValuePair label="Incidentes asociados" value={`${profile.incidents}`} />
          </div>
        </Surface>

        <Surface className="p-6">
          <p className="text-sm font-medium text-slate-50">Riesgo operativo visible</p>
          <div className="mt-5 space-y-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/25 p-4">
              <p className="text-sm font-medium text-slate-100">Alertas vigentes</p>
              <p className="mt-2 text-sm text-slate-400">{relatedAlerts.length > 0 ? `${relatedAlerts.length} activas` : "Sin alertas activas"}</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/25 p-4">
              <p className="text-sm font-medium text-slate-100">Requiere supervision</p>
              <p className="mt-2 text-sm text-slate-400">{profile.verification === "En revision" || profile.verification === "Suspendido" ? "Si" : "No"}</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/25 p-4">
              <p className="text-sm font-medium text-slate-100">Datos minimizados</p>
              <p className="mt-2 text-sm text-slate-400">Documento enmascarado y contexto visible solo para decision operativa.</p>
            </div>
          </div>
        </Surface>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <Surface className="p-6">
          <p className="text-sm font-medium text-slate-50">Accesos recientes</p>
          <div className="mt-5 space-y-4">
            {relatedAccesses.map((access) => (
              <div key={access.id} className="rounded-2xl border border-slate-800 bg-slate-950/25 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium text-slate-100">{access.venue} · {access.gate}</p>
                  <Badge label={access.result} tone={toneForLabel(access.result)} />
                </div>
                <p className="mt-2 text-sm text-slate-400">{access.reason}</p>
                <p className="mt-3 text-xs uppercase tracking-[0.16em] text-slate-500">{formatDate(access.timestamp)}</p>
              </div>
            ))}
          </div>
        </Surface>

        <Surface className="p-6">
          <p className="text-sm font-medium text-slate-50">Incidentes y alertas</p>
          <div className="mt-5 space-y-4">
            {relatedIncidents.map((incident) => (
              <div key={incident.id} className="rounded-2xl border border-slate-800 bg-slate-950/25 p-4">
                <div className="flex items-center justify-between gap-3">
                  <Badge label={incident.severity} tone={toneForLabel(incident.severity)} />
                  <Badge label={incident.status} tone={toneForLabel(incident.status)} />
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-300">{incident.summary}</p>
              </div>
            ))}
            {relatedAlerts.map((alert) => (
              <div key={alert.id} className="rounded-2xl border border-slate-800 bg-slate-950/25 p-4">
                <Badge label={alert.level} tone={toneForLabel(alert.level)} />
                <p className="mt-3 text-sm leading-6 text-slate-300">{alert.reason}</p>
              </div>
            ))}
          </div>
        </Surface>
      </div>

      <Surface className="p-6">
        <p className="text-sm font-medium text-slate-50">Trazabilidad reciente</p>
        <div className="mt-6">
          <Timeline
            items={auditTrail.map((event) => ({
              title: event.action,
              description: `${event.actor} · ${event.entity} · ${event.device}`,
              meta: formatDate(event.at),
              tone: toneForLabel(event.outcome),
            }))}
          />
        </div>
      </Surface>
    </div>
  );
}
