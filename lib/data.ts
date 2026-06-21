export type StatusTone = "neutral" | "info" | "success" | "warning" | "danger";

/* ── Navigation ────────────────────────────────────────────────── */

export const navigationItems = [
  { href: "/venue", label: "Mi Boliche", icon: "venue" },
  { href: "/venue/events", label: "Events", icon: "events" },
  { href: "/venue/security", label: "Seguridad", icon: "security" },
  { href: "/venue/incidents", label: "Incidentes", icon: "incidents" },
  { href: "/venue/devices", label: "Dispositivos", icon: "devices" },
  { href: "/venue/access-sessions", label: "Entradas", icon: "access-sessions" },
  { href: "/venue/settings", label: "Configuración", icon: "settings" },
  { href: "/account", label: "Mi Cuenta", icon: "account" },
] as const;
