"use client";

import { Building2, Map, MapPin, Store } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { FormField, PrimaryButton } from "@/components/ui-kit";

export function OwnerOnboardingForm() {
  const router = useRouter();
  const [organizationName, setOrganizationName] = useState("");
  const [venueName, setVenueName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/owner-onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationName,
          venueName,
          address: address || undefined,
          city: city || undefined,
        }),
      });

      const payload = (await response.json()) as { ok?: boolean; message?: string };

      if (!response.ok) {
        throw new Error(payload.message ?? "No se pudo crear la organización.");
      }

      router.push("/venue");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "No se pudo crear la organización.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <FormField
        label="Nombre de la organización"
        icon={<Building2 className="h-4 w-4" />}
        value={organizationName}
        onChange={setOrganizationName}
        placeholder="Ej: Nocturna SA"
      />

      <FormField
        label="Nombre del boliche"
        icon={<Store className="h-4 w-4" />}
        value={venueName}
        onChange={setVenueName}
        placeholder="Ej: Club Prisma"
      />

      <FormField
        label="Dirección (opcional)"
        icon={<MapPin className="h-4 w-4" />}
        value={address}
        onChange={setAddress}
        placeholder="Ej: Arístides 1200"
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
        {loading ? "Creando organización..." : "Crear organización"}
      </PrimaryButton>
    </form>
  );
}
