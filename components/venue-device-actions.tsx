"use client";

import { KeyRound, Pencil, Smartphone } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";

import { PrimaryButton, SecondaryButton } from "@/components/ui-kit";

type VenueDeviceActionsProps = {
  deviceId: string;
  initialName: string;
  initialDeviceKey: string;
  active: boolean;
};

async function readMessage(response: Response, fallback: string) {
  try {
    const payload = (await response.json()) as { message?: string };
    return payload.message ?? fallback;
  } catch {
    return fallback;
  }
}

export function VenueDeviceActions({
  deviceId,
  initialName,
  initialDeviceKey,
  active,
}: VenueDeviceActionsProps) {
  const router = useRouter();
  const nameInputId = useId();
  const deviceKeyInputId = useId();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(initialName);
  const [deviceKey, setDeviceKey] = useState(initialDeviceKey);
  const [loadingAction, setLoadingAction] = useState<"save" | "toggle" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function toggleStatus() {
    setLoadingAction("toggle");
    setError(null);

    try {
      const response = await fetch("/api/venue/devices", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deviceId, active: !active }),
      });

      if (!response.ok) {
        throw new Error(await readMessage(response, "No se pudo actualizar el estado del dispositivo."));
      }

      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "No se pudo actualizar el estado del dispositivo.",
      );
    } finally {
      setLoadingAction(null);
    }
  }

  async function saveChanges(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoadingAction("save");
    setError(null);

    try {
      const response = await fetch("/api/venue/devices", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deviceId, name, deviceKey }),
      });

      if (!response.ok) {
        throw new Error(await readMessage(response, "No se pudieron guardar los cambios del dispositivo."));
      }

      setEditing(false);
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "No se pudieron guardar los cambios del dispositivo.",
      );
    } finally {
      setLoadingAction(null);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            setEditing((current) => !current);
            setError(null);
          }}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-xs font-medium text-slate-200 transition hover:border-slate-700 hover:text-white"
        >
          <Pencil className="h-3.5 w-3.5" />
          {editing ? "Cerrar" : "Editar"}
        </button>

        <button
          type="button"
          onClick={toggleStatus}
          disabled={loadingAction !== null}
          className={`rounded-xl border px-3 py-2 text-xs font-medium transition disabled:opacity-60 ${
            active
              ? "border-amber-400/20 bg-amber-400/10 text-amber-100 hover:bg-amber-400/18"
              : "border-emerald-400/20 bg-emerald-400/10 text-emerald-100 hover:bg-emerald-400/18"
          }`}
        >
          {loadingAction === "toggle" ? "Actualizando..." : active ? "Desactivar" : "Activar"}
        </button>
      </div>

      {editing ? (
        <form onSubmit={saveChanges} className="space-y-3 rounded-2xl border border-slate-800 bg-slate-950/30 p-4">
          <div>
            <label htmlFor={nameInputId} className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Nombre
            </label>
            <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-slate-400 focus-within:border-sky-400/30">
              <Smartphone className="h-4 w-4" />
              <input
                id={nameInputId}
                className="w-full border-0 bg-transparent p-0 text-sm text-slate-100 outline-none placeholder:text-slate-600"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Tablet puerta principal"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor={deviceKeyInputId} className="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Clave
            </label>
            <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-slate-400 focus-within:border-sky-400/30">
              <KeyRound className="h-4 w-4" />
              <input
                id={deviceKeyInputId}
                className="w-full border-0 bg-transparent p-0 text-sm text-slate-100 outline-none placeholder:text-slate-600"
                value={deviceKey}
                onChange={(event) => setDeviceKey(event.target.value)}
                placeholder="DOOR-01"
                required
              />
            </div>
          </div>

          {error ? (
            <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-3 py-2 text-xs text-rose-100">
              {error}
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <div className="min-w-36">
              <PrimaryButton loading={loadingAction === "save"}>
                {loadingAction === "save" ? "Guardando..." : "Guardar cambios"}
              </PrimaryButton>
            </div>
            <SecondaryButton
              disabled={loadingAction !== null}
              onClick={() => {
                setEditing(false);
                setName(initialName);
                setDeviceKey(initialDeviceKey);
                setError(null);
              }}
            >
              Cancelar
            </SecondaryButton>
          </div>
        </form>
      ) : error ? (
        <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-3 py-2 text-xs text-rose-100">
          {error}
        </div>
      ) : null}
    </div>
  );
}
