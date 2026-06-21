"use client";

import { LockKeyhole, Mail, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { FormField, PrimaryButton } from "@/components/ui-kit";

export function RegisterForm() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    setAlreadyRegistered(false);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, firstName, lastName }),
      });

      let payload: { ok?: boolean; message?: string; requiresEmailConfirmation?: boolean; alreadyRegistered?: boolean };
      try {
        payload = await response.json();
      } catch {
        throw new Error("Ocurrió un error inesperado al registrar la cuenta.");
      }

      if (!response.ok) {
        if (payload.alreadyRegistered) {
          setAlreadyRegistered(true);
          return;
        }
        throw new Error(payload.message ?? "No se pudo crear la cuenta.");
      }

      if (payload.requiresEmailConfirmation) {
        setSuccessMsg("Revisá tu email para activar la cuenta");
      } else {
        router.push("/owner-onboarding");
        router.refresh();
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "No se pudo crear la cuenta.");
    } finally {
      setLoading(false);
    }
  }

  if (successMsg) {
    return (
      <div className="mt-8 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100 text-center">
        {successMsg}
      </div>
    );
  }

  return (
    <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
      <FormField
        label="Nombre"
        icon={<User className="h-4 w-4" />}
        value={firstName}
        onChange={setFirstName}
        placeholder="Tu nombre"
        type="text"
      />

      <FormField
        label="Apellido"
        icon={<User className="h-4 w-4" />}
        value={lastName}
        onChange={setLastName}
        placeholder="Tu apellido"
        type="text"
      />

      <FormField
        label="Email"
        icon={<Mail className="h-4 w-4" />}
        value={email}
        onChange={setEmail}
        placeholder="tu@email.com"
        type="email"
      />

      <FormField
        label="Contraseña"
        icon={<LockKeyhole className="h-4 w-4" />}
        value={password}
        onChange={setPassword}
        placeholder="••••••••"
        type="password"
      />
      <p className="text-xs text-slate-500">Mínimo 6 caracteres.</p>

      {error ? (
        <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
          {error}
        </div>
      ) : null}

      {alreadyRegistered ? (
        <div className="rounded-2xl border border-sky-400/20 bg-sky-400/10 px-4 py-3 text-sm text-sky-100">
          Este email ya tiene una cuenta.{" "}
          <a href="/login" className="font-medium underline underline-offset-2 hover:text-white transition">
            Iniciá sesión
          </a>
        </div>
      ) : null}

      <PrimaryButton loading={loading}>
        {loading ? "Registrando..." : "Registrarse"}
      </PrimaryButton>
    </form>
  );
}
