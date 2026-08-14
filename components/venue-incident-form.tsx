"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { PrimaryButton, Surface } from "@/components/ui-kit";
import type { BackendIncidentDetail } from "@/lib/idnight-backend";

type VenueIncidentFormProps = {
  /** Present → edit an existing incident (PATCH). Absent → create a new one (POST). */
  incident?: BackendIncidentDetail;
  /** Optional event picker for creation; the backend event link is optional too. */
  events?: Array<{ id: string; name: string }>;
};

export function VenueIncidentForm({ incident, events = [] }: VenueIncidentFormProps) {
  const router = useRouter();
  const isEditing = incident !== undefined;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState(incident?.title ?? "");
  const [status, setStatus] = useState<"open" | "closed">(incident?.status ?? "open");
  const [description, setDescription] = useState(incident?.description ?? "");
  const [resolution, setResolution] = useState(incident?.resolution ?? "");
  const [eventId, setEventId] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = isEditing
        ? await fetch(`/api/venue/incidents/${incident.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: title || undefined,
              status,
              description: description || null,
              resolution: resolution || null,
            }),
          })
        : await fetch("/api/venue/incidents", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title,
              description: description || undefined,
              eventId: eventId || undefined,
            }),
          });

      if (!response.ok) {
        let errorMessage = isEditing
          ? "No se pudo actualizar el incidente."
          : "No se pudo crear el incidente.";
        try {
          const payload = await response.json();
          if (payload.message) {
            errorMessage = payload.message;
          }
        } catch {
          // Fall back to default error message
        }
        throw new Error(errorMessage);
      }

      if (isEditing) {
        router.refresh();
      } else {
        const created = (await response.json()) as { id: string };
        router.push(`/venue/incidents/${created.id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Surface className="p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <h3 className="text-lg font-medium text-white">
          {isEditing ? "Actualizar incidente" : "Nuevo incidente"}
        </h3>

        {error ? (
          <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-200">
            {error}
          </div>
        ) : null}

        <div>
          <label htmlFor="title" className="mb-2 block text-sm font-medium text-slate-300">Título</label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required={!isEditing}
            className="w-full rounded-2xl border border-slate-800 bg-slate-950/40 px-4 py-3.5 text-slate-100 outline-none focus:border-sky-400/30 transition"
          />
        </div>

        {isEditing ? (
          <div>
            <label htmlFor="status" className="mb-2 block text-sm font-medium text-slate-300">Estado</label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value as "open" | "closed")}
              className="w-full rounded-2xl border border-slate-800 bg-slate-950/40 px-4 py-3.5 text-slate-100 outline-none focus:border-sky-400/30 transition"
            >
              <option value="open">Abierto</option>
              <option value="closed">Cerrado</option>
            </select>
          </div>
        ) : events.length > 0 ? (
          <div>
            <label htmlFor="eventId" className="mb-2 block text-sm font-medium text-slate-300">Evento</label>
            <select
              id="eventId"
              value={eventId}
              onChange={(e) => setEventId(e.target.value)}
              className="w-full rounded-2xl border border-slate-800 bg-slate-950/40 px-4 py-3.5 text-slate-100 outline-none focus:border-sky-400/30 transition"
            >
              <option value="">Sin evento asociado</option>
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.name}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        <div>
          <label htmlFor="description" className="mb-2 block text-sm font-medium text-slate-300">Descripción</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full rounded-2xl border border-slate-800 bg-slate-950/40 px-4 py-3.5 text-slate-100 outline-none focus:border-sky-400/30 transition resize-none"
            placeholder="Añadir detalles adicionales del incidente..."
          />
        </div>

        {isEditing ? (
          <div>
            <label htmlFor="resolution" className="mb-2 block text-sm font-medium text-slate-300">Resolución</label>
            <textarea
              id="resolution"
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              rows={3}
              className="w-full rounded-2xl border border-slate-800 bg-slate-950/40 px-4 py-3.5 text-slate-100 outline-none focus:border-sky-400/30 transition resize-none"
              placeholder="Describir cómo se resolvió el incidente..."
            />
          </div>
        ) : null}

        <PrimaryButton loading={loading}>
          {isEditing ? "Guardar cambios" : "Crear incidente"}
        </PrimaryButton>
      </form>
    </Surface>
  );
}
