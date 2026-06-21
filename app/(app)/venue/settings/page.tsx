import { requireBackendSession } from "@/lib/auth-session";
import { fetchMyVenue } from "@/lib/idnight-backend";
import { SectionHeader, Surface, EmptyState } from "@/components/ui-kit";
import { VenueSettingsForm } from "@/components/venue-settings-form";
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
