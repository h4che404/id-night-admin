# ID-Night Admin — Documentación Backend MVP

> ⚠️ **Documento histórico del MVP — no usar como contrato actual.**
>
> Para el contrato vigente del admin frontend con backend, usar [`docs/BACKEND_CONTRACT.md`](./BACKEND_CONTRACT.md).
>
> Este documento quedó desactualizado respecto de la dirección actual del producto y del frontend en al menos estos puntos:
> - onboarding basado en bootstrap enriquecido
> - diferenciación entre falta de organización y falta de `primaryVenue`
> - endpoints de listas ahora consumidos con paginación obligatoria
> - alcance funcional actual (incidentes, dispositivos, access sessions y dashboard ya forman parte del contrato frontend actual)

> Este documento describe la arquitectura funcional del panel web administrativo de ID-Night,
> las entidades del dominio, los endpoints que necesita el frontend, y el alcance del MVP actual.
>
> **Última actualización**: Mayo 2026

---

## 1. Resumen del producto

ID-Night Admin es el panel web donde un **administrador de boliche** (venue) puede:

1. Iniciar sesión con una cuenta Supabase ya provisionada
2. Crear o completar el setup de su boliche
3. Gestionar usuarios de seguridad que operarán la app mobile mediante invitaciones

**Lo que NO hace la web en esta fase MVP:**
- No gestiona accesos ni escaneos (eso es la app mobile)
- No tiene dashboards con métricas
- No tiene sistema de incidentes ni alertas
- No tiene auditoría avanzada
- No gestiona dispositivos
- No tiene perfiles de personas escaneadas
- No tiene notificaciones

---

## 2. Entidades del dominio

### Account (Admin)

El usuario que accede a la web. Siempre tiene rol `ADMIN`.

```
Account
├── id: UUID
├── firstName: string
├── lastName: string
├── email: string (unique)
├── passwordHash: string
├── role: "ADMIN"
├── active: boolean
├── venueId: UUID | null (FK → Venue)
└── createdAt: datetime
```

### Venue (Boliche)

La entidad principal del sistema. Todo lo operativo ocurre dentro de un venue.

```
Venue
├── id: UUID
├── name: string (obligatorio)
├── address: string | null
├── city: string | null
├── active: boolean (default true)
├── ownerId: UUID (FK → Account)
└── createdAt: datetime
```

### SecurityUser (Usuario de seguridad)

Personal de seguridad que opera la app mobile dentro de un boliche.

```
SecurityUser
├── id: UUID
├── firstName: string
├── lastName: string
├── fullName: string (computed: firstName + lastName)
├── email: string (unique)
├── passwordHash: string
├── role: "SECURITY"
├── active: boolean (default true)
├── venueId: UUID (FK → Venue)
└── createdAt: datetime
```

### Relaciones

```
Account (1) ──── (0..1) Venue       Un admin tiene como máximo un boliche
Venue   (1) ──── (0..N) SecurityUser  Un boliche tiene muchos usuarios de seguridad
```

- Un **Account** puede tener **un Venue** (relación 1:1 en el MVP)
- Un **Venue** puede tener **muchos SecurityUser** (relación 1:N)
- Cada **SecurityUser** pertenece a exactamente **un Venue**

---

## 3. Flujos funcionales

### Flujo 1 — Login

```
Usuario accede a /login
→ Ingresa email + contraseña
→ Supabase valida credenciales
→ Frontend guarda la sesión Supabase en cookies seguras
→ Redirige a /venue
```

### Flujo 2 — Crear boliche

```
Admin accede a /venue sin tener venue
→ GET /admin/venues/mine → 404
→ Frontend muestra formulario de creación
→ Admin completa: nombre, dirección (opcional), ciudad (opcional)
→ POST /admin/venues
→ Backend crea Venue + asocia al Account
→ Frontend recarga y muestra el panel del boliche
```

### Flujo 3 — Gestionar seguridad

```
Admin accede a /venue/security
→ GET /admin/venues/mine/security-users → lista de usuarios
→ Admin puede:
   → Crear usuario: POST /admin/venues/mine/security-users
   → Activar/desactivar: PATCH /admin/venues/mine/security-users/:id/status
→ Backend crea/invita la cuenta en Supabase
→ Cada usuario queda vinculado al venue del admin con rol local
→ El usuario de seguridad podrá activar su cuenta y loguearse en la app mobile
```

---

## 4. Endpoints requeridos

### Autenticación

| Método | Ruta | Estado | Descripción |
|--------|------|--------|-------------|
| `POST` | `https://<project-ref>.supabase.co/auth/v1/token?grant_type=password` | ✅ Externo | Login admin con Supabase |
| `POST` | `https://<project-ref>.supabase.co/auth/v1/token?grant_type=refresh_token` | ✅ Externo | Refresh de sesión Supabase |
| `POST` | `https://<project-ref>.supabase.co/auth/v1/invite` | ✅ Backend/Admin API | Invitación controlada para cuentas privilegiadas |

### Perfil admin

| Método | Ruta | Estado | Descripción |
|--------|------|--------|-------------|
| `GET` | `/admin/me` | ✅ Existe | Perfil del admin logueado |
| `PUT` | `/admin/me` | 🟡 Opcional | Actualizar nombre del admin |

### Venue

| Método | Ruta | Estado | Descripción |
|--------|------|--------|-------------|
| `GET` | `/admin/venues/mine` | 🔴 Nuevo | Obtener venue del admin logueado |
| `POST` | `/admin/venues` | 🔴 Nuevo | Crear venue |
| `PUT` | `/admin/venues/mine` | 🔴 Nuevo | Actualizar datos del venue |

### Security Users

| Método | Ruta | Estado | Descripción |
|--------|------|--------|-------------|
| `GET` | `/admin/venues/mine/security-users` | 🔴 Nuevo | Listar usuarios de seguridad |
| `POST` | `/admin/venues/mine/security-users` | 🔴 Nuevo | Crear usuario de seguridad |
| `PUT` | `/admin/venues/mine/security-users/:id` | 🔴 Nuevo | Editar usuario |
| `PATCH` | `/admin/venues/mine/security-users/:id/status` | 🔴 Nuevo | Activar/desactivar usuario |

---

## 5. Contratos de request/response

### Autenticación administrativa

Las cuentas `ADMIN`, `SUPERVISOR` y `GUARD` ya no se registran desde el panel. Son **invite-only**.

- El login ocurre contra Supabase.
- El backend usa el bearer token Supabase para resolver el `Operator` local y su rol.
- El alta de nuevos operadores se hace desde un admin activo y dispara una invitación controlada.

---

### `GET /admin/venues/mine`

**Headers:** `Authorization: Bearer <accessToken>`

**Response (200):**
```json
{
  "id": "uuid-del-venue",
  "name": "Sala Prisma",
  "address": "Aristides 1120",
  "city": "Mendoza",
  "active": true
}
```

**Response (404):** cuando el admin no tiene venue asociado

---

### `POST /admin/venues`

**Headers:** `Authorization: Bearer <accessToken>`

**Request:**
```json
{
  "name": "Sala Prisma",
  "address": "Aristides 1120",
  "city": "Mendoza"
}
```

**Response (200):**
```json
{
  "id": "uuid-del-venue",
  "name": "Sala Prisma",
  "address": "Aristides 1120",
  "city": "Mendoza",
  "active": true
}
```

**Validaciones:**
- `name`: obligatorio, no vacío
- `address`: opcional
- `city`: opcional
- Un admin solo puede tener un venue (si ya tiene, devolver error 409)

---

### `PUT /admin/venues/mine`

**Headers:** `Authorization: Bearer <accessToken>`

**Request:**
```json
{
  "name": "Sala Prisma VIP",
  "address": "Aristides 1120",
  "city": "Mendoza"
}
```

**Response (200):** mismo formato que POST

---

### `GET /admin/venues/mine/security-users`

**Headers:** `Authorization: Bearer <accessToken>`

**Response (200):**
```json
[
  {
    "id": "uuid-del-user",
    "firstName": "Carlos",
    "lastName": "López",
    "fullName": "Carlos López",
    "email": "carlos@boliche.com",
    "role": "SECURITY",
    "active": true,
    "venueId": "uuid-del-venue",
    "createdAt": "2026-05-08T12:00:00Z"
  }
]
```

---

### `POST /admin/venues/mine/security-users`

**Headers:** `Authorization: Bearer <accessToken>`

**Request:**
```json
{
  "firstName": "Carlos",
  "lastName": "López",
  "email": "carlos@boliche.com",
  "password": "temporal123"
}
```

**Response (200):** mismo formato que el objeto individual del GET

**Validaciones:**
- Todos los campos obligatorios
- `email`: formato válido, único
- `password`: mínimo 8 caracteres
- El usuario queda automáticamente asociado al venue del admin logueado

---

### `PATCH /admin/venues/mine/security-users/:id/status`

**Headers:** `Authorization: Bearer <accessToken>`

**Request:**
```json
{
  "active": false
}
```

**Response (200):** objeto actualizado del usuario

**Lógica:**
- `active: false` → el usuario no puede loguearse en la app mobile
- `active: true` → el usuario puede volver a operar
- Solo se puede cambiar el estado de usuarios que pertenezcan al venue del admin

---

## 6. Validaciones generales

| Regla | Detalle |
|-------|---------|
| Email único | No puede haber dos Account ni dos SecurityUser con el mismo email |
| Password mínimo | 8 caracteres para Account y SecurityUser |
| Un venue por admin | Un Account solo puede crear un Venue en el MVP |
| Scope de seguridad | Un admin solo ve/modifica los SecurityUser de su propio venue |
| JWT obligatorio | Todos los endpoints excepto login y register requieren `Authorization: Bearer` |

---

## 7. Estructura de pantallas del frontend

```
/login              → Login (email + password)
/register           → Registro (nombre, apellido, email, password)
/venue              → Panel del boliche (o formulario de creación si no tiene venue)
/venue/security     → Listado + crear/activar/desactivar usuarios de seguridad
/venue/settings     → Editar datos del boliche
/account            → Perfil del administrador (solo lectura por ahora)
```

---

## 8. Lo que queda fuera del MVP (fases futuras)

| Feature | Prioridad estimada |
|---------|-------------------|
| Dashboard con métricas de accesos | Fase 2 |
| Gestión de access points / puertas | Fase 2 |
| Registro de accesos y escaneos en la web | Fase 2 |
| Sistema de incidentes | Fase 3 |
| Alertas y notificaciones | Fase 3 |
| Auditoría avanzada | Fase 3 |
| Gestión de dispositivos | Fase 3 |
| Múltiples venues por admin | Fase 4 |
| Roles adicionales (supervisor, operador) | Fase 4 |
| Búsqueda global | Fase 4 |
| Perfiles de personas escaneadas | Fase 4 |
