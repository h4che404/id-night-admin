export type StatusTone = "neutral" | "info" | "success" | "warning" | "danger";

export type Venue = {
  id: string;
  name: string;
  city: string;
  address: string;
  category: "+18" | "+21";
  schedule: string;
  activeEvent: string;
  status: "Activo" | "Pausado";
  accessPoints: number;
  devicesOnline: number;
  occupancy: string;
};

export type AccessPoint = {
  id: string;
  venueId: string;
  name: string;
  operator: string;
  device: string;
  status: "Operativa" | "Manual review" | "Offline";
  lastActivity: string;
  throughput: string;
};

export type Operator = {
  id: string;
  name: string;
  role: "Supervisor" | "Guardia" | "Administrador";
  venue: string;
  status: "Activo" | "Inactivo" | "En pausa";
  email: string;
  documentId: string;
  lastSession: string;
  permissions: string[];
  assignedShift: string;
};

export type Device = {
  id: string;
  name: string;
  venue: string;
  accessPoint: string;
  status: "Online" | "Offline" | "Atencion";
  syncAt: string;
  appVersion: string;
  battery: string;
};

export type IdentityProfile = {
  id: string;
  name: string;
  documentMasked: string;
  verification: "Verificado" | "Pendiente" | "Rechazado" | "Suspendido" | "En revision";
  enrolledAt: string;
  consentAccepted: boolean;
  alerts: number;
  incidents: number;
  recentVenue: string;
  recentAccessResult: "Permitido" | "Revision manual" | "Rechazado";
};

export type AccessRecord = {
  id: string;
  timestamp: string;
  person: string;
  venue: string;
  gate: string;
  operator: string;
  result: "Permitido" | "Revision manual" | "Rechazado";
  reason: string;
  alert: string;
};

export type Incident = {
  id: string;
  createdAt: string;
  severity: "Baja" | "Media" | "Alta" | "Critica";
  status:
    | "Sin identidad confirmada"
    | "En revision"
    | "Confirmado"
    | "Cerrado";
  venue: string;
  operator: string;
  profileName: string;
  summary: string;
  evidence: string[];
  followUp: string;
};

export type Alert = {
  id: string;
  level: "Informativa" | "Warning" | "Critica" | "Vencida";
  profile: string;
  venue: string;
  reason: string;
  sourceIncident: string;
  expiresAt: string;
  owner: string;
};

export type AuditEvent = {
  id: string;
  at: string;
  actor: string;
  action: string;
  entity: string;
  device: string;
  outcome: string;
};

export type SystemService = {
  name: string;
  status: "Operativo" | "Inestable" | "Caido" | "Pendiente";
  latency: string;
  detail: string;
};

export const dashboardStats = [
  { label: "Accesos hoy", value: "1.284", delta: "+8.4%", tone: "info" as StatusTone },
  { label: "Permitidos", value: "1.103", delta: "85.9%", tone: "success" as StatusTone },
  { label: "Revision manual", value: "96", delta: "7.4%", tone: "warning" as StatusTone },
  { label: "Rechazados", value: "85", delta: "6.6%", tone: "danger" as StatusTone },
  { label: "Incidentes abiertos", value: "7", delta: "2 criticos", tone: "danger" as StatusTone },
  { label: "Alertas activas", value: "19", delta: "5 prioritarias", tone: "warning" as StatusTone },
  { label: "Operadores conectados", value: "23", delta: "3 supervisores", tone: "success" as StatusTone },
  { label: "Estado del sistema", value: "Estable", delta: "1 servicio degradado", tone: "info" as StatusTone },
];

export const accessMix = [
  { label: "Permitido", value: 1103, tone: "success" as StatusTone },
  { label: "Revision manual", value: 96, tone: "warning" as StatusTone },
  { label: "Rechazado", value: 85, tone: "danger" as StatusTone },
];

export const venueLoad = [
  { venue: "Sala Prisma", occupancy: 82, alerts: 2 },
  { venue: "Distrito Norte", occupancy: 71, alerts: 1 },
  { venue: "Muelle 9", occupancy: 64, alerts: 0 },
  { venue: "Ritual Club", occupancy: 91, alerts: 2 },
];

export const venues: Venue[] = [
  {
    id: "prisma",
    name: "Sala Prisma",
    city: "Mendoza",
    address: "Aristides 1120",
    category: "+21",
    schedule: "Vie-Sab 23:00-06:00",
    activeEvent: "Ciclo Apertura Invierno",
    status: "Activo",
    accessPoints: 4,
    devicesOnline: 4,
    occupancy: "82%",
  },
  {
    id: "distrito-norte",
    name: "Distrito Norte",
    city: "Godoy Cruz",
    address: "San Martin Sur 880",
    category: "+18",
    schedule: "Jue-Sab 22:00-05:00",
    activeEvent: "Previa Federal",
    status: "Activo",
    accessPoints: 3,
    devicesOnline: 2,
    occupancy: "71%",
  },
  {
    id: "muelle-9",
    name: "Muelle 9",
    city: "Mendoza",
    address: "Costanera 404",
    category: "+21",
    schedule: "Sab 23:30-06:30",
    activeEvent: "Noche de lanzamiento",
    status: "Pausado",
    accessPoints: 2,
    devicesOnline: 1,
    occupancy: "64%",
  },
];

export const accessPoints: AccessPoint[] = [
  {
    id: "gate-norte",
    venueId: "prisma",
    name: "Ingreso Norte",
    operator: "Lucia Herrera",
    device: "Pixel 8 #A12",
    status: "Operativa",
    lastActivity: "2026-05-08T02:14:00",
    throughput: "212 pers/h",
  },
  {
    id: "gate-vip",
    venueId: "prisma",
    name: "Acceso VIP",
    operator: "Tomas Varela",
    device: "Galaxy Tab S9 #D08",
    status: "Manual review",
    lastActivity: "2026-05-08T02:09:00",
    throughput: "74 pers/h",
  },
  {
    id: "gate-east",
    venueId: "distrito-norte",
    name: "Puerta Este",
    operator: "Bruno Castro",
    device: "Moto G84 #F02",
    status: "Offline",
    lastActivity: "2026-05-08T01:41:00",
    throughput: "0 pers/h",
  },
];

export const operators: Operator[] = [
  {
    id: "op-lucia-herrera",
    name: "Lucia Herrera",
    role: "Supervisor",
    venue: "Sala Prisma",
    status: "Activo",
    email: "lucia.h@idnight.demo",
    documentId: "28.***.432",
    lastSession: "2026-05-08T02:13:00",
    permissions: ["Confirmar incidentes", "Editar alertas", "Autorizar ingreso manual"],
    assignedShift: "22:00-06:00",
  },
  {
    id: "op-tomas-varela",
    name: "Tomas Varela",
    role: "Guardia",
    venue: "Sala Prisma",
    status: "Activo",
    email: "tomas.v@idnight.demo",
    documentId: "31.***.901",
    lastSession: "2026-05-08T02:08:00",
    permissions: ["Registrar incidentes", "Procesar accesos"],
    assignedShift: "23:00-05:00",
  },
  {
    id: "op-bruno-castro",
    name: "Bruno Castro",
    role: "Administrador",
    venue: "Distrito Norte",
    status: "En pausa",
    email: "bruno.c@idnight.demo",
    documentId: "29.***.118",
    lastSession: "2026-05-08T01:12:00",
    permissions: ["Gestionar dispositivos", "Configurar puertas", "Auditar actividad"],
    assignedShift: "20:00-03:00",
  },
];

export const devices: Device[] = [
  {
    id: "dev-a12",
    name: "Pixel 8 #A12",
    venue: "Sala Prisma",
    accessPoint: "Ingreso Norte",
    status: "Online",
    syncAt: "2026-05-08T02:14:00",
    appVersion: "v0.9.4",
    battery: "84%",
  },
  {
    id: "dev-d08",
    name: "Galaxy Tab S9 #D08",
    venue: "Sala Prisma",
    accessPoint: "Acceso VIP",
    status: "Atencion",
    syncAt: "2026-05-08T02:09:00",
    appVersion: "v0.9.4",
    battery: "29%",
  },
  {
    id: "dev-f02",
    name: "Moto G84 #F02",
    venue: "Distrito Norte",
    accessPoint: "Puerta Este",
    status: "Offline",
    syncAt: "2026-05-08T01:41:00",
    appVersion: "v0.9.3",
    battery: "0%",
  },
];

export const profiles: IdentityProfile[] = [
  {
    id: "camila-perez",
    name: "Camila Perez",
    documentMasked: "37.***.521",
    verification: "Verificado",
    enrolledAt: "2026-04-19T18:00:00",
    consentAccepted: true,
    alerts: 0,
    incidents: 0,
    recentVenue: "Sala Prisma",
    recentAccessResult: "Permitido",
  },
  {
    id: "joaquin-sosa",
    name: "Joaquin Sosa",
    documentMasked: "35.***.118",
    verification: "En revision",
    enrolledAt: "2026-05-02T21:10:00",
    consentAccepted: true,
    alerts: 1,
    incidents: 1,
    recentVenue: "Ritual Club",
    recentAccessResult: "Revision manual",
  },
  {
    id: "sofia-arias",
    name: "Sofia Arias",
    documentMasked: "40.***.882",
    verification: "Pendiente",
    enrolledAt: "2026-05-08T00:44:00",
    consentAccepted: true,
    alerts: 0,
    incidents: 0,
    recentVenue: "Distrito Norte",
    recentAccessResult: "Revision manual",
  },
  {
    id: "mateo-romero",
    name: "Mateo Romero",
    documentMasked: "34.***.107",
    verification: "Suspendido",
    enrolledAt: "2026-03-11T17:23:00",
    consentAccepted: true,
    alerts: 2,
    incidents: 3,
    recentVenue: "Sala Prisma",
    recentAccessResult: "Rechazado",
  },
];

export const accesses: AccessRecord[] = [
  {
    id: "acc-28401",
    timestamp: "2026-05-08T02:11:00",
    person: "Camila Perez",
    venue: "Sala Prisma",
    gate: "Ingreso Norte",
    operator: "Lucia Herrera",
    result: "Permitido",
    reason: "Mayor verificada, sin alertas",
    alert: "Ninguna",
  },
  {
    id: "acc-28402",
    timestamp: "2026-05-08T02:07:00",
    person: "Joaquin Sosa",
    venue: "Ritual Club",
    gate: "Ingreso Principal",
    operator: "Marina Costa",
    result: "Revision manual",
    reason: "Coincidencia parcial con incidente previo",
    alert: "Supervisor requerido",
  },
  {
    id: "acc-28403",
    timestamp: "2026-05-08T01:58:00",
    person: "Mateo Romero",
    venue: "Sala Prisma",
    gate: "Acceso VIP",
    operator: "Tomas Varela",
    result: "Rechazado",
    reason: "Alerta critica vigente",
    alert: "Incidente confirmado",
  },
];

export const incidents: Incident[] = [
  {
    id: "inc-9001",
    createdAt: "2026-05-08T01:56:00",
    severity: "Critica",
    status: "En revision",
    venue: "Sala Prisma",
    operator: "Tomas Varela",
    profileName: "Mateo Romero",
    summary: "Intento de ingreso con alerta activa y desacato a instruccion operativa.",
    evidence: ["Captura de acceso", "Foto de control", "Nota de supervisor"],
    followUp: "Requiere validacion del supervisor y cierre de incidente antes del proximo acceso asociado.",
  },
  {
    id: "inc-8995",
    createdAt: "2026-05-08T01:22:00",
    severity: "Alta",
    status: "Sin identidad confirmada",
    venue: "Distrito Norte",
    operator: "Bruno Castro",
    profileName: "Sin identificar",
    summary: "Documento capturado con baja nitidez y comportamiento evasivo durante revision.",
    evidence: ["Foto frontal", "Registro manual de guardia"],
    followUp: "Pendiente de confirmacion de identidad o descarte de vinculo.",
  },
  {
    id: "inc-8987",
    createdAt: "2026-05-07T23:48:00",
    severity: "Media",
    status: "Confirmado",
    venue: "Ritual Club",
    operator: "Marina Costa",
    profileName: "Joaquin Sosa",
    summary: "Ingreso demorado por inconsistencia documental. Supervisor confirmo identidad.",
    evidence: ["Registro biometrico", "Nota operativa"],
    followUp: "Mantener alerta informativa durante 14 dias.",
  },
];

export const alerts: Alert[] = [
  {
    id: "alt-411",
    level: "Critica",
    profile: "Mateo Romero",
    venue: "Sala Prisma",
    reason: "Incidente confirmado con rechazo reciente",
    sourceIncident: "inc-9001",
    expiresAt: "2026-06-07T23:59:00",
    owner: "Lucia Herrera",
  },
  {
    id: "alt-402",
    level: "Warning",
    profile: "Joaquin Sosa",
    venue: "Ritual Club",
    reason: "Seguimiento de identidad confirmada con revision previa",
    sourceIncident: "inc-8987",
    expiresAt: "2026-05-22T23:59:00",
    owner: "Marina Costa",
  },
  {
    id: "alt-390",
    level: "Informativa",
    profile: "Camila Perez",
    venue: "Sala Prisma",
    reason: "Perfil con nueva alta de consentimiento",
    sourceIncident: "N/A",
    expiresAt: "2026-05-10T18:00:00",
    owner: "Sistema",
  },
];

export const auditTrail = [
  {
    id: "aud-10091",
    at: "2026-05-08T02:12:00",
    actor: "Lucia Herrera",
    action: "Confirmo revision manual y autorizo ingreso",
    entity: "AccessSession acc-28401",
    device: "Pixel 8 #A12",
    outcome: "Registro auditado",
  },
  {
    id: "aud-10088",
    at: "2026-05-08T02:01:00",
    actor: "Tomas Varela",
    action: "Creo incidente critico",
    entity: "Incident inc-9001",
    device: "Galaxy Tab S9 #D08",
    outcome: "Supervisor pendiente",
  },
  {
    id: "aud-10074",
    at: "2026-05-08T01:34:00",
    actor: "Bruno Castro",
    action: "Actualizo regla de revision manual de Distrito Norte",
    entity: "VenueSettings distrito-norte",
    device: "Web Admin",
    outcome: "Cambio aplicado",
  },
];

export const systemServices: SystemService[] = [
  {
    name: "Backend core",
    status: "Operativo",
    latency: "183 ms",
    detail: "API estable y cola de auditoria al dia.",
  },
  {
    name: "Servicio biometrico",
    status: "Inestable",
    latency: "742 ms",
    detail: "Latencia elevada en validaciones secundarias.",
  },
  {
    name: "Sincronizacion dispositivos",
    status: "Pendiente",
    latency: "2 equipos",
    detail: "Dos dispositivos con reintento automatico activo.",
  },
  {
    name: "Notificaciones operativas",
    status: "Operativo",
    latency: "41 ms",
    detail: "Despacho sin errores en el ultimo bloque horario.",
  },
];

export const supportArticles = [
  {
    title: "Como revisar un incidente sin identidad confirmada",
    summary: "Pasos para validar evidencia, revisar trazabilidad y confirmar o descartar un vinculo.",
  },
  {
    title: "Que hacer cuando un dispositivo queda offline",
    summary: "Secuencia de chequeo rapido, criterios de bloqueo y continuidad operativa.",
  },
  {
    title: "Politica recomendada para alertas temporales",
    summary: "Buenas practicas para vigencia, responsables y cierre de seguimiento.",
  },
];

export const navigationGroups = [
  {
    title: "Operacion",
    items: [
      { href: "/dashboard", label: "Dashboard" },
      { href: "/venues", label: "Locales" },
      { href: "/access-points", label: "Accesos" },
      { href: "/profiles", label: "Usuarios" },
      { href: "/accesses", label: "Historial" },
    ],
  },
  {
    title: "Supervision",
    items: [
      { href: "/operators", label: "Operadores" },
      { href: "/devices", label: "Dispositivos" },
      { href: "/incidents", label: "Incidentes" },
      { href: "/alerts", label: "Alertas" },
      { href: "/audit", label: "Auditoria" },
    ],
  },
  {
    title: "Plataforma",
    items: [
      { href: "/system-status", label: "Estado del sistema" },
      { href: "/settings", label: "Configuracion" },
      { href: "/support", label: "Ayuda" },
    ],
  },
];

export function findVenue(id: string) {
  return venues.find((item) => item.id === id);
}

export function findOperator(id: string) {
  return operators.find((item) => item.id === id);
}

export function findProfile(id: string) {
  return profiles.find((item) => item.id === id);
}

export function findAccess(id: string) {
  return accesses.find((item) => item.id === id);
}

export function findIncident(id: string) {
  return incidents.find((item) => item.id === id);
}
