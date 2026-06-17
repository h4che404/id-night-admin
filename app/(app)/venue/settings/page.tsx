import { requireBackendSession } from "@/lib/auth-session";
import { fetchMyVenue, fetchMyVenueEntryRules } from "@/lib/idnight-backend";
import { SectionHeader, Surface, EmptyState } from "@/components/ui-kit";
import { VenueSettingsForm } from "@/components/venue-settings-form";
import { VenueEntryRulesForm } from "@/components/venue-entry-rules-form";
import { Settings2 } from "lucide-react";

export default async function VenueSettingsPage() {
  const session = await requireBackendSession();

  let venue = null;
  try {
    venue = await fetchMyVenue(session.accessToken);
  } catch {
    venue = null;
  }

  if (!venue) {
    return (
      <div className="space-y-6">
        <SectionHeader
          eyebrow="Configuración"
          title="Configuración del boliche"
          description="Primero necesitás crear tu boliche desde el panel principal."
        />
        <EmptyState
          title="Sin boliche configurado"
          description="Volvé al panel principal para crear tu boliche antes de modificar su configuración."
          icon={<Settings2 className="h-5 w-5 text-sky-300" />}
        />
      </div>
    );
  }

  let entryRules = null;
  let entryRulesError: string | null = null;

  try {
    entryRules = await fetchMyVenueEntryRules(session.accessToken);
  } catch (error) {
    entryRulesError = error instanceof Error
      ? error.message
      : "No se pudieron cargar los requisitos de ingreso.";
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Configuración"
        title="Configuración del boliche"
        description="Editá los datos principales y los requisitos operativos de ingreso de tu boliche."
      />

      <Surface className="p-6 md:p-8">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-white">Datos generales</h2>
          <p className="mt-1 text-sm text-slate-400">Actualizá nombre, dirección y ciudad.</p>
        </div>
        <VenueSettingsForm
          initialName={venue.name}
          initialAddress={venue.address ?? ""}
          initialCity={venue.city ?? ""}
        />
      </Surface>

      <Surface className="p-6 md:p-8">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-white">Requisitos de ingreso</h2>
          <p className="mt-1 text-sm text-slate-400">
            Definí las validaciones mínimas y las instrucciones operativas para el equipo de seguridad.
          </p>
        </div>
        {entryRules ? (
          <VenueEntryRulesForm initialRules={entryRules} />
        ) : (
          <EmptyState
            title="No se pudieron cargar los requisitos de ingreso"
            description={entryRulesError ?? "Intentá de nuevo más tarde. Mientras tanto podés seguir editando los datos generales del boliche."}
            icon={<Settings2 className="h-5 w-5 text-sky-300" />}
          />
        )}
      </Surface>
    </div>
  );
}
