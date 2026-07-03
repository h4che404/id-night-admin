import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { EventDetailTabs } from "@/components/event-detail-tabs";
import { Badge } from "@/components/ui-kit";
import { requireReadyPageAccess } from "@/lib/auth-session";
import { findVenueEventById, type BackendVenueEvent } from "@/lib/idnight-backend";
import {
  eventStatusTone,
  formatEventSchedule,
  formatEventStatusLabel,
} from "@/lib/venue-events";

export default async function EventDetailLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id: eventId } = await params;
  const readyAccess = await requireReadyPageAccess();

  if (!readyAccess) {
    return null;
  }

  const { session } = readyAccess;

  let event: BackendVenueEvent | null = null;
  try {
    event = await findVenueEventById(session.accessToken, eventId);
  } catch {
    /* Header degrades to a generic title; each tab handles its own errors. */
  }

  return (
    <div className="space-y-6">
      <Link
        href="/venue/events"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors duration-200 ease-out hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a eventos
      </Link>

      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-[-0.02em] text-foreground md:text-3xl">
            {event?.name ?? "Evento"}
          </h1>
          {event ? (
            <Badge
              label={formatEventStatusLabel(event.status)}
              tone={eventStatusTone(event.status)}
            />
          ) : null}
        </div>
        {event ? (
          <p className="font-mono text-sm text-muted-foreground">
            {formatEventSchedule(event.startsAt, event.endsAt)}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            No se pudo cargar la información del evento.
          </p>
        )}
      </header>

      <EventDetailTabs eventId={eventId} />

      <div>{children}</div>
    </div>
  );
}
