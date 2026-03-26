# Plan de Desarrollo — Panel de Administración de Clínicas (SaaS)

## Concepto

Crear un **segundo panel** (`/admin`) completamente separado del panel de clínica (`/dashboard`).
El panel actual no se toca — sigue siendo el panel interno de cada clínica.
El nuevo panel es para el **equipo de Agendly** que gestiona las clínicas suscriptas.

Se necesita un nuevo rol `superadmin` que no pertenece a ninguna clínica, sino que opera a nivel plataforma.

---

## Fase 1 — Cimientos (Backend)

**Objetivo:** Roles, suscripciones y control de acceso a nivel plataforma.

### 1.1 Nuevo rol `superadmin`
- Agregar `SUPERADMIN = 'superadmin'` al enum `UserRole`
- Crear `SuperAdminGuard` — valida que `role === superadmin` y que **no necesita** `clinica_id` en el JWT
- Adaptar `JwtStrategy` para que el `clinicaId` sea opcional (los superadmin no tienen clínica)

### 1.2 Entidad `Plan`
| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID (PK) | - |
| `nombre` | string | Ej: "Starter", "Profesional", "Premium" |
| `precio_mensual` | decimal | Precio en ARS/USD |
| `max_usuarios` | int | Límite de usuarios por clínica |
| `max_pacientes` | int / null | null = ilimitado |
| `features` | jsonb | Flags de funcionalidades habilitadas |
| `is_active` | boolean | Si el plan está vigente |
| `created_at` | timestamp | - |

### 1.3 Entidad `Subscription`
| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID (PK) | - |
| `clinica_id` | UUID (FK → clinicas) | - |
| `plan_id` | UUID (FK → plans) | - |
| `estado` | enum | trial / activa / suspendida / cancelada / vencida |
| `fecha_inicio` | date | - |
| `fecha_fin` | date | - |
| `trial_ends_at` | date / null | Fin del periodo de prueba |
| `auto_renew` | boolean | Renovación automática |
| `external_reference` | string / null | ID de Mercado Pago |
| `created_at` | timestamp | - |
| `updated_at` | timestamp | - |

### 1.4 Ampliar entidad `Clinica`
- Agregar: `is_active` (boolean), `email`, `telefono`, `direccion`, `logo_url`, `fecha_registro`

### 1.5 Guard de suscripción (`SubscriptionGuard`)
- Guard global que verifica si la clínica del usuario tiene una suscripción activa/trial
- Si está suspendida/vencida → responde `403` con mensaje claro
- Se salta para `@Public()` y para `superadmin`

---

## Fase 2 — API de Administración (Backend)

**Objetivo:** CRUD completo para gestionar clínicas, planes y suscripciones.

### 2.1 Módulo `Admin`
- Protegido con `@Roles(UserRole.SUPERADMIN)`
- Endpoints:
  - `GET /admin/clinicas` — listar todas con filtros (activa, plan, fecha)
  - `GET /admin/clinicas/:id` — detalle con suscripción, usuarios, métricas
  - `PATCH /admin/clinicas/:id` — activar/suspender/editar
  - `DELETE /admin/clinicas/:id` — soft-delete

### 2.2 Módulo `Plans`
- `GET /admin/plans` — listar planes
- `POST /admin/plans` — crear plan
- `PATCH /admin/plans/:id` — editar plan
- `DELETE /admin/plans/:id` — desactivar

### 2.3 Módulo `Subscriptions`
- `GET /admin/subscriptions` — listar todas
- `POST /admin/subscriptions` — asignar plan a clínica
- `PATCH /admin/subscriptions/:id` — cambiar estado, renovar, extender trial
- Lógica automática: cron job que marca como `vencida` las suscripciones expiradas

### 2.4 Métricas de plataforma
- `GET /admin/dashboard` — KPIs globales:
  - Total clínicas activas/inactivas
  - Ingresos mensuales por suscripciones (MRR)
  - Clínicas por plan
  - Nuevos registros del mes
  - Clínicas con trial próximo a vencer

---

## Fase 3 — Panel Admin (Frontend)

**Objetivo:** Interfaz web para el equipo Agendly.

### 3.1 Estructura de rutas
```
src/app/
├── (admin)/
│   ├── layout.tsx          — AdminLayout con sidebar propio
│   └── admin/
│       ├── page.tsx        — Dashboard con KPIs de plataforma
│       ├── clinicas/
│       │   ├── page.tsx    — Tabla de clínicas con filtros
│       │   └── [id]/page.tsx — Detalle de clínica
│       ├── planes/page.tsx — CRUD de planes
│       └── suscripciones/page.tsx — Gestión de suscripciones
```

### 3.2 Sidebar del admin (separado del actual)
- Dashboard, Clínicas, Planes, Suscripciones, Configuración

### 3.3 Pantallas principales
- **Dashboard admin:** KPIs (clínicas activas, MRR, trials venciendo, gráficos de crecimiento)
- **Clínicas:** tabla con búsqueda, filtros por estado/plan, acciones rápidas (suspender, activar)
- **Detalle clínica:** info general, suscripción actual, usuarios, métricas de uso (turnos, pacientes)
- **Planes:** cards con features, precio, cantidad de clínicas usando cada plan
- **Suscripciones:** historial, cambios de plan, pagos

### 3.4 Login
- Mismo `/login` pero al detectar `superadmin` → redirigir a `/admin` en lugar de `/dashboard`

---

## Fase 4 — Billing y Pagos de Suscripción

**Objetivo:** Cobro automático de licencias.

- Integración con **Mercado Pago Suscripciones** (checkout recurrente)
- Webhooks para actualizar estado de suscripción automáticamente
- Portal de pagos para la clínica (ver su facturación, cambiar plan)
- Notificaciones por email cuando el trial/suscripción está por vencer
- Lógica de gracia: X días después de vencer antes de suspender

---

## Fase 5 — Control de Límites y Features

**Objetivo:** Aplicar restricciones según el plan contratado.

- Middleware que valida límites (max_usuarios, max_pacientes) antes de crear registros
- Feature flags desde el plan (ej: `whatsapp_enabled`, `reportes_avanzados`)
- Mostrar en el panel de clínica un banner si está cerca del límite
- Pantalla de "Upgrade" dentro del panel de clínica

---

## Fase 6 — Onboarding y Self-Service

**Objetivo:** Que las clínicas se autogestionen.

- Landing page con planes y precios
- Registro con selección de plan + periodo de trial automático (ej: 14 días)
- Configuración inicial guiada (wizard) al registrar clínica
- Panel de "Mi Suscripción" dentro del dashboard de clínica
- Cambio de plan, cancelación, descarga de facturas

---

## Lo que NO se toca

| Componente actual | Se mantiene igual |
|---|---|
| Panel `/dashboard` | Sigue siendo el panel interno de la clínica |
| Multi-tenant por `clinica_id` | Mismo mecanismo |
| Auth con JWT | Se extiende, no se reemplaza |
| Módulos existentes (turnos, pacientes, etc.) | Sin cambios |

---

## Orden de prioridad

| Fase | Prioridad | Dependencia |
|---|---|---|
| **Fase 1** — Cimientos | Crítica | Ninguna |
| **Fase 2** — API Admin | Crítica | Fase 1 |
| **Fase 3** — Panel Admin | Alta | Fase 2 |
| **Fase 4** — Billing | Alta | Fase 2 |
| **Fase 5** — Límites | Media | Fase 1 + 4 |
| **Fase 6** — Onboarding | Media | Fase 4 + 5 |
