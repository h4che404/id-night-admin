"use client";

import { LockKeyhole, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

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
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const payload = (await response.json()) as { ok?: boolean; message?: string };

      if (!response.ok) {
        throw new Error(payload.message ?? "No pudimos autenticar contra Azure.");
      }

      router.push("/dashboard");
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "No pudimos autenticar contra Azure.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="mt-10 space-y-6" onSubmit={handleSubmit}>
      <Field
        label="Email"
        icon={<Mail className="h-4 w-4" />}
        value={email}
        onChange={setEmail}
        placeholder="operador@idnight.demo"
      />

      <Field
        label="Contrasena"
        icon={<LockKeyhole className="h-4 w-4" />}
        value={password}
        onChange={setPassword}
        placeholder="secret123"
        type="password"
      />

      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-500">Sesion admin real contra Azure App Service</span>
        <span className="text-sky-300">JWT admin + proxy server-side</span>
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
          {error}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="inline-flex w-full items-center justify-center rounded-2xl border border-sky-300/30 bg-sky-400/12 px-4 py-3.5 text-sm font-medium text-sky-50 transition hover:bg-sky-400/18 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Conectando con Azure..." : "Ingresar al centro de control"}
      </button>
    </form>
  );
}

function Field({
  label,
  icon,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  icon: React.ReactNode;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-300">{label}</label>
      <div className="flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-950/40 px-4 py-3.5 text-slate-400 focus-within:border-sky-400/30">
        {icon}
        <input
          className="w-full border-0 bg-transparent p-0 text-slate-100 outline-none placeholder:text-slate-600"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          type={type}
          required
        />
      </div>
    </div>
  );
}
