# Plan de Desarrollo — Panel de Administración de Clínicas (SaaS)

> Última actualización: 2026-04-01 (Fases 1-3 + 5 + 7 completadas, Soporte + Fixes producción)

## Concepto

Crear un **segundo panel** (`/admin`) completamente separado del panel de clínica (`/dashboard`).
El panel actual no se toca — sigue siendo el panel interno de cada clínica.
El nuevo panel es para el **equipo de Avax Health** que gestiona las clínicas suscriptas.

Se necesita un nuevo rol `superadmin` que no pertenece a ninguna clínica, sino que opera a nivel plataforma.

---

## Fase 1 — Cimientos (Backend) ✅ COMPLETADA

**Objetivo:** Roles, suscripciones y control de acceso a nivel plataforma.

### 1.1 Nuevo rol `superadmin` ✅
- [x] `SUPERADMIN = 'superadmin'` agregado al enum `UserRole`
- [x] `SuperAdminGuard` creado — valida `role === superadmin`
- [x] `JwtStrategy` adaptado — `clinicaId` es opcional (retorna `null` para superadmin)
- [x] `JwtPayload` interface — `clinicaId` ahora es `string | undefined`
- [x] `ClinicaTenantGuard` — skip para superadmin
- [x] `CurrentClinica` decorator — retorna `null` para superadmin
- [x] `TenantBaseEntity` — `clinica_id` nullable para superadmin
- [x] `AuthService.generateTokens()` — omite `clinicaId` si no existe

### 1.2 Entidad `Plan` ✅
- [x] Archivo: `backend/src/modules/plans/entities/plan.entity.ts`
- [x] Campos: nombre, precio_mensual (decimal), max_usuarios, max_pacientes (nullable), features (jsonb), is_active
- [x] Relación OneToMany con Subscription

### 1.3 Entidad `Subscription` ✅
- [x] Archivo: `backend/src/modules/subscriptions/entities/subscription.entity.ts`
- [x] Campos: clinica_id, plan_id, estado (enum), fecha_inicio, fecha_fin, trial_ends_at, auto_renew, external_reference
- [x] Enum `EstadoSubscription`: trial, activa, suspendida, cancelada, vencida
- [x] Relaciones ManyToOne con Clinica y Plan

### 1.4 Ampliar entidad `Clinica` ✅
- [x] Campo `is_active` (boolean, default true) agregado
- [x] Relación OneToMany con Subscription agregada

### 1.5 Guard de suscripción (`SubscriptionGuard`) ✅
- [x] Guard global registrado en AppModule
- [x] Verifica suscripción activa/trial para la clínica del usuario
- [x] Mensajes descriptivos por estado (suspendida, vencida, cancelada, trial expirado)
- [x] Skip para `@Public()` y para `superadmin`

### 1.6 Módulos base ✅
- [x] `PlansModule` (entity + service + CRUD básico)
- [x] `SubscriptionsModule` (entity + service + CRUD + cron vencimiento)
- [x] Ambos registrados en AppModule

---

## Fase 2 — API de Administración (Backend) ✅ COMPLETADA

**Objetivo:** CRUD completo para gestionar clínicas, planes y suscripciones.

### 2.1 Módulo `Admin` — Clínicas ✅
- [x] Protegido con `SuperAdminGuard`
- [x] `GET /admin/clinicas` — listar todas con filtros (is_active, plan_id, search) + stats (usuarios, pacientes, turnos)
- [x] `GET /admin/clinicas/:id` — detalle con suscripción activa, usuarios, métricas
- [x] `PATCH /admin/clinicas/:id` — editar (nombre, email, cel, dirección, is_active)
- [x] `DELETE /admin/clinicas/:id` — soft-delete (is_active = false)

### 2.2 Módulo `Plans` ✅
- [x] `GET /admin/plans` — listar todos (incluye inactivos para admin)
- [x] `POST /admin/plans` — crear plan (con validación DTO)
- [x] `PATCH /admin/plans/:id` — editar plan
- [x] `DELETE /admin/plans/:id` — desactivar (soft-delete)

### 2.3 Módulo `Subscriptions` ✅
- [x] `GET /admin/subscriptions` — listar todas con relaciones clinica + plan
- [x] `GET /admin/subscriptions/:id` — detalle
- [x] `POST /admin/subscriptions` — asignar plan a clínica
- [x] `PATCH /admin/subscriptions/:id` — cambiar estado, renovar, extender trial
- [x] Cron `@EVERY_DAY_AT_2AM` que marca como `vencida` las suscripciones expiradas
- [x] Método `createTrialForClinica()` para asignar trial de N días

### 2.4 Métricas de plataforma ✅
- [x] `GET /admin/dashboard` — KPIs globales:
  - Total clínicas (activas, inactivas, nuevas del mes)
  - Suscripciones (activas, trial, trials por vencer en 7 días)
  - MRR (Monthly Recurring Revenue)
  - Clínicas por plan (agrupado)
  - Lista de planes activos

### 2.5 DTOs de validación ✅
- [x] `CreatePlanDto` (nombre, precio_mensual, max_usuarios, max_pacientes, features, is_active)
- [x] `UpdatePlanDto` (todos opcionales)
- [x] `CreateSubscriptionDto` (clinica_id, plan_id, estado, fechas)
- [x] `UpdateSubscriptionDto` (estado, fecha_fin, trial_ends_at, auto_renew)
- [x] `UpdateClinicaAdminDto` (nombre, email, cel, direccion, is_active)

---

## Fase 3 — Panel Admin (Frontend) ✅ COMPLETADA

**Objetivo:** Interfaz web para el equipo Avax Health.

### 3.1 Estructura de rutas ✅
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

### 3.2 Sidebar del admin (separado del actual) ✅
- [x] Dashboard, Clínicas, Planes, Suscripciones, Soporte
- [x] Sidebar colapsable con branding Avax Health
- [x] Indicador de sección activa

### 3.3 Pantallas principales ✅
- [x] **Dashboard admin:** KPIs (clínicas activas, MRR, trials venciendo), diseño premium con gradientes indigo/violet
- [x] **Clínicas:** tabla con búsqueda, summary pills (total/activas/inactivas), avatares con iniciales, badges de plan con corona, acciones hover
- [x] **Detalle clínica:** breadcrumb, stats cards con gradientes (blue/pink/indigo/emerald) + glow shadows, secciones info/suscripción con iconos
- [x] **Planes:** cards con barra gradiente superior (indigo→violet), precios con texto gradiente, feature pills con checks, botón CTA con shadow glow
- [x] **Suscripciones:** filter pills interactivos por estado, avatares, badges de plan, indicadores de auto-renovación, formulario 3 columnas

### 3.4 Login ✅
- [x] Mismo `/login` pero al detectar `superadmin` → redirigir a `/admin` en lugar de `/dashboard`

### 3.5 Diseño Premium SaaS ✅
- [x] rounded-2xl cards, gradient accents (indigo/violet), shadow-glow
- [x] uppercase tracking labels, hover transitions, loading skeletons
- [x] Dot indicators para estados, crown icons para planes, group hover opacity

---

### 3.6 Módulo Soporte/Tickets ✅
- [x] Backend: entity Ticket (asunto, descripcion, categoria, prioridad, estado, respuesta_admin)
- [x] Backend: endpoints clínica (crear/listar tickets) + admin (listar all, responder, cambiar estado, stats)
- [x] Frontend admin: /admin/soporte con KPIs, filtros, lista + panel detalle con respuesta
- [x] Frontend clínica: integrado en /dashboard/suscripcion (crear tickets + ver respuestas)

---

## Fase 4 — Billing y Pagos de Suscripción

**Objetivo:** Cobro automático de licencias.

- Integración con **Mercado Pago Suscripciones** (checkout recurrente)
- Webhooks para actualizar estado de suscripción automáticamente
- Portal de pagos para la clínica (ver su facturación, cambiar plan)
- Notificaciones por email cuando el trial/suscripción está por vencer
- Lógica de gracia: X días después de vencer antes de suspender

---

## Fase 5 — Control de Límites y Features ✅ COMPLETADA

**Objetivo:** Aplicar restricciones según el plan contratado.

- [x] FeatureFlagService + FeatureFlagGuard + @RequireFeature() decorator
- [x] PlanLimitGuard: validación max_usuarios y max_pacientes
- [x] Frontend: useFeatureFlag, FeatureGate, UpgradePrompt
- [x] Panel Profesional: sidebar filtrado por rol, RoleGuard en rutas

---

## Fase 6 — Onboarding y Self-Service 🔄 EN PROGRESO

**Objetivo:** Que las clínicas se autogestionen.

- [ ] Landing page con planes y precios
- [ ] Registro con selección de plan + periodo de trial automático (ej: 14 días)
- [ ] Configuración inicial guiada (wizard) al registrar clínica
- [x] Panel "Mi Suscripción" dentro del dashboard de clínica (KPIs, detalles, pagos, soporte)
- [ ] Cambio de plan, cancelación, descarga de facturas

---

## Fase 7 — Agent API (Backend) ✅ COMPLETADA

**Objetivo:** API para que el agente IA (Zoe) vía n8n consuma datos de las clínicas.

### 7.1 Autenticación por API Key ✅
- [x] `ApiKeyGuard` — valida header `x-api-key` contra `AGENT_API_KEY` del .env
- [x] `@ApiKeyAuth()` decorator — combina `@Public()` + `IS_API_KEY_AUTH` metadata
- [x] Bypass de JWT, ClinicaTenantGuard y SubscriptionGuard para rutas con API key
- [x] Guard registrado globalmente en AppModule

### 7.2 AgentModule ✅
- [x] `AgentService` con 11 métodos: findClinicaByInstance, getClinicaInfo, findPacienteByPhone, findPacienteByDni, getTurnosDisponibles, verificarTurnoExistente, crearTurno, registrarPaciente, actualizarEstadoTurno, getTurnosProximos, emitWebhookEvent
- [x] `AgentController` con endpoints bajo `/agent` protegidos por `@ApiKeyAuth()`
- [x] Cálculo inteligente de slots disponibles desde horarios de clínica (mañana/tarde por día)
- [x] Validación de solapamiento, detección de duplicados por DNI/teléfono
- [x] Source `WHATSAPP` en turnos creados por el agente

### 7.3 Campos nuevos en Clinica entity ✅
- [x] `evolution_instance` — nombre de instancia Evolution API
- [x] `evolution_api_key` — API key de Evolution API
- [x] `agent_nombre` — nombre del agente (default: "Zoe")
- [x] `agent_instrucciones` — instrucciones personalizadas del agente

### 7.4 Documentación ✅
- [x] `PLAN_AGENTE_ZOE_SAAS.md` — plan completo del agente multi-tenant
- [x] `PLAN_FEATURES_SAAS.md` — features enterprise SaaS pendientes (dunning, enforcement, etc.)

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
| **Fase 3** — Panel Admin | ✅ Completada | Fase 2 |
| **Fase 4** — Billing | Alta | Fase 2 |
| **Fase 5** — Límites | ✅ Completada | Fase 1 |
| **Fase 6** — Onboarding | 🔄 En progreso | Fase 4 + 5 |
| **Fase 7** — Agent API | ✅ Completada | Fase 1 |
