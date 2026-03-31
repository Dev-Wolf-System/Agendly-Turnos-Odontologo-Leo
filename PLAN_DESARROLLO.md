# Plan de Desarrollo — Avax Health CRM SaaS

> Última actualización: 2026-03-30 (Fase 9.1-9.3 + 9.5 + 9.7 completadas)

---

## Fase 1: Configuración Inicial y Arquitectura ✅ COMPLETADA

- [x] Monorepo (backend NestJS + frontend Next.js)
- [x] PostgreSQL + TypeORM (synchronize: true)
- [x] Redis configurado
- [x] Estructura modular NestJS (/modules, /common, /config)
- [x] App Router Next.js (/app, /components, /services, /hooks)
- [x] TailwindCSS + Shadcn UI
- [x] JWT auth con roles (admin, odontologist, assistant)
- [x] Multi-tenant (clinica_id en JWT, guards, filtrado en services)
- [x] Guards: JwtAuthGuard, RolesGuard, ClinicaTenantGuard
- [x] Decorators: @Public, @Roles, @CurrentUser, @CurrentClinica
- [x] GlobalExceptionFilter (errores en español)
- [x] DTOs con class-validator (whitelist + forbidNonWhitelisted)
- [x] Login + Register pages
- [x] Auth provider + Theme provider (next-themes)
- [x] Repositorio Git inicializado (monorepo)

---

## Fase 2: Módulos CRUD Core ✅ COMPLETADA

### Backend (10 módulos)
- [x] **Auth** — register, login, refresh, me (crea clínica+admin automático)
- [x] **Clínicas** — GET/PATCH /clinicas/me (solo admin edita)
- [x] **Users** — CRUD completo (solo admin)
- [x] **Pacientes** — CRUD, búsqueda ILIKE, DNI único por clínica, count
- [x] **Turnos** — CRUD, validación solapamiento (excluye cancelados), filtros (fecha/estado/user_id), countToday, tipo_tratamiento (enum)
- [x] **Historial Médico** — CRUD por paciente, tenant via JOIN
- [x] **Pagos** — CRUD, filtro por turno_id, estados (pendiente/aprobado/rechazado), validación doble cobro, total y method obligatorios
- [x] **Inventario** — CRUD, alerta stock bajo, relación proveedor + categoría
- [x] **Proveedores** — CRUD, relación ManyToMany con categorías
- [x] **Categorías** — CRUD completo, asignable a inventario y proveedores

### Frontend (8 páginas + dashboard)
- [x] **Login** — email/password con manejo de errores + logo
- [x] **Register** — formulario completo (clínica + usuario admin) + logo
- [x] **Dashboard** — 4 KPI cards clickeables + 6 gráficos Recharts (datos reales)
- [x] **Pacientes** — tabla con iconos de acciones, búsqueda, CRUD con modales
- [x] **Ficha del Paciente** — vista unificada (datos + turnos + historial + pagos + KPIs)
- [x] **Turnos** — 4 KPIs (pendientes/confirmados/completados/cancelados), CRUD, calendario semanal/diario/tabla, validación solapamiento en tiempo real
- [x] **Historial Médico** — timeline profesional, búsqueda de paciente, secciones color-coded
- [x] **Pagos** — 4 KPIs por estado, columna tratamiento, iconos de acciones
- [x] **Inventario** — 3 KPIs, filtros por estado/categoría, categoría inline, fix Select UUID, progress bars
- [x] **Proveedores** — cards con gradientes, multi-categoría checkbox, filtro por categoría, badges

### Services frontend
- [x] api.ts (Axios + interceptors + refresh token)
- [x] auth.service.ts
- [x] pacientes.service.ts
- [x] turnos.service.ts
- [x] users.service.ts
- [x] pagos.service.ts
- [x] inventario.service.ts (vía api directo)
- [x] proveedores.service.ts (vía api directo)
- [x] historial-medico.service.ts (vía api directo)
- [x] dashboard.service.ts
- [x] categorias.service.ts
- [x] clinica.service.ts
- [x] tratamientos.service.ts

---

## Fase 3: Dashboard y Gráficos ✅ COMPLETADA

### Backend
- [x] Módulo Dashboard — /dashboard/stats, /dashboard/turnos-hoy, /dashboard/ingresos-mensuales, /dashboard/facturacion-diaria, /dashboard/turnos-semana, /dashboard/tratamientos-mes

### Dashboard conectado a datos reales
- [x] KPI cards: turnos hoy, pacientes, ingresos mes, stock bajo
- [x] KPIs clickeables → redirigen a la sección correspondiente
- [x] Gráfico barras: ingresos mensuales (últimos 6 meses)
- [x] Gráfico pie: distribución estado de turnos de hoy
- [x] Gráfico área: facturación diaria del mes
- [x] Gráfico líneas: turnos semana (programados vs completados)
- [x] Gráfico barras horizontal: tratamientos del mes
- [x] Lista de turnos de hoy con avatar, hora y estado

---

## Fase 4: Mejoras UI/UX ✅ COMPLETADA

### Calendario de Turnos
- [x] Vista semanal (WeekCalendar) con grid horario 7AM-9PM
- [x] Vista diaria (DayCalendar)
- [x] Vista tabla con filtros fecha/estado
- [x] Switcher Día/Semana/Tabla estilo pill
- [x] Eventos con colores por estado + hover/scale/sombra
- [x] Dot animado (pulsing) en turnos activos
- [x] Strikethrough en turnos cancelados
- [x] Layout de eventos solapados (multi-columna)
- [x] Click en slot vacío → crear turno
- [x] Click en evento → editar turno
- [x] Indicador de hora actual (línea roja con glow)
- [x] Conteo de turnos por día en header

### Acciones con iconos animados
- [x] Turnos: DollarSign (cobrar), Pencil (editar), Trash2 (eliminar) con hover:scale-110
- [x] Pacientes: Eye (ver ficha), Pencil, Trash2
- [x] Pagos: Pencil, Trash2
- [x] Inventario: Pencil, Trash2
- [x] Proveedores: Pencil, Trash2 (hover-only en cards)

### Validaciones frontend
- [x] Solapamiento de turnos: warning en tiempo real al crear/editar (debounce 400ms)
- [x] Doble cobro: warning en diálogo de cobro si ya existe pago pendiente/aprobado
- [x] Fix Select UUID en todos los formularios (patrón manual `<span>`)
- [x] Fix Select controlled/uncontrolled (sentinel `__none__`)

### Diseño profesional
- [x] Logo Avax Health en sidebar (36x36), login (64x64) y register (64x64)
- [x] KPIs con iconos y colores en todas las secciones
- [x] Empty states con iconos y mensajes descriptivos
- [x] Loading skeletons en tablas y cards
- [x] Historial médico: timeline con secciones color-coded (diagnóstico/tratamiento/observaciones)
- [x] Proveedores: card grid con avatar gradient, info de contacto con iconos
- [x] Inventario: progress bars de stock, badges de categoría

---

## Fase 5: Mejoras UI/UX Avanzadas ✅ COMPLETADA (parcial)

### Tratamientos dinámicos ✅
- [x] Backend: módulo Tratamientos completo (entity, DTOs, service, controller)
- [x] tipo_tratamiento cambiado de enum a string en turno entity y DTOs
- [x] Frontend: Select dinámico con colores y duración, fallback para históricos
- [x] Integrado en: formulario turnos, tabla, calendario, pagos

### Configuración de la clínica ✅
- [x] Nueva página `/dashboard/configuracion` con 5 tabs
- [x] Tab Clínica: datos básicos + logo por especialidad/custom
- [x] Tab Horarios: mañana/tarde independientes por día + migración automática
- [x] Tab Equipo: CRUD de profesionales
- [x] Tab Tratamientos: CRUD con nombre, duración, precio, color, estado
- [x] Tab Integraciones: webhooks + recordatorios nativos
- [x] Agregada al sidebar con ícono de engranaje

### Logo y branding dinámico ✅
- [x] Iconos SVG predeterminados por especialidad (6 especialidades)
- [x] Componente ClinicLogo reutilizable + ClinicaProvider context
- [x] Sidebar dinámico con logo y nombre de clínica real

### Webhooks y recordatorios nativos ✅
- [x] WebhookService: dispararWebhook(), dispararRecordatorio(), fire-and-forget
- [x] 6 webhooks configurables por estado de turno
- [x] Cron @EVERY_10_MINUTES para recordatorios automáticos
- [x] Fallback: webhook recordatorio → webhook confirmado

### Mejoras en formularios y errores ✅
- [x] Fix layout filtro fecha en turnos
- [x] Login: mensajes de error descriptivos (401 → "Contraseña incorrecta")
- [x] Label "Odontólogo" renombrado a "Profesional"

### Navegación cruzada entre secciones ✅
- [x] Nombre del paciente clickeable en turnos → ficha del paciente
- [x] Nombre del paciente clickeable en pagos → ficha del paciente
- [x] Desde ficha del paciente: botón "Nuevo turno" pre-cargado
- [x] Desde ficha del paciente: botón "Agregar historial" pre-cargado
- [x] Nombre del odontólogo clickeable en turnos → filtrar por odontólogo
- [x] Turno asociado con link en historial médico

### Sistema de notificaciones ✅
- [x] Backend: entidad Notificacion + endpoints CRUD + generación automática por cron
- [x] Crons: stock bajo (@30min), turnos próximos (@30min), cambio estado turno (evento)
- [x] Frontend: campana NotificationBell en header con badge, dropdown, marcar como leída
- [x] Tipos: turno_proximo, stock_bajo, pago_pendiente, turno_cancelado, turno_confirmado, turno_perdido, info

---

## Fase 6: Integración Mercado Pago (Pagos de Pacientes)

### Backend
- [ ] Crear preferencia de pago (Checkout Pro)
- [ ] Webhook para notificaciones de pago
- [ ] Actualizar estado automáticamente (pendiente → aprobado/rechazado)
- [ ] Asociación pago ↔ turno

### Frontend
- [ ] Botón de pago en detalle de turno
- [ ] Estado de pago en tiempo real
- [ ] Página éxito/error post-pago

---

## Fase 7: Integraciones Google

- [ ] **Google Calendar** — OAuth2, sincronizar turnos ↔ eventos
- [ ] **Google Docs** — exportar historial médico
- [ ] **Google Sheets** — exportar reportes financieros
- [ ] **Gmail** — notificaciones email (confirmación turno, recordatorios)

---

## Fase 8: WhatsApp + Automatizaciones (n8n) + IA

### Evolution API (WhatsApp)
- [ ] Configurar instancia Evolution API
- [ ] Recordatorio de turno (24h antes)
- [ ] Confirmación de turno
- [ ] Notificación de pago aprobado

### n8n Workflows
- [ ] Webhook endpoints en backend para n8n
- [ ] Workflow: recordatorio automático de turnos
- [ ] Workflow: seguimiento post-consulta
- [ ] Workflow: alerta stock bajo → notificación admin

### Chatbot IA (OpenAI)
- [ ] Atención al cliente vía WhatsApp
- [ ] Consulta de turnos disponibles
- [ ] Agendamiento automático por chat

---

## Fase 9: Panel de Administración SaaS (ver PLAN_ADMIN_PANEL.md)

### Fase 9.1 — Cimientos ✅
- [x] Rol `SUPERADMIN` sin clinica_id + SuperAdminGuard
- [x] JWT adaptado (clinicaId opcional), ClinicaTenantGuard skip superadmin
- [x] Entidad `Plan` (nombre, precio_mensual, max_usuarios, max_pacientes, features, is_active)
- [x] Entidad `Subscription` (clinica_id, plan_id, estado enum, fechas, trial, auto_renew)
- [x] Enum `EstadoSubscription` (trial, activa, suspendida, cancelada, vencida)
- [x] Clinica entity ampliada con `is_active` + relación Subscription
- [x] `SubscriptionGuard` global (valida suscripción activa/trial, skip @Public y superadmin)
- [x] Módulos `PlansModule` y `SubscriptionsModule` con services y CRUD

### Fase 9.2 — API Admin ✅
- [x] Módulo Admin protegido con `SuperAdminGuard`
- [x] CRUD clínicas: listar con filtros + stats, detalle, editar, soft-delete
- [x] CRUD planes: listar, crear, editar, desactivar
- [x] CRUD suscripciones: listar, detalle, crear, editar + cron diario vencimiento
- [x] Dashboard admin: KPIs (clínicas, suscripciones, MRR, clínicas por plan, trials por vencer)
- [x] DTOs de validación para todos los endpoints

### Fase 9.3 — Panel Admin Frontend ✅
- [x] Rutas `/admin` con layout y sidebar propio (diseño premium SaaS)
- [x] Dashboard con KPIs (clínicas, MRR, trials), gradientes indigo/violet
- [x] Clínicas: tabla con búsqueda, summary pills, avatares, badges de plan con corona
- [x] Detalle clínica: stats cards con gradientes + glow, secciones info/suscripción
- [x] Planes: cards con barra gradiente, precios con texto gradiente, feature pills, CTA con glow
- [x] Suscripciones: filter pills interactivos, avatares, badges, formulario 3 columnas
- [x] Login compartido con redirección por rol (superadmin → /admin)

### Fase 9.7 — Agent API (Zoe IA) ✅
- [x] `ApiKeyGuard` + `@ApiKeyAuth()` decorator (bypass JWT, validación x-api-key)
- [x] `AgentModule` con service (11 métodos) y controller (11 endpoints bajo /agent)
- [x] Cálculo de turnos disponibles desde horarios de clínica (mañana/tarde por día)
- [x] Campos nuevos en Clinica: evolution_instance, evolution_api_key, agent_nombre, agent_instrucciones
- [x] Documentación: PLAN_AGENTE_ZOE_SAAS.md + PLAN_FEATURES_SAAS.md

### Fase 9.4 — Billing SaaS
- [ ] Integración Mercado Pago Suscripciones
- [ ] Webhooks de pago recurrente
- [ ] Notificaciones de vencimiento

### Fase 9.5 — Límites y Features ✅
- [x] FeatureFlagService con cache en memoria (5min TTL)
- [x] FeatureFlagGuard global + @RequireFeature() decorator
- [x] Endpoint GET /clinicas/me/features
- [x] CommonModule global para inyección del servicio
- [x] Feature keys estándar (12 features definidas)
- [x] PLAN_TEMPLATES con 4 planes Avax (Consultorio Std/Plus, Clinica Std/Plus)
- [x] Endpoint POST /admin/plans/seed-defaults para crear planes predeterminados
- [x] Endpoint GET /admin/plans/feature-keys para listar features disponibles
- [x] Frontend: hook useFeatureFlag + useFeatureFlags con Context
- [x] Frontend: componentes UpgradePrompt y FeatureGate
- [x] FeatureFlagContext integrado en dashboard layout
- [x] FEATURE_OPTIONS actualizadas en admin planes page (12 features)
- [x] PlanLimitGuard: validación de max_usuarios y max_pacientes en POST de users y pacientes
- [x] Panel Profesional: sidebar filtrado por rol, RoleGuard en rutas restringidas
- [x] Backend: @Roles(ADMIN, ASSISTANT) en controllers de pagos, inventario, proveedores
- [x] Dashboard adaptativo: profesional ve solo sus turnos y KPIs relevantes

### Fase 9.6 — Onboarding
- [ ] Landing page con planes
- [ ] Registro con selección de plan + trial
- [ ] Wizard de configuración inicial
- [ ] Panel "Mi Suscripción" en dashboard clínica

---

## Fase 10: Producción y Escalabilidad

### Seguridad
- [ ] Rate limiting
- [ ] Helmet
- [ ] CORS configurado por ambiente
- [ ] Sanitización de datos

### Performance
- [ ] Caché Redis (turnos del día, dashboard KPIs)
- [ ] Paginación en todas las listas
- [ ] Índices DB optimizados
- [ ] Lazy loading frontend

### DevOps
- [ ] Docker (backend + frontend + postgres + redis)
- [ ] CI/CD pipeline
- [ ] Variables de entorno por ambiente (dev/staging/prod)
- [ ] Logging estructurado
- [ ] Health checks

---

## Resumen de Progreso

| Fase | Descripción | Estado |
|------|-------------|--------|
| **1** | Configuración y Arquitectura | ✅ Completada |
| **2** | Módulos CRUD Core (10 módulos + 10 páginas) | ✅ Completada |
| **3** | Dashboard y Gráficos | ✅ Completada |
| **4** | Mejoras UI/UX (calendario, KPIs, validaciones, logo) | ✅ Completada |
| **5** | Mejoras UI/UX Avanzadas (tratamientos, config, webhooks, notificaciones) | ✅ Completada |
| **6** | Integración Mercado Pago (pagos pacientes) | ❌ Pendiente |
| **7** | Integraciones Google | ❌ Pendiente |
| **8** | WhatsApp + n8n + IA | ❌ Pendiente |
| **9** | Panel Administración SaaS (7 subfases) | 🔄 En progreso (9.1-9.3 + 9.5 + 9.7 ✅) |
| **10** | Producción y Escalabilidad | ❌ Pendiente |
