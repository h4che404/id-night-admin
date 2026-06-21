"use client";

import { LockKeyhole, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { FormField, PrimaryButton } from "@/components/ui-kit";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const payload = (await response.json()) as { ok?: boolean; message?: string };

      if (!response.ok) {
        throw new Error(payload.message ?? "No se pudo iniciar sesión.");
      }

      router.push("/venue");
      router.refresh();
    } catch (submitError) {
      const msg = submitError instanceof Error ? submitError.message : "";
      if (
        msg.toLowerCase().includes("invalid") ||
        msg.toLowerCase().includes("credentials") ||
        msg.toLowerCase().includes("email") ||
        msg.toLowerCase().includes("password")
      ) {
        setError("Email o contraseña incorrectos.");
      } else {
        setError(msg || "No se pudo iniciar sesión.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
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

      {error ? (
        <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
          {error}
        </div>
      ) : null}

      <PrimaryButton loading={loading}>
        {loading ? "Ingresando..." : "Ingresar"}
      </PrimaryButton>
    </form>
  );
}
