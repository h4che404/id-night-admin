"use client";

import { Building2, MapPin, Map } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { FormField, PrimaryButton } from "@/components/ui-kit";

export function VenueSettingsForm({
  initialName,
  initialAddress,
  initialCity,
}: {
  initialName: string;
  initialAddress: string;
  initialCity: string;
}) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [address, setAddress] = useState(initialAddress);
  const [city, setCity] = useState(initialCity);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch("/api/venue/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          address: address || undefined,
          city: city || undefined,
        }),
      });

      const payload = (await response.json()) as { ok?: boolean; message?: string };

      if (!response.ok) {
        throw new Error(payload.message ?? "No se pudo guardar.");
      }

      setSuccess(true);
      router.refresh();
      setTimeout(() => setSuccess(false), 3000);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "No se pudo guardar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <FormField
        label="Nombre del boliche"
        icon={<Building2 className="h-4 w-4" />}
        value={name}
        onChange={setName}
        placeholder="Nombre del boliche"
      />

      <FormField
        label="Dirección"
        icon={<MapPin className="h-4 w-4" />}
        value={address}
        onChange={setAddress}
        placeholder="Dirección"
        required={false}
      />

      <FormField
        label="Ciudad"
        icon={<Map className="h-4 w-4" />}
        value={city}
        onChange={setCity}
        placeholder="Ciudad"
        required={false}
      />

      {error ? (
        <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
          Cambios guardados correctamente.
        </div>
      ) : null}

      <div className="max-w-xs">
        <PrimaryButton loading={loading}>
          {loading ? "Guardando..." : "Guardar cambios"}
        </PrimaryButton>
      </div>
    </form>
  );
}
