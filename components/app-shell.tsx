"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  Bell,
  Building2,
  ChevronRight,
  CircleHelp,
  DoorOpen,
  FileClock,
  Fingerprint,
  LayoutDashboard,
  LaptopMinimalCheck,
  Search,
  Settings2,
  ShieldAlert,
  Siren,
  Users2,
} from "lucide-react";
import { type ReactNode } from "react";

import { LogoutButton } from "@/components/logout-button";
import { navigationGroups } from "@/lib/data";
import { cn } from "@/lib/utils";

const iconMap: Record<string, ReactNode> = {
  Dashboard: <LayoutDashboard className="h-4 w-4" />,
  Locales: <Building2 className="h-4 w-4" />,
  Accesos: <DoorOpen className="h-4 w-4" />,
  Usuarios: <Fingerprint className="h-4 w-4" />,
  Historial: <Activity className="h-4 w-4" />,
  Operadores: <Users2 className="h-4 w-4" />,
  Dispositivos: <LaptopMinimalCheck className="h-4 w-4" />,
  Incidentes: <ShieldAlert className="h-4 w-4" />,
  Alertas: <Siren className="h-4 w-4" />,
  Auditoria: <FileClock className="h-4 w-4" />,
  "Estado del sistema": <AlertTriangle className="h-4 w-4" />,
  Configuracion: <Settings2 className="h-4 w-4" />,
  Ayuda: <CircleHelp className="h-4 w-4" />,
};

const liveCoveragePaths = new Set([
  "/dashboard",
  "/venues",
  "/system-status",
  "/operators",
  "/devices",
  "/access-points",
  "/profiles",
  "/accesses",
  "/incidents",
  "/alerts",
  "/audit",
]);

export function AppShell({
  children,
  userName,
  userEmail,
  verificationStatus,
}: {
  children: ReactNode;
  userName: string;
  userEmail: string;
  verificationStatus: string;
}) {
  const pathname = usePathname();
  const liveCoverage = liveCoveragePaths.has(pathname) || pathname.startsWith("/venues/");

  return (
    <div className="min-h-screen bg-transparent">
      <div className="mx-auto grid min-h-screen max-w-[1680px] gap-6 px-4 py-4 lg:grid-cols-[280px_minmax(0,1fr)] lg:px-6">
        <aside className="panel sticky top-4 hidden h-[calc(100vh-2rem)] rounded-3xl p-5 lg:flex lg:flex-col">
          <div className="border-b border-slate-800/80 pb-5">
            <div className="flex items-center gap-3">
              <div className="glow-ring flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-400/10">
                <ShieldAlert className="h-5 w-5 text-sky-200" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-300/70">ID-Night</p>
                <h1 className="text-lg font-semibold text-slate-50">Admin Command</h1>
              </div>
            </div>
            <div className="mt-5 rounded-2xl border border-slate-800/80 bg-slate-950/30 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Operacion actual</p>
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between text-sm text-slate-300">
                  <span>Backend Azure</span>
                  <span className="rounded-full bg-emerald-400/10 px-2 py-1 text-xs text-emerald-200">Conectado</span>
                </div>
                <div className="flex items-center justify-between text-sm text-slate-400">
                  <span>Cobertura</span>
                  <span>{liveCoverage ? "Live" : "Parcial"}</span>
                </div>
                <div className="flex items-center justify-between text-sm text-slate-400">
                  <span>Sesion</span>
                  <span>JWT activa</span>
                </div>
              </div>
            </div>
          </div>

          <nav className="mt-6 flex-1 space-y-6 overflow-auto pr-1">
            {navigationGroups.map((group) => (
              <div key={group.title}>
                <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
                  {group.title}
                </p>
                <div className="space-y-1.5">
                  {group.items.map((item) => {
                    const isActive =
                      pathname === item.href ||
                      (item.href !== "/dashboard" && pathname.startsWith(item.href));

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "flex items-center justify-between rounded-2xl px-3 py-3 text-sm transition",
                          isActive
                            ? "bg-sky-400/12 text-sky-50 shadow-[inset_0_0_0_1px_rgba(56,189,248,0.22)]"
                            : "text-slate-400 hover:bg-slate-950/30 hover:text-slate-200",
                        )}
                      >
                        <span className="flex items-center gap-3">
                          <span className={cn(isActive ? "text-sky-200" : "text-slate-500")}>{iconMap[item.label]}</span>
                          {item.label}
                        </span>
                        <ChevronRight className={cn("h-4 w-4", isActive ? "text-sky-200" : "text-slate-700")} />
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          <div className="border-t border-slate-800/80 pt-5">
            <div className="rounded-2xl border border-slate-800/80 bg-slate-950/30 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-100">Auditoria reforzada</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">Toda accion sensible queda registrada con actor, dispositivo y contexto.</p>
                </div>
                <FileClock className="h-5 w-5 text-slate-600" />
              </div>
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-col gap-5">
          <header className="panel sticky top-4 z-20 rounded-3xl px-4 py-4 lg:px-5">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex flex-1 items-center gap-3">
                <div className="hidden items-center gap-2 rounded-2xl border border-slate-800/80 bg-slate-950/30 px-4 py-3 text-sm text-slate-500 md:flex md:min-w-[320px]">
                  <Search className="h-4 w-4" />
                  Buscar perfiles, incidentes, operadores o accesos
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button className="rounded-xl border border-slate-800 bg-slate-950/30 px-3 py-2 text-sm text-slate-300">
                    Azure App Service
                  </button>
                  <div
                    className={cn(
                      "rounded-xl border px-3 py-2 text-sm",
                      liveCoverage
                        ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-100"
                        : "border-amber-400/20 bg-amber-400/10 text-amber-100",
                    )}
                  >
                    {liveCoverage ? "Vista conectada a endpoints admin Azure" : "Vista parcial"}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-sm text-emerald-100">
                  <span className="h-2 w-2 rounded-full bg-emerald-300" />
                  {verificationStatus}
                </div>
                <button className="rounded-xl border border-slate-800 bg-slate-950/30 p-3 text-slate-300">
                  <Bell className="h-4 w-4" />
                </button>
                <LogoutButton />
                <div className="rounded-2xl border border-slate-800 bg-slate-950/30 px-4 py-2.5">
                  <p className="text-sm font-medium text-slate-100">{userName}</p>
                  <p className="text-xs text-slate-500">{userEmail}</p>
                </div>
              </div>
            </div>
          </header>

          <main className="min-w-0 pb-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
