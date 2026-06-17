"use client";

import { KeyRound, Plus, Smartphone } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { FormField, PrimaryButton, Surface } from "@/components/ui-kit";

export function VenueDeviceForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [deviceKey, setDeviceKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch("/api/venue/devices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, deviceKey }),
      });

      const payload = (await response.json()) as { ok?: boolean; message?: string };
      if (!response.ok) {
        throw new Error(payload.message ?? "No se pudo registrar el dispositivo.");
      }

      setSuccess(true);
      setName("");
      setDeviceKey("");
      router.refresh();

      setTimeout(() => {
        setSuccess(false);
        setOpen(false);
      }, 2000);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "No se pudo registrar el dispositivo.");
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-2xl border border-sky-300/30 bg-sky-400/12 px-4 py-3 text-sm font-medium text-sky-50 transition hover:bg-sky-400/18"
      >
        <Plus className="h-4 w-4" />
        Registrar dispositivo
      </button>
    );
  }

  return (
    <Surface className="p-6 md:p-8">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-white">Nuevo dispositivo autorizado</h3>
          <p className="mt-1 text-sm text-slate-400">Registrá nombre visible y clave de autorización para la operación de puerta.</p>
        </div>
        <button
          onClick={() => setOpen(false)}
          className="rounded-xl border border-slate-800 bg-slate-950/30 px-3 py-2 text-sm text-slate-400 transition hover:text-slate-200"
        >
          Cancelar
        </button>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField
            label="Nombre del dispositivo"
            icon={<Smartphone className="h-4 w-4" />}
            value={name}
            onChange={setName}
            placeholder="Tablet puerta principal"
          />
          <FormField
            label="Clave o código"
            icon={<KeyRound className="h-4 w-4" />}
            value={deviceKey}
            onChange={setDeviceKey}
            placeholder="DOOR-01"
          />
        </div>

        <p className="text-sm leading-6 text-slate-400">
          Esta clave identifica al dispositivo autorizado dentro del boliche. Más adelante se podrá sumar pairing o attestation, pero en este MVP sólo controlamos registro y estado operativo.
        </p>

        {error ? (
          <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
            {error}
          </div>
        ) : null}

        {success ? (
          <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
            Dispositivo registrado correctamente.
          </div>
        ) : null}

        <div className="max-w-xs">
          <PrimaryButton loading={loading}>
            {loading ? "Registrando..." : "Registrar dispositivo"}
          </PrimaryButton>
        </div>
      </form>
    </Surface>
  );
}
