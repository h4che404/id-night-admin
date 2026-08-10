"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  CalendarDays,
  ClipboardList,
  Loader2,
  LogOut,
  Search,
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

/* Secondary items pinned to the sidebar bottom section. */
const secondaryIcons = new Set(["settings", "account"]);

const primaryNavItems = navigationItems.filter((item) => !secondaryIcons.has(item.icon));
const secondaryNavItems = navigationItems.filter((item) => secondaryIcons.has(item.icon));

/* ── Nav link ──────────────────────────────────────────────────── */

function NavLink({ item, pathname }: { item: (typeof navigationItems)[number]; pathname: string }) {
  const isActive =
    pathname === item.href || (item.href !== "/venue" && pathname.startsWith(item.href));

  /**
   * Prefetched on hover, never on sight.
   *
   * Viewport prefetching was turned off here for a good reason: seven sidebar links meant seven
   * routes warmed on every page load, each one reaching the backend, and that cost was paid
   * whether or not anybody clicked. Hover is the moment somebody has decided, and it buys the
   * fraction of a second between deciding and clicking.
   *
   * It is cheap now in a way it was not then. Every async page has a loading boundary, so what
   * gets warmed is the skeleton and the shared layout rather than a fully rendered page.
   */
  const [warm, setWarm] = useState(false);

  return (
    <Link
      href={item.href}
      prefetch={warm ? null : false}
      onMouseEnter={() => setWarm(true)}
      onFocus={() => setWarm(true)}
      onTouchStart={() => setWarm(true)}
      className={cn(
        "relative flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors duration-200 ease-out",
        isActive
          ? "bg-primary/10 text-foreground before:absolute before:left-0 before:top-1/2 before:h-4 before:w-0.5 before:-translate-y-1/2 before:rounded-full before:bg-primary"
          : "text-muted-foreground hover:bg-accent/40 hover:text-foreground",
      )}
    >
      <span className={cn(isActive ? "text-primary" : "text-muted-foreground")}>
        {iconMap[item.icon]}
      </span>
      {item.label}
    </Link>
  );
}

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
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen max-w-[1440px]">
        {/* ── Sidebar ──────────────────────────────────────────── */}
        <aside className="sticky top-0 hidden h-screen w-[260px] shrink-0 flex-col border-r border-border bg-sidebar lg:flex">
          {/* Brand */}
          <div className="flex items-center gap-3 px-5 pb-5 pt-6">
            <div className="flex h-9 w-9 items-center justify-center rounded-md border border-primary/30 bg-primary/10">
              <ShieldAlert className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">ID-Night</p>
              <p className="label-sm truncate text-muted-foreground">
                {organizationName ?? "Admin"}
              </p>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 space-y-0.5 overflow-y-auto px-3">
            {primaryNavItems.map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} />
            ))}
          </nav>

          {/* Bottom section */}
          <div className="px-3 pb-4">
            <div className="mb-3 flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-sm text-muted-foreground">
              <Search className="h-3.5 w-3.5" />
              <span className="flex-1 text-left">Buscar</span>
              <kbd className="rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                ⌘K
              </kbd>
            </div>

            <div className="mb-3 border-t border-border" />

            <div className="space-y-0.5">
              {secondaryNavItems.map((item) => (
                <NavLink key={item.href} item={item} pathname={pathname} />
              ))}
            </div>
          </div>

          {/* User footer */}
          <div className="border-t border-border px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-medium uppercase text-foreground">
                {userName.slice(0, 1)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{userName}</p>
                <p className="truncate text-xs text-muted-foreground">{userEmail}</p>
              </div>
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                title={loggingOut ? "Cerrando sesión..." : "Cerrar sesión"}
                aria-label={loggingOut ? "Cerrando sesión..." : "Cerrar sesión"}
                className="rounded-md p-2 text-muted-foreground transition-colors duration-200 ease-out hover:bg-accent/40 hover:text-foreground disabled:opacity-60"
              >
                {loggingOut ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <LogOut className="h-4 w-4" />
                )}
              </button>
            </div>
            {translatedMembershipRole ? (
              <p className="mt-2 truncate text-xs text-muted-foreground">
                Rol org: {translatedMembershipRole}
              </p>
            ) : null}
          </div>
        </aside>

        {/* ── Main content ─────────────────────────────────────── */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Mobile header */}
          <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-sidebar px-4 py-3 lg:hidden">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-md border border-primary/30 bg-primary/10">
                <ShieldAlert className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">ID-Night Admin</p>
                {organizationName ? (
                  <p className="label-sm text-muted-foreground">{organizationName}</p>
                ) : null}
              </div>
            </div>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              title={loggingOut ? "Cerrando sesión..." : "Cerrar sesión"}
              aria-label={loggingOut ? "Cerrando sesión..." : "Cerrar sesión"}
              className="rounded-md border border-border bg-surface p-2.5 text-muted-foreground"
            >
              {loggingOut ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LogOut className="h-4 w-4" />
              )}
            </button>
          </header>

          <main className="min-w-0 flex-1 px-4 py-6 lg:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
