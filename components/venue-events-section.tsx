"use client";

import { CalendarDays, CalendarRange } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Badge, DataShell, DataTable, EmptyState } from "@/components/ui-kit";
import { VenueEventForm } from "@/components/venue-event-form";
import type { BackendVenueEvent } from "@/lib/idnight-backend";
import {
  eventStatusTone,
  formatEventSchedule,
  formatEventStatusLabel,
  normalizeEventStatus,
} from "@/lib/venue-events";

const ACTION_ERROR_MESSAGES: Record<"publish" | "activate" | "finish" | "cancel", string> = {
  publish: "No se pudo publicar el evento.",
  activate: "No se pudo activar el evento.",
  finish: "No se pudo finalizar el evento.",
  cancel: "No se pudo cancelar el evento.",
};

type Props = {
  events: BackendVenueEvent[];
  eventsError: string | null;
};

export function VenueEventsSection({ events, eventsError }: Props) {
  const router = useRouter();
  const [editingEvent, setEditingEvent] = useState<BackendVenueEvent | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [actionLoading, setActionLoading] = useState<Record<string, string>>({});
  const [actionError, setActionError] = useState<Record<string, string>>({});

  async function handleAction(
    event: BackendVenueEvent,
    action: "publish" | "activate" | "finish" | "cancel",
  ) {
    setActionLoading((prev) => ({ ...prev, [event.id]: action }));
    setActionError((prev) => {
      const next = { ...prev };
      delete next[event.id];
      return next;
    });

    try {
      const response = await fetch(`/api/venue/events/${event.id}/${action}`, { method: "POST" });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setActionError((prev) => ({
          ...prev,
          [event.id]: (payload as { message?: string }).message ?? ACTION_ERROR_MESSAGES[action],
        }));
        return;
      }

      router.refresh();
    } catch {
      setActionError((prev) => ({ ...prev, [event.id]: ACTION_ERROR_MESSAGES[action] }));
    } finally {
      setActionLoading((prev) => {
        const next = { ...prev };
        delete next[event.id];
        return next;
      });
    }
  }

  if (eventsError) {
    return (
      <EmptyState
        title="No se pudieron cargar los eventos"
        description={eventsError}
        icon={<CalendarRange className="h-5 w-5 text-sky-300" />}
      />
    );
  }

  return (
    <div className="space-y-4">
      {!showCreateForm && !editingEvent && (
        <button
          onClick={() => setShowCreateForm(true)}
          className="inline-flex items-center gap-2 rounded-2xl border border-sky-300/30 bg-sky-400/12 px-4 py-3 text-sm font-medium text-sky-50 transition hover:bg-sky-400/18"
        >
          <CalendarDays className="h-4 w-4" />
          Crear evento
        </button>
      )}

      {showCreateForm && (
        <VenueEventForm
          onClose={() => setShowCreateForm(false)}
        />
      )}

      {editingEvent && (
        <VenueEventForm
          event={editingEvent}
          onClose={() => setEditingEvent(null)}
        />
      )}

      {events.length === 0 ? (
        <EmptyState
          title="Sin eventos todavía"
          description="Creá tu primer evento con el botón de arriba. Vas a poder sumar reglas del evento, listas de invitados y reportes en próximas etapas."
          icon={<CalendarDays className="h-5 w-5 text-sky-300" />}
        />
      ) : (
        <DataShell
          title="Cartelera de eventos"
          subtitle={`${events.length} evento${events.length === 1 ? "" : "s"} programado${events.length === 1 ? "" : "s"}`}
        >
        <DataTable
          columns={["Evento", "Horario", "Estado", "Capacidad", "Acciones"]}
          rows={events.map((event) => {
            const normalizedStatus = normalizeEventStatus(event.status);

            return (
              <tr key={event.id} className="align-top hover:bg-slate-950/20">
                <td className="px-5 py-4">
                  <Link
                    href={`/venue/events/${event.id}`}
                    className="font-medium text-slate-100 transition-colors duration-200 ease-out hover:text-white hover:underline"
                  >
                    {event.name}
                  </Link>
                </td>
                <td className="px-5 py-4 text-sm text-slate-300">
                  {formatEventSchedule(event.startsAt, event.endsAt)}
                </td>
                <td className="px-5 py-4">
                  <Badge label={formatEventStatusLabel(event.status)} tone={eventStatusTone(event.status)} />
                </td>
                <td className="px-5 py-4 text-sm text-slate-300">
                  {event.maxCapacity ? `${event.maxCapacity} personas` : "Sin límite de capacidad"}
                </td>
                <td className="px-5 py-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/venue/events/${event.id}/guest-list`}
                      className="inline-flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-950/30 px-3 py-1.5 text-xs text-slate-300 transition hover:border-slate-600 hover:text-slate-100"
                    >
                      Invitados
                    </Link>
                    <Link
                      href={`/venue/events/${event.id}/report`}
                      className="inline-flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-950/30 px-3 py-1.5 text-xs text-slate-300 transition hover:border-slate-600 hover:text-slate-100"
                    >
                      Reporte
                    </Link>
                    {normalizedStatus === "DRAFT" && (
                      <button
                        onClick={() => handleAction(event, "publish")}
                        disabled={Boolean(actionLoading[event.id])}
                        className="rounded-lg border border-violet-400/30 bg-violet-400/10 px-3 py-1.5 text-xs font-medium text-violet-200 transition hover:bg-violet-400/20 disabled:opacity-50"
                      >
                        {actionLoading[event.id] === "publish" ? "Publicando…" : "Publicar"}
                      </button>
                    )}
                    {normalizedStatus === "UPCOMING" && (
                      <>
                        <button
                          onClick={() => handleAction(event, "activate")}
                          disabled={Boolean(actionLoading[event.id])}
                          className="rounded-lg border border-sky-400/30 bg-sky-400/10 px-3 py-1.5 text-xs font-medium text-sky-200 transition hover:bg-sky-400/20 disabled:opacity-50"
                        >
                          {actionLoading[event.id] === "activate" ? "Activando…" : "Activar"}
                        </button>
                        <button
                          onClick={() => setEditingEvent(event)}
                          disabled={Boolean(actionLoading[event.id])}
                          className="rounded-lg border border-slate-700/60 bg-slate-900/60 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:bg-slate-800/60 disabled:opacity-50"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleAction(event, "cancel")}
                          disabled={Boolean(actionLoading[event.id])}
                          className="rounded-lg border border-rose-400/30 bg-rose-400/10 px-3 py-1.5 text-xs font-medium text-rose-200 transition hover:bg-rose-400/20 disabled:opacity-50"
                        >
                          {actionLoading[event.id] === "cancel" ? "Cancelando…" : "Cancelar"}
                        </button>
                      </>
                    )}
                    {normalizedStatus === "ACTIVE" && (
                      <>
                        <button
                          onClick={() => handleAction(event, "finish")}
                          disabled={Boolean(actionLoading[event.id])}
                          className="rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-3 py-1.5 text-xs font-medium text-emerald-200 transition hover:bg-emerald-400/20 disabled:opacity-50"
                        >
                          {actionLoading[event.id] === "finish" ? "Finalizando…" : "Finalizar"}
                        </button>
                        <button
                          onClick={() => handleAction(event, "cancel")}
                          disabled={Boolean(actionLoading[event.id])}
                          className="rounded-lg border border-rose-400/30 bg-rose-400/10 px-3 py-1.5 text-xs font-medium text-rose-200 transition hover:bg-rose-400/20 disabled:opacity-50"
                        >
                          {actionLoading[event.id] === "cancel" ? "Cancelando…" : "Cancelar"}
                        </button>
                      </>
                    )}
                    {actionError[event.id] && (
                      <span className="text-xs text-rose-300">{actionError[event.id]}</span>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        />
      </DataShell>
    )}
    </div>
  );
}
