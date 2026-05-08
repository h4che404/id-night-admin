"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className="rounded-xl border border-slate-800 bg-slate-950/30 p-3 text-slate-300 transition hover:text-white disabled:opacity-60"
      aria-label="Cerrar sesion"
      title="Cerrar sesion"
    >
      <LogOut className="h-4 w-4" />
    </button>
  );
}
