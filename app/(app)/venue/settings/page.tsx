import { requireReadyPageAccess } from "@/lib/auth-session";
import { SectionHeader, Surface } from "@/components/ui-kit";
import { VenueSettingsForm } from "@/components/venue-settings-form";

export default async function VenueSettingsPage() {
  const readyAccess = await requireReadyPageAccess();

  if (!readyAccess) {
    return null;
  }

  const { venueSummary: venue } = readyAccess;

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Configuración"
        title="Configuración del boliche"
        description="Editá los datos principales de tu boliche."
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
    </div>
  );
}
