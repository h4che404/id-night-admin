# ID-Night Admin UI/UX

## Arquitectura de informacion

- Dashboard
- Locales
- Accesos / puertas
- Usuarios / perfiles
- Historial de ingresos
- Operadores
- Dispositivos
- Incidentes
- Alertas
- Auditoria
- Estado del sistema
- Configuracion
- Ayuda

## Jerarquia operativa

1. Incidentes y alertas criticas
2. Estado del sistema y de la operacion
3. Accesos y revisiones manuales
4. Identidades y verificacion
5. Gestion de operadores, dispositivos y reglas
6. Auditoria completa

## User flows principales

### Supervisor

1. Entra al dashboard.
2. Detecta incidentes abiertos o accesos en revision.
3. Abre incidente o perfil.
4. Revisa evidencia, alertas, historial y trazabilidad.
5. Confirma o descarta vinculo.
6. Crea o actualiza alerta.
7. La accion queda auditada.

### Administrador operativo

1. Revisa estado de venues, puertas y dispositivos.
2. Detecta un punto de acceso o equipo degradado.
3. Entra al modulo correspondiente.
4. Reasigna operador, dispositivo o regla.
5. Verifica que la operacion vuelva a estado estable.

### Dueño o gerente

1. Abre dashboard antes o despues del evento.
2. Escanea KPIs, incidentes, alertas y salud de sistema.
3. Baja a detalle solo en casos prioritarios.
4. Usa auditoria para reconstruir decisiones.

## Wireframe funcional

- Sidebar persistente con navegacion por dominios.
- Top bar con estado operativo, busqueda y eventos activos.
- Home como command center: KPIs, incidentes, alertas, actividad reciente y salud de dispositivos.
- Listas operativas con filtros, tablas legibles y paneles laterales de contexto.
- Vistas de detalle con resumen ejecutivo arriba y trazabilidad abajo.

## Sistema de diseño

- Base oscura premium: grafito, azul noche y superficies profundas.
- Acento principal: azul/cian para navegacion, foco y accion primaria.
- Estados:
  - Verde: verificado, permitido, operativo.
  - Ambar: revision, pendiente, warning.
  - Rojo: incidente, rechazo, critica.
  - Gris: contexto secundario o neutral.
- Tipografia: sans serif moderna, alto contraste y jerarquia compacta.
- Componentes base: cards KPI, badges, tablas, timelines, banners, filtros y paneles de detalle.

## Responsive

- Prioridad desktop y laptop.
- Sidebar fija en escritorio.
- Grillas y tablas con wrap y scroll horizontal controlado para tablet.

## MVP demo vs produccion

- El prototipo actual usa datos sinteticos y acciones no persistentes.
- La estructura visual y la navegacion ya estan pensadas para acoplarse a backend real, trazabilidad y control por roles.

## Integracion Azure actual

- Backend Azure validado: `https://backend-id-night.azurewebsites.net`
- Web admin oficial: `https://id-night-admin.vercel.app`
- Conexion del frontend: proxy server-side con cookies `httpOnly` para evitar el bloqueo CORS del backend.
- Auth administrativa real:
  - `POST /admin/auth/login`
  - `POST /admin/auth/refresh`
  - `GET /admin/me`
- Modulos live conectados hoy:
  - venues
  - access-points
  - operators
  - devices
  - profiles
  - access-sessions
  - incidents
  - alerts
  - audit
  - system health
- Hosting oficial:
  - backend en Azure App Service
  - panel admin en Vercel
- El experimento de web admin en Azure fue descartado para evitar dos frontends operativos en paralelo.
