"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { PrimaryButton, Surface } from "@/components/ui-kit";
import { BackendIncidentDetail } from "@/lib/idnight-backend";

export function VenueIncidentForm({ incident }: { incident: BackendIncidentDetail }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [severity, setSeverity] = useState(incident.severity);
  const [status, setStatus] = useState(incident.status);
  const [description, setDescription] = useState(incident.description || "");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/venue/incidents/${incident.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ severity, status, description }),
      });

      if (!response.ok) {
        let errorMessage = "No se pudo actualizar el incidente.";
        try {
          const payload = await response.json();
          if (payload.message) {
            errorMessage = payload.message;
          }
        } catch (e) {
          // Fall back to default error message if JSON parsing fails
        }
        throw new Error(errorMessage);
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Surface className="p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <h3 className="text-lg font-medium text-white">Actualizar incidente</h3>
        
        {error ? (
          <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-200">
            {error}
          </div>
        ) : null}

        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label htmlFor="status" className="mb-2 block text-sm font-medium text-slate-300">Estado</label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-2xl border border-slate-800 bg-slate-950/40 px-4 py-3.5 text-slate-100 outline-none focus:border-sky-400/30 transition"
            >
              <option value="OPEN">Abierto</option>
              <option value="CLOSED">Cerrado</option>
            </select>
          </div>

          <div>
            <label htmlFor="severity" className="mb-2 block text-sm font-medium text-slate-300">Severidad</label>
            <select
              id="severity"
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
              className="w-full rounded-2xl border border-slate-800 bg-slate-950/40 px-4 py-3.5 text-slate-100 outline-none focus:border-sky-400/30 transition"
            >
              <option value="LOW">Baja</option>
              <option value="MEDIUM">Media</option>
              <option value="HIGH">Alta</option>
              <option value="CRITICAL">Crítica</option>
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="description" className="mb-2 block text-sm font-medium text-slate-300">Descripción detallada</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full rounded-2xl border border-slate-800 bg-slate-950/40 px-4 py-3.5 text-slate-100 outline-none focus:border-sky-400/30 transition resize-none"
            placeholder="Añadir detalles adicionales del incidente..."
          />
        </div>

        <PrimaryButton loading={loading}>Guardar cambios</PrimaryButton>
      </form>
    </Surface>
  );
}