export type StatusTone =
  | "neutral"
  | "info"
  | "success"
  | "warning"
  | "danger"
  /* Obsidian Trace semantic aliases (see DESIGN.md) */
  | "verified"
  | "manual"
  | "rejected";

/* ── Navigation ────────────────────────────────────────────────── */

export const navigationItems = [
  { href: "/venue", label: "Mi Boliche", icon: "venue" },
  { href: "/venue/events", label: "Eventos", icon: "events" },
  { href: "/venue/security", label: "Seguridad", icon: "security" },
  { href: "/venue/incidents", label: "Incidentes", icon: "incidents" },
  { href: "/venue/access-sessions", label: "Entradas", icon: "access-sessions" },
  { href: "/venue/settings", label: "Configuración", icon: "settings" },
  { href: "/account", label: "Mi Cuenta", icon: "account" },
] as const;
