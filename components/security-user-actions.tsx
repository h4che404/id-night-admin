"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function SecurityUserActions({
  userId,
  active,
}: {
  userId: string;
  active: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function toggleStatus() {
    setLoading(true);

    try {
      const response = await fetch(`/api/venue/security-users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !active }),
      });

      try {
        await response.json();
      } catch {
        // Handle parsing errors gracefully
      }

      if (response.ok) {
        router.refresh();
      }
    } catch {
      // silently fail — the UI will remain unchanged
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={toggleStatus}
      disabled={loading}
      className={`rounded-xl border px-3 py-2 text-xs font-medium transition disabled:opacity-60 ${
        active
          ? "border-amber-400/20 bg-amber-400/10 text-amber-100 hover:bg-amber-400/18"
          : "border-emerald-400/20 bg-emerald-400/10 text-emerald-100 hover:bg-emerald-400/18"
      }`}
    >
      {loading ? "..." : active ? "Desactivar" : "Activar"}
    </button>
  );
}
