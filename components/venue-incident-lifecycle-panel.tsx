"use client";

import { useState } from "react";

import { EntryPhotoGallery } from "@/components/entry-photo-gallery";
import { Badge, PrimaryButton, SecondaryButton, Surface } from "@/components/ui-kit";
import {
  INCIDENT_LINK_PERSON_STEP_UP_ACTION,
  type BackendEntryPhotoCard,
  type BackendIncidentLifecycle,
} from "@/lib/idnight-backend";

const LIFECYCLE_LABELS: Record<string, string> = {
  Open: "Abierto",
  PersonLinked: "Persona vinculada",
  Resolved: "Resuelto",
};

async function readErrorMessage(response: Response, fallback: string) {
  try {
    const payload = await response.json();
    return typeof payload?.message === "string" ? payload.message : fallback;
  } catch {
    return fallback;
  }
}

/**
 * Incident detail actions (S5b): link a person by picking their card out of the entry-photo
 * gallery (step-up required, IL-02/IL-03), or resolve the incident (no step-up, task 5.6).
 * No GET endpoint exposes the current Lifecycle, so this only shows a result once an action in
 * this session returns one — it never guesses a state it cannot confirm.
 */
export function VenueIncidentLifecyclePanel({
  incidentId,
  cards,
}: {
  incidentId: string;
  cards: BackendEntryPhotoCard[];
}) {
  const [selected, setSelected] = useState<BackendEntryPhotoCard | null>(null);
  const [blocking, setBlocking] = useState(true);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BackendIncidentLifecycle | null>(null);

  function resetLinkFlow() {
    setSelected(null);
    setOtpSent(false);
    setOtpCode("");
    setError(null);
  }

  async function handleResolve() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/venue/incidents/${incidentId}/resolve`, { method: "POST" });
      if (!response.ok) {
        throw new Error(await readErrorMessage(response, "No se pudo resolver el incidente."));
      }
      setResult((await response.json()) as BackendIncidentLifecycle);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  async function handleRequestVerification() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/venue/step-up/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: INCIDENT_LINK_PERSON_STEP_UP_ACTION, resource: incidentId }),
      });
      if (!response.ok) {
        throw new Error(await readErrorMessage(response, "No se pudo enviar el código de verificación."));
      }
      setOtpSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyAndLink() {
    if (!selected?.documentLookupKey) return;
    setLoading(true);
    setError(null);
    try {
      const verifyResponse = await fetch("/api/venue/step-up/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: INCIDENT_LINK_PERSON_STEP_UP_ACTION,
          resource: incidentId,
          code: otpCode,
        }),
      });
      if (!verifyResponse.ok) {
        throw new Error(await readErrorMessage(verifyResponse, "El código no es válido."));
      }

      const linkResponse = await fetch(`/api/venue/incidents/${incidentId}/link-person`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentLookupKey: selected.documentLookupKey, blocking }),
      });
      if (!linkResponse.ok) {
        throw new Error(await readErrorMessage(linkResponse, "No se pudo vincular a la persona."));
      }

      setResult((await linkResponse.json()) as BackendIncidentLifecycle);
      resetLinkFlow();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  const resolved = result?.lifecycle === "Resolved";

  return (
    <Surface className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-foreground">Vínculo con una persona</h3>
        {result ? (
          <Badge
            label={LIFECYCLE_LABELS[result.lifecycle] ?? result.lifecycle}
            tone={result.lifecycle === "Resolved" ? "neutral" : "warning"}
          />
        ) : null}
      </div>

      {error ? (
        <div className="rounded-md border border-rejected/20 bg-rejected/10 p-3 text-sm text-rejected">
          {error}
        </div>
      ) : null}

      {!selected ? (
        <>
          <p className="text-sm text-muted-foreground">
            Tocá una tarjeta de la galería para vincular a esa persona con este incidente.
          </p>
          <EntryPhotoGallery cards={cards} onSelectCard={setSelected} />
        </>
      ) : !otpSent ? (
        <div className="space-y-3">
          <p className="text-sm text-foreground">
            Vincular a <span className="font-mono">{selected.documentLookupKey}</span>
          </p>
          <label className="flex items-center gap-2 text-sm text-foreground/90">
            <input type="checkbox" checked={blocking} onChange={(e) => setBlocking(e.target.checked)} />
            Bloquear el ingreso en toda la organización
          </label>
          <div className="flex gap-3">
            <PrimaryButton type="button" loading={loading} onClick={handleRequestVerification}>
              Solicitar verificación
            </PrimaryButton>
            <SecondaryButton onClick={resetLinkFlow}>Cancelar</SecondaryButton>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-foreground">
            Ingresá el código de verificación que enviamos a tu email.
          </p>
          <input
            aria-label="Código de verificación"
            value={otpCode}
            onChange={(e) => setOtpCode(e.target.value)}
            inputMode="numeric"
            className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-foreground outline-none"
          />
          <div className="flex gap-3">
            <PrimaryButton type="button" loading={loading} disabled={!otpCode} onClick={handleVerifyAndLink}>
              Verificar y vincular
            </PrimaryButton>
            <SecondaryButton onClick={resetLinkFlow}>Cancelar</SecondaryButton>
          </div>
        </div>
      )}

      <div className="border-t border-border pt-4">
        <PrimaryButton type="button" loading={loading} disabled={resolved} onClick={handleResolve}>
          {resolved ? "Incidente resuelto" : "Resolver incidente"}
        </PrimaryButton>
      </div>
    </Surface>
  );
}
