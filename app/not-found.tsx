import Link from "next/link";

import { Surface } from "@/components/ui-kit";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Surface className="max-w-xl p-8 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">ID-Night</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Vista no encontrada</h1>
        <p className="mt-3 text-sm leading-6 text-slate-400">
          El enlace no existe dentro del prototipo actual. La navegacion principal sigue disponible desde el centro de
          control.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-flex rounded-2xl border border-sky-300/30 bg-sky-400/12 px-4 py-3 text-sm font-medium text-sky-50"
        >
          Volver al dashboard
        </Link>
      </Surface>
    </div>
  );
}
