"use client";

import { Building2, MapPin, Map } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { FormField, PrimaryButton } from "@/components/ui-kit";

export function VenueCreateForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/venue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, address: address || undefined, city: city || undefined }),
      });

      const payload = (await response.json()) as { ok?: boolean; message?: string };

      if (!response.ok) {
        throw new Error(payload.message ?? "No se pudo crear el boliche.");
      }

      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "No se pudo crear el boliche.");
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
        placeholder="Ej: Sala Prisma"
      />

      <FormField
        label="Dirección (opcional)"
        icon={<MapPin className="h-4 w-4" />}
        value={address}
        onChange={setAddress}
        placeholder="Ej: Aristides 1120"
        required={false}
      />

      <FormField
        label="Ciudad (opcional)"
        icon={<Map className="h-4 w-4" />}
        value={city}
        onChange={setCity}
        placeholder="Ej: Mendoza"
        required={false}
      />

      {error ? (
        <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
          {error}
        </div>
      ) : null}

      <PrimaryButton loading={loading}>
        {loading ? "Creando boliche..." : "Crear boliche"}
      </PrimaryButton>
    </form>
  );
}
