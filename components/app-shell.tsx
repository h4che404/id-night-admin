"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  CalendarDays,
  ClipboardList,
  LogOut,
  Settings2,
  Shield,
  ShieldAlert,
  Smartphone,
  User,
} from "lucide-react";
import { type ReactNode, useState } from "react";

import { membershipRoleLabel } from "@/components/organization-membership-details";
import { cn } from "@/lib/utils";
import { navigationItems } from "@/lib/data";

/* ── Icon map ──────────────────────────────────────────────────── */

const iconMap: Record<string, ReactNode> = {
  venue: <Building2 className="h-4 w-4" />,
  events: <CalendarDays className="h-4 w-4" />,
  security: <Shield className="h-4 w-4" />,
  incidents: <ShieldAlert className="h-4 w-4" />,
  devices: <Smartphone className="h-4 w-4" />,
  settings: <Settings2 className="h-4 w-4" />,
  "access-sessions": <ClipboardList className="h-4 w-4" />,
  account: <User className="h-4 w-4" />,
};

/* ── App shell ─────────────────────────────────────────────────── */

export function AppShell({
  children,
  userName,
  userEmail,
  organizationName,
  membershipRole,
}: {
  children: ReactNode;
  userName: string;
  userEmail: string;
  organizationName?: string | null;
  membershipRole?: string | null;
}) {
  const pathname = usePathname();
  const [loggingOut, setLoggingOut] = useState(false);
  const translatedMembershipRole = membershipRoleLabel(membershipRole ?? null);

  async function handleLogout() {
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <div className="min-h-screen bg-transparent">
      <div className="mx-auto grid min-h-screen max-w-[1440px] gap-6 px-4 py-4 lg:grid-cols-[260px_minmax(0,1fr)] lg:px-6">
        {/* ── Sidebar ──────────────────────────────────────────── */}
        <aside className="panel sticky top-4 hidden h-[calc(100vh-2rem)] rounded-3xl p-5 lg:flex lg:flex-col">
          {/* Brand */}
          <div className="border-b border-slate-800/80 pb-5">
            <div className="flex items-center gap-3">
              <div className="glow-ring flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-400/10">
                <ShieldAlert className="h-5 w-5 text-sky-200" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-300/70">ID-Night</p>
                <h1 className="text-lg font-semibold text-slate-50">Admin</h1>
              </div>
            </div>
          </div>

          {/* Nav */}
          <nav className="mt-6 flex-1 space-y-1.5 overflow-auto pr-1">
            {navigationItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/venue" && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={false}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl px-3 py-3 text-sm transition",
                    isActive
                      ? "bg-sky-400/12 text-sky-50 shadow-[inset_0_0_0_1px_rgba(56,189,248,0.22)]"
                      : "text-slate-400 hover:bg-slate-950/30 hover:text-slate-200",
                  )}
                >
                  <span className={cn(isActive ? "text-sky-200" : "text-slate-500")}>
                    {iconMap[item.icon]}
                  </span>
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* User footer */}
          <div className="border-t border-slate-800/80 pt-5">
            <div className="rounded-2xl border border-slate-800/80 bg-slate-950/30 p-4">
              <p className="text-sm font-medium text-slate-100">{userName}</p>
              <p className="mt-1 text-xs text-slate-500">{userEmail}</p>
              {organizationName ? (
                <p className="mt-3 text-xs font-medium uppercase tracking-[0.14em] text-sky-300/70">
                  {organizationName}
                </p>
              ) : null}
              {translatedMembershipRole ? (
                <p className="mt-1 text-xs text-slate-400">Rol org: {translatedMembershipRole}</p>
              ) : null}
            </div>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-800 bg-slate-950/30 px-3 py-3 text-sm text-slate-400 transition hover:border-slate-700 hover:text-slate-200 disabled:opacity-60"
            >
              <LogOut className="h-4 w-4" />
              {loggingOut ? "Cerrando sesión..." : "Cerrar sesión"}
            </button>
          </div>
        </aside>

        {/* ── Main content ─────────────────────────────────────── */}
        <div className="flex min-w-0 flex-col gap-5">
          {/* Mobile header */}
          <header className="panel sticky top-4 z-20 flex items-center justify-between rounded-3xl px-4 py-4 lg:hidden">
            <div className="flex items-center gap-3">
              <div className="glow-ring flex h-9 w-9 items-center justify-center rounded-xl bg-sky-400/10">
                <ShieldAlert className="h-4 w-4 text-sky-200" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-50">ID-Night Admin</p>
                {organizationName ? (
                  <p className="text-[11px] uppercase tracking-[0.14em] text-sky-300/70">{organizationName}</p>
                ) : null}
              </div>
            </div>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="rounded-xl border border-slate-800 bg-slate-950/30 p-2.5 text-slate-400"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </header>

          <main className="min-w-0 pb-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
