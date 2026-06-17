"use client";

import { Mail, User, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { FormField, PrimaryButton, Surface } from "@/components/ui-kit";

export function SecurityUserForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch("/api/venue/security-users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, email }),
      });

      let payload: { ok?: boolean; message?: string } = {};
      try {
        payload = (await response.json()) as { ok?: boolean; message?: string };
      } catch {
        // Ignored, payload remains {}
      }

      if (!response.ok) {
        throw new Error(payload.message ?? "No se pudo crear el usuario.");
      }

      setSuccess(true);
      setFirstName("");
      setLastName("");
      setEmail("");
      router.refresh();

      setTimeout(() => {
        setSuccess(false);
        setOpen(false);
      }, 2000);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "No se pudo crear el usuario.");
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
        <UserPlus className="h-4 w-4" />
        Crear usuario de seguridad
      </button>
    );
  }

  return (
    <Surface className="p-6 md:p-8">
      <div className="mb-5 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Nuevo usuario de seguridad</h3>
        <button
          onClick={() => setOpen(false)}
          className="rounded-xl border border-slate-800 bg-slate-950/30 px-3 py-2 text-sm text-slate-400 hover:text-slate-200 transition"
        >
          Cancelar
        </button>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField
            label="Nombre"
            icon={<User className="h-4 w-4" />}
            value={firstName}
            onChange={setFirstName}
            placeholder="Nombre"
          />
          <FormField
            label="Apellido"
            icon={<User className="h-4 w-4" />}
            value={lastName}
            onChange={setLastName}
            placeholder="Apellido"
          />
        </div>

        <FormField
          label="Email"
          icon={<Mail className="h-4 w-4" />}
          value={email}
          onChange={setEmail}
          placeholder="seguridad@tuboliche.com"
          type="email"
        />

        <p className="text-sm leading-6 text-slate-400">
          Vamos a crear la cuenta en Supabase y enviar una invitación para que esta persona termine su acceso sin compartir contraseñas locales.
        </p>

        {error ? (
          <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
            {error}
          </div>
        ) : null}

        {success ? (
          <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
            Invitación enviada correctamente.
          </div>
        ) : null}

        <div className="max-w-xs">
          <PrimaryButton loading={loading}>
            {loading ? "Creando..." : "Crear usuario"}
          </PrimaryButton>
        </div>
      </form>
    </Surface>
  );
}
