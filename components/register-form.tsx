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

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, email, password }),
      });

      const payload = (await response.json()) as { ok?: boolean; message?: string };

      if (!response.ok) {
        throw new Error(payload.message ?? "No se pudo crear la cuenta.");
      }

      router.push("/venue");
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "No se pudo crear la cuenta.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
      <div className="grid grid-cols-2 gap-4">
        <FormField
          label="Nombre"
          icon={<User className="h-4 w-4" />}
          value={firstName}
          onChange={setFirstName}
          placeholder="Juan"
        />

        <FormField
          label="Apellido"
          icon={<User className="h-4 w-4" />}
          value={lastName}
          onChange={setLastName}
          placeholder="García"
        />
      </div>

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
        placeholder="Mínimo 8 caracteres"
        type="password"
      />

      {error ? (
        <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
          {error}
        </div>
      ) : null}

      <PrimaryButton loading={loading}>
        {loading ? "Creando cuenta..." : "Crear cuenta"}
      </PrimaryButton>
    </form>
  );
}
