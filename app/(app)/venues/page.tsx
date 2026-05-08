import Link from "next/link";

import { ActionLink, Badge, DataShell, DataTable, FilterChip, SectionHeader, Surface, toneForLabel } from "@/components/ui-kit";
import { requireBackendSession } from "@/lib/auth-session";
import { fetchBackendVenues } from "@/lib/idnight-backend";

export default async function VenuesPage() {
  const session = await requireBackendSession();
  const venues = await fetchBackendVenues(session.accessToken);

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Locales"
        title="Gestion de venues conectada a Azure"
        description="Esta vista ya consume el endpoint real `/venues` del backend publicado. El detalle profundo todavia depende de endpoints admin que no existen en Azure."
        action={venues[0] ? <ActionLink href={`/venues/${venues[0].id}`} label="Abrir primer venue" /> : undefined}
      />

      <div className="grid gap-4 lg:grid-cols-4">
        <Surface className="p-5">
          <p className="text-sm text-slate-400">Locales visibles</p>
          <p className="mt-3 text-3xl font-semibold text-white">{venues.length}</p>
        </Surface>
        <Surface className="p-5">
          <p className="text-sm text-slate-400">Partners verificados</p>
          <p className="mt-3 text-3xl font-semibold text-white">{venues.filter((venue) => venue.verifiedPartner).length}</p>
        </Surface>
        <Surface className="p-5">
          <p className="text-sm text-slate-400">Fuente</p>
          <p className="mt-3 text-3xl font-semibold text-white">Azure</p>
        </Surface>
        <Surface className="p-5">
          <p className="text-sm text-slate-400">Cobertura detalle</p>
          <p className="mt-3 text-3xl font-semibold text-white">Parcial</p>
        </Surface>
      </div>

      <DataShell
        title="Directorio de locales"
        subtitle="Respuesta real del backend. La capa admin preserva filtros y tabla aunque el contrato actual sea todavia chico."
        filters={
          <>
            <FilterChip label="Azure live" active />
            <FilterChip label="Partners verificados" />
            <FilterChip label="Detalle parcial" />
          </>
        }
      >
        <DataTable
          columns={["Local", "Direccion", "Estado", "Fuente", "Detalle"]}
          rows={venues.map((venue) => (
            <tr key={venue.id} className="hover:bg-slate-950/20">
              <td className="px-5 py-4">
                <p className="font-medium text-slate-100">{venue.name}</p>
                <p className="mt-1 text-sm text-slate-500">{venue.id}</p>
              </td>
              <td className="px-5 py-4 text-sm text-slate-300">{venue.address}</td>
              <td className="px-5 py-4">
                <Badge
                  label={venue.verifiedPartner ? "Partner verificado" : "Sin verificar"}
                  tone={toneForLabel(venue.verifiedPartner ? "Verificado" : "Pendiente")}
                />
              </td>
              <td className="px-5 py-4 text-sm text-slate-300">Azure `/venues`</td>
              <td className="px-5 py-4 text-sm text-sky-300">
                <Link href={`/venues/${venue.id}`}>Abrir detalle</Link>
              </td>
            </tr>
          ))}
        />
      </DataShell>
    </div>
  );
}
