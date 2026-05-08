import Link from "next/link";

import { Badge, DataShell, DataTable, FilterChip, SectionHeader, Surface, toneForLabel } from "@/components/ui-kit";
import { requireBackendSession } from "@/lib/auth-session";
import { fetchBackendProfiles } from "@/lib/idnight-backend";
import { formatShortDate } from "@/lib/utils";

export default async function ProfilesPage() {
  const session = await requireBackendSession();
  const profiles = await fetchBackendProfiles(session.accessToken);

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Perfiles de identidad"
        title="Usuarios enrolados y estado de validacion"
        description="Busqueda por nombre y estado, con foco en mayoria de edad verificada, alertas e historial operativo asociado."
      />

      <div className="grid gap-4 lg:grid-cols-5">
        <Surface className="p-5">
          <p className="text-sm text-slate-400">Verificados</p>
          <p className="mt-3 text-3xl font-semibold text-white">{profiles.filter((profile) => profile.verification === "VERIFIED").length}</p>
        </Surface>
        <Surface className="p-5">
          <p className="text-sm text-slate-400">Pendientes</p>
          <p className="mt-3 text-3xl font-semibold text-white">{profiles.filter((profile) => profile.verification === "PENDING").length}</p>
        </Surface>
        <Surface className="p-5">
          <p className="text-sm text-slate-400">Rechazados</p>
          <p className="mt-3 text-3xl font-semibold text-white">{profiles.filter((profile) => profile.verification === "REJECTED").length}</p>
        </Surface>
        <Surface className="p-5">
          <p className="text-sm text-slate-400">Con alertas</p>
          <p className="mt-3 text-3xl font-semibold text-white">{profiles.filter((profile) => profile.alerts > 0).length}</p>
        </Surface>
        <Surface className="p-5">
          <p className="text-sm text-slate-400">Consentimiento al dia</p>
          <p className="mt-3 text-3xl font-semibold text-white">
            {profiles.length === 0 ? "0%" : `${Math.round((profiles.filter((profile) => profile.consentAccepted).length / profiles.length) * 100)}%`}
          </p>
        </Surface>
      </div>

      <DataShell
        title="Base de perfiles"
        subtitle="Minimo dato visible para revisar la identidad sin perder auditabilidad."
        filters={
          <>
            <FilterChip label="Verificados" active />
            <FilterChip label="Pendientes" />
            <FilterChip label="Con alertas" />
          </>
        }
      >
        <DataTable
          columns={["Perfil", "Documento", "Estado", "Alta", "Alertas", "Incidentes", "Ultimo acceso", "Detalle"]}
          rows={profiles.map((profile) => (
            <tr key={profile.id} className="hover:bg-slate-950/20">
              <td className="px-5 py-4">
                <p className="font-medium text-slate-100">{profile.name}</p>
                <p className="mt-1 text-sm text-slate-500">{profile.recentVenue}</p>
              </td>
              <td className="px-5 py-4 text-sm text-slate-300">{profile.documentMasked}</td>
              <td className="px-5 py-4">
                <Badge label={profile.verification} tone={toneForLabel(profile.verification)} />
              </td>
              <td className="px-5 py-4 text-sm text-slate-300">{formatShortDate(profile.enrolledAt)}</td>
              <td className="px-5 py-4 text-sm text-slate-300">{profile.alerts}</td>
              <td className="px-5 py-4 text-sm text-slate-300">{profile.incidents}</td>
              <td className="px-5 py-4">
                <Badge label={profile.recentAccessResult} tone={toneForLabel(profile.recentAccessResult)} />
              </td>
              <td className="px-5 py-4 text-sm text-sky-300">
                <Link href={`/profiles/${profile.id}`}>Abrir detalle</Link>
              </td>
            </tr>
          ))}
        />
      </DataShell>
    </div>
  );
}
