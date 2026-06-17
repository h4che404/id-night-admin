"use client";

import { Ticket, UserRoundCheck, UserRoundSearch, ShieldAlert, NotebookPen } from "lucide-react";
import { useRouter } from "next/navigation";
import { type ReactNode, useState } from "react";

import { FormField, PrimaryButton } from "@/components/ui-kit";

type VenueEntryRulesFormProps = {
  initialRules: {
    active: boolean;
    minimumAge: number;
    requireVerifiedAdult: boolean;
    requireIdentityVerification: boolean;
    requireValidTicket: boolean;
    allowManualReview: boolean;
    notes: string | null;
  };
};

export function VenueEntryRulesForm({ initialRules }: VenueEntryRulesFormProps) {
  const router = useRouter();
  const [active, setActive] = useState(initialRules.active);
  const [minimumAge, setMinimumAge] = useState(String(initialRules.minimumAge));
  const [requireVerifiedAdult, setRequireVerifiedAdult] = useState(initialRules.requireVerifiedAdult);
  const [requireIdentityVerification, setRequireIdentityVerification] = useState(initialRules.requireIdentityVerification);
  const [requireValidTicket, setRequireValidTicket] = useState(initialRules.requireValidTicket);
  const [allowManualReview, setAllowManualReview] = useState(initialRules.allowManualReview);
  const [notes, setNotes] = useState(initialRules.notes ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    const normalizedMinimumAge = minimumAge.trim();
    if (!/^\d+$/.test(normalizedMinimumAge)) {
      setLoading(false);
      setError("La edad mínima debe ser un número entero.");
      return;
    }

    const parsedMinimumAge = Number(normalizedMinimumAge);
    if (!Number.isInteger(parsedMinimumAge) || parsedMinimumAge < 0 || parsedMinimumAge > 120) {
      setLoading(false);
      setError("La edad mínima debe estar entre 0 y 120 años.");
      return;
    }

    try {
      const response = await fetch("/api/venue/entry-rules", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          active,
          minimumAge: parsedMinimumAge,
          requireVerifiedAdult,
          requireIdentityVerification,
          requireValidTicket,
          allowManualReview,
          notes: notes || undefined,
        }),
      });

      const payload = (await response.json()) as { message?: string };

      if (!response.ok) {
        throw new Error(payload.message ?? "No se pudieron guardar los requisitos de ingreso.");
      }

      setSuccess(true);
      router.refresh();
      setTimeout(() => setSuccess(false), 3000);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "No se pudieron guardar los requisitos de ingreso.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <FormField
        label="Edad mínima"
        icon={<ShieldAlert className="h-4 w-4" />}
        value={minimumAge}
        onChange={setMinimumAge}
        placeholder="18"
        type="number"
      />

      <div className="grid gap-3 md:grid-cols-2">
        <CheckboxCard
          label="Regla activa"
          description="Aplica estos requisitos en el ingreso del boliche."
          checked={active}
          onChange={setActive}
          icon={<ShieldAlert className="h-4 w-4" />}
        />
        <CheckboxCard
          label="Exigir mayoría de edad verificada"
          description="Permite operar solo con validación de adulto aprobada."
          checked={requireVerifiedAdult}
          onChange={setRequireVerifiedAdult}
          icon={<UserRoundCheck className="h-4 w-4" />}
        />
        <CheckboxCard
          label="Exigir verificación de identidad"
          description="Requiere que el perfil tenga la identidad validada antes del ingreso."
          checked={requireIdentityVerification}
          onChange={setRequireIdentityVerification}
          icon={<UserRoundSearch className="h-4 w-4" />}
        />
        <CheckboxCard
          label="Exigir ticket o entrada válida"
          description="Suma una validación operativa previa al acceso."
          checked={requireValidTicket}
          onChange={setRequireValidTicket}
          icon={<Ticket className="h-4 w-4" />}
        />
        <CheckboxCard
          label="Permitir revisión manual"
          description="Deja la resolución en manos del supervisor cuando el caso lo requiera."
          checked={allowManualReview}
          onChange={setAllowManualReview}
          icon={<ShieldAlert className="h-4 w-4" />}
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-300">Notas e instrucciones para seguridad</label>
        <div className="flex gap-3 rounded-2xl border border-slate-800 bg-slate-950/40 px-4 py-3 text-slate-400 transition focus-within:border-sky-400/30">
          <NotebookPen className="mt-1 h-4 w-4 shrink-0" />
          <textarea
            className="min-h-28 w-full resize-y border-0 bg-transparent p-0 text-sm text-slate-100 outline-none placeholder:text-slate-600"
            placeholder="Ej.: derivar a supervisor si la verificación facial requiere revisión manual."
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            maxLength={1000}
          />
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
          Requisitos de ingreso guardados correctamente.
        </div>
      ) : null}

      <div className="max-w-xs">
        <PrimaryButton loading={loading}>
          {loading ? "Guardando..." : "Guardar requisitos"}
        </PrimaryButton>
      </div>
    </form>
  );
}

function CheckboxCard({
  label,
  description,
  checked,
  onChange,
  icon,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  icon: ReactNode;
}) {
  return (
    <label className="flex cursor-pointer gap-3 rounded-2xl border border-slate-800 bg-slate-950/30 px-4 py-4 transition hover:border-slate-700">
      <div className="mt-0.5 text-slate-500">{icon}</div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-slate-100">{label}</p>
            <p className="mt-1 text-sm leading-6 text-slate-400">{description}</p>
          </div>
          <input
            className="mt-1 h-4 w-4 rounded border-slate-700 bg-slate-950 text-sky-300"
            type="checkbox"
            checked={checked}
            onChange={(event) => onChange(event.target.checked)}
          />
        </div>
      </div>
    </label>
  );
}
