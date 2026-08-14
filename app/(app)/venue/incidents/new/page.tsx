import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { SectionHeader } from "@/components/ui-kit";
import { VenueIncidentForm } from "@/components/venue-incident-form";
import { requireReadyPageAccess } from "@/lib/auth-session";
import { fetchVenueEvents } from "@/lib/idnight-backend";

export default async function NewVenueIncidentPage() {
  const readyAccess = await requireReadyPageAccess();

  if (!readyAccess) {
    return null;
  }

  const { session } = readyAccess;

  // The event link is optional (task 9.6): the picker degrades to a plain title/description
  // form rather than failing the whole page if the events list cannot be loaded.
  let events: Array<{ id: string; name: string }> = [];
  try {
    events = (await fetchVenueEvents(session.accessToken)).items;
  } catch (error) {
    console.error("[incident-new] failed to load venue events for the event picker", error);
  }

  return (
    <div className="space-y-6">
      <Link
        href="/venue/incidents"
        className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a incidentes
      </Link>

      <SectionHeader
        eyebrow="Incidentes"
        title="Nuevo incidente"
        description="Registrá un incidente para dejar constancia. Podés vincular a una persona más adelante desde su detalle."
      />

      <VenueIncidentForm events={events} />
    </div>
  );
}
