# Hoja de Ruta — Reestilizado y Mejoras UI/UX

> Última actualización: 2026-04-12

## Fixes aplicados
- [x] Select de Paciente y Odontólogo en Nuevo Turno mostraba UUID en vez del nombre — corregido con display manual
- [x] Select de Proveedor en Inventario mostraba UUID — corregido con patrón `<span>`
- [x] Select controlled/uncontrolled error — corregido con sentinel `__none__`
- [x] Doble cobro permitido — validación backend + warning frontend
- [x] 400 Bad Request en cobro (turno_id faltaba en FilterPagosDto) — corregido
- [x] Search dropdown oculto en historial médico — fix overflow-visible + z-50
- [x] Solapamiento de turnos sin aviso — validación frontend en tiempo real

## Infraestructura
- [x] Repositorio Git inicializado (monorepo: backend + frontend)
- [x] `.gitignore` configurado (raíz, backend, frontend)
- [x] Commit inicial + commits de mejoras UI
- [ ] Subir a GitHub remoto (pendiente `git remote add` + `git push`)

---

## Fase A: Ficha del Paciente (Vista Unificada) ✅ COMPLETADA

### Backend
- [x] Endpoint GET `/pacientes/:id/ficha`

### Frontend
- [x] Nueva página `/dashboard/pacientes/[id]`
- [x] Secciones: datos personales, turnos, historial médico, pagos
- [x] KPI cards en la ficha
- [x] Botón "Ver" en tabla de pacientes

---

## Fase B: Mejoras Visuales y Funcionales ✅ COMPLETADA

### Categorías
- [x] Módulo Categorías backend completo (entity, DTOs, service, controller)
- [x] Categoría asignable a ítems de inventario (ManyToOne)
- [x] Categorías múltiples en proveedores (ManyToMany)
- [x] Creación inline de categorías desde inventario y proveedores
- [x] Filtro por categoría en inventario y proveedores

### Calendario de Turnos
- [x] Vista semanal, diaria y tabla con switcher pill
- [x] Eventos con colores por estado, hover/scale, dot animado
- [x] Conteo de turnos por día, indicador hora actual
- [x] Click en slot → crear turno, click en evento → editar

### KPIs en todas las secciones
- [x] Dashboard: 4 KPIs clickeables → redirigen a secciones
- [x] Turnos: pendientes, confirmados, completados, cancelados
- [x] Pagos: aprobados, pendientes, rechazados, total
- [x] Inventario: total, stock normal, stock bajo

### Acciones con iconos
- [x] Todas las tablas/cards usan iconos Lucide con hover:scale-110
- [x] Proveedores: acciones hover-only en cards

### Validaciones
- [x] Solapamiento turnos: warning en tiempo real + botón deshabilitado
- [x] Doble cobro: warning en diálogo de cobro

### Branding
- [x] Logo Avax Health en sidebar, login y register

---

## Fase C: Tratamientos Dinámicos y Mejoras de Formularios ✅ COMPLETADA

### Tratamientos dinámicos
- [x] Backend: módulo Tratamientos completo (entity, DTOs, service, controller)
- [x] tipo_tratamiento cambiado de enum a string en turno entity y DTOs
- [x] Frontend: Select dinámico de tratamientos con colores y duración
- [x] Fallback TRATAMIENTOS_LABELS para turnos históricos
- [x] Tratamientos integrados en: formulario turnos, tabla, calendario, pagos

### Mejoras en filtros y formularios
- [x] Fix layout filtro fecha en turnos (label encima del input, no al lado)
- [x] Label "Odontólogo" renombrado a "Profesional"
- [x] Login: mensajes de error descriptivos (401 → "Contraseña incorrecta")

---

## Fase D: Logo de Clínica y Branding Dinámico ✅ COMPLETADA

### Logo por especialidad
- [x] Iconos SVG predeterminados por especialidad (odontología, kinesiología, nutrición, etc.)
- [x] Componente ClinicLogo reutilizable
- [x] Selector de icono por especialidad en configuración
- [x] Opción "Logo Propio" con upload de imagen (2MB máx)
- [x] Convención `__esp:especialidad` para iconos default vs data URI para custom

### ClinicaProvider
- [x] Context global React para datos de clínica (logo, nombre, especialidad)
- [x] Sidebar dinámico: muestra logo y nombre de la clínica real
- [x] Hook useClinica() disponible en toda la app

---

## Fase E: Configuración de la Clínica ✅ COMPLETADA

### Página `/dashboard/configuracion`
- [x] 5 tabs: Clínica, Horarios, Equipo, Tratamientos, Integraciones
- [x] Agregada al sidebar con ícono de engranaje

### Tab Clínica
- [x] Datos básicos (nombre, dirección, teléfono, especialidad)
- [x] Sección de logo con preview y selector de especialidad/custom

### Tab Horarios
- [x] Horarios mañana/tarde independientes por día (lunes a sábado)
- [x] Switches independientes para cada turno (mañana amber, tarde indigo)
- [x] Migración automática de formato viejo a nuevo (migrateHorarios)

### Tab Equipo
- [x] Lista de profesionales con roles
- [x] CRUD de usuarios del equipo

### Tab Tratamientos
- [x] CRUD de tratamientos con nombre, duración, precio, color, estado

### Tab Integraciones
- [x] 6 webhooks configurables por estado (confirmado, completado, cancelado, perdido, pendiente, recordatorio)
- [x] Switch + URL input por cada webhook
- [x] Visor de ejemplo JSON del payload
- [x] Card de recordatorio nativo con selector de horas (2/4/12/24/48)
- [x] Explicación paso a paso del sistema de recordatorios

---

## Fase F: Webhooks y Recordatorios Nativos ✅ COMPLETADA

### Backend — WebhookService
- [x] Servicio WebhookService con dispararWebhook() y dispararRecordatorio()
- [x] Payload completo: horario, paciente, tratamiento, estado_turno, estado_pago, profesional, clínica
- [x] Fire-and-forget (no bloquea la API)
- [x] Webhooks disparados en: crear turno (pendiente), cambiar estado

### Backend — Recordatorios nativos
- [x] Campo recordatorio_enviado en turno entity
- [x] Campo recordatorio_horas_antes en clínica entity
- [x] Cron @EVERY_10_MINUTES para enviar recordatorios
- [x] Query inteligente: start_time <= NOW() + interval horas
- [x] Fallback: webhook recordatorio → webhook confirmado

### Frontend — Configuración webhooks
- [x] Campos webhooks y recordatorio_horas_antes en clinica.service.ts
- [x] UI completa en tab Integraciones de configuración

---

## Fase G: Sistema de Notificaciones ✅ COMPLETADA

### Backend
- [x] Entidad Notificacion (tipo, titulo, mensaje, leida, metadata, user_id)
- [x] Enum TipoNotificacion (turno_proximo, stock_bajo, pago_pendiente, turno_cancelado, turno_confirmado, turno_perdido, info)
- [x] Endpoints: GET /, GET /sin-leer, GET /count, PATCH /leer-todas, PATCH /:id/leer, DELETE /:id
- [x] Cron @EVERY_30_MINUTES: verificar stock bajo (sin duplicar notificaciones existentes)
- [x] Cron @EVERY_30_MINUTES: verificar turnos próximos (1 hora antes)
- [x] Notificaciones automáticas al cambiar estado de turno (confirmado, cancelado, perdido)

### Frontend
- [x] Servicio notificaciones.service.ts
- [x] Componente NotificationBell con dropdown en header
- [x] Badge con contador de sin leer (polling cada 60s)
- [x] Iconos y colores por tipo de notificación
- [x] Marcar como leída (individual y todas)
- [x] Eliminar notificación
- [x] Click en notificación → navega a la sección relevante
- [x] Empty state y timeAgo relativo

---

## Fase H: Navegación Cruzada entre Secciones ✅ COMPLETADA

- [x] Nombre del paciente clickeable en turnos → ficha
- [x] Nombre del paciente clickeable en pagos → ficha
- [x] Desde ficha: botón "Nuevo turno" pre-cargado
- [x] Desde ficha: botón "Agregar historial" pre-cargado
- [x] Odontólogo clickeable → filtrar turnos
- [x] Turno asociado con link en historial médico

---

## Mejoras Extra Post-Fases ✅ COMPLETADAS

### Sidebar profesional colapsable
- [x] SidebarProvider context (collapsed, mobileOpen) con localStorage persistido
- [x] Animación suave 300ms de colapso/expansión
- [x] Tooltips cuando está colapsado
- [x] Indicador de sección activa (barra lateral izquierda)
- [x] Mobile: overlay con backdrop blur, cierra con Escape o cambio de ruta
- [x] Botón hamburguesa en header para mobile
- [x] Fix overflow horizontal al colapsar (overflow-hidden condicional)

### Welcome Banner
- [x] Saludo por hora del día (Buenos días/tardes/noches) con emoji
- [x] Muestra nombre del usuario y nombre de la clínica
- [x] Fecha actual en español
- [x] Frase motivacional rotativa diaria (6 frases)
- [x] Dismissable con X, animación slide-in-from-top

### Health Loader animado
- [x] Pantalla de carga temática de salud
- [x] Corazón central con pulse + 4 iconos orbitando (diente, píldora, escudo, estetoscopio)
- [x] Ring exterior con ping animation
- [x] Dot bounce progress indicator
- [x] Reemplaza "Cargando..." plano en dashboard layout

### Rediseño pagos profesional
- [x] Gráfico donut por método de pago (Recharts PieChart)
- [x] Cards breakdown por método con progress bars
- [x] Búsqueda de pacientes en la tabla
- [x] Acciones rápidas (aprobar/rechazar) para pagos pendientes
- [x] Export CSV con BOM UTF-8
- [x] KPI "Ticket Promedio"
- [x] Iconos por método de pago en tabla y formulario
- [x] Fix: pagos no aparecían (DTO forbidNonWhitelisted rechazaba query params)
- [x] Fix: turno select mostraba UUID (reemplazado con span lookup)
- [x] Fix: header buttons desalineados (overflow-hidden → min-w-0 + z-10)
- [x] Fix: breadcrumbs null rompía justify-between en dashboard

---

## Fase I: Panel Admin SaaS — Diseño Premium ✅ COMPLETADA

### Layout y navegación
- [x] AdminLayout con sidebar propio separado del dashboard de clínica
- [x] Sidebar colapsable con branding Avax Health
- [x] Redirección automática superadmin → /admin

### Dashboard Admin
- [x] KPIs de plataforma (clínicas, MRR, trials)
- [x] Diseño premium con gradientes indigo/violet

### Clínicas
- [x] Summary pills (total/activas/inactivas)
- [x] Tabla con avatares de iniciales, stats en pills
- [x] Crown icon para badges de plan, dot indicators para estado
- [x] Group hover opacity transitions en acciones

### Detalle Clínica
- [x] Breadcrumb con arrow+chevron
- [x] Stats cards con gradient icons (blue/pink/indigo/emerald) + glow shadows
- [x] Secciones info/suscripción con header icons
- [x] Estado badges con colored dots, precio con gradient text

### Planes
- [x] Cards con barra gradiente superior (indigo→violet)
- [x] Precios con gradient text
- [x] Límites en bg-muted rows, feature pills con check icons
- [x] Feature toggle checkboxes con active ring styling
- [x] Botón CTA gradiente con shadow glow

### Suscripciones
- [x] Filter pills interactivos por estado (click to filter/defilter)
- [x] Tabla con avatares, plan badges con crown icon
- [x] Estado badges con colored dots
- [x] Auto-renovación como green/gray pill
- [x] Formulario en grid de 3 columnas

---

## Fase J: Rebranding y Mejoras UX ✅ COMPLETADA

### Rebranding Global
- [x] Renombrado Agendly → Avax Health en todo el codebase
- [x] Variables CSS, metadata, textos UI, documentación

### Panel Clínica — Configuración
- [x] Tab Integraciones: solo toggles por evento (URLs manejadas por admin)
- [x] Tab WhatsApp/IA: removidos campos Evolution API y prompt del agente
- [x] Tab WhatsApp/IA: toggle activar/desactivar agente + nombre editable

### Panel Admin — Clínicas
- [x] Listado de clínicas en cards con grid responsive (1/2/3 columnas)
- [x] Cards con gradientes, avatares, stats, badges de plan y estado
- [x] Detalle clínica: configuración de webhooks (URL + toggle por evento)
- [x] Detalle clínica: configuración Evolution API (instance + API key)
- [x] Detalle clínica: zona peligrosa — eliminar con confirmación doble (nombre + contraseña)

### Backend Admin
- [x] UpdateClinicaAdminDto ampliado: webhooks, evolution_instance, evolution_api_key, agent_nombre, agent_instrucciones
- [x] SubscriptionGuard con degradación graduada (full → read_only → blocked)
- [x] Nuevos estados: past_due, gracia con grace_period_ends_at
- [x] Endpoint subscription-status para banner frontend

### Dashboard Clínica — Rediseño Premium
- [x] KPI cards con gradientes, glow effects, hover animations
- [x] Loading skeleton consistente con panel admin
- [x] Gráficos con estilo premium (rounded bars, gradient areas, tooltips estilizados)
- [x] Tratamientos del mes en progress bars en lugar de bar chart horizontal
- [x] Turnos de hoy con avatares gradiente y layout mejorado

---

## Fase L: Chat Interno, Rediseño Pacientes/Ficha, Dashboard Configurable ✅ COMPLETADA

### Chat Interno
- [x] Backend: módulo Chat completo (entity, DTOs, service, controller)
- [x] Mensajes generales (canal) y directos (DM)
- [x] Indicadores de lectura (check/double-check)
- [x] Heartbeat + tracking de usuarios online (in-memory, 30s threshold)
- [x] Conteo de no leídos por usuario/canal
- [x] Vaciar chat (solo admin)
- [x] Frontend: widget flotante con lista de conversaciones, badges, estado online

### Rediseño Pacientes
- [x] Vista dual: cards con gradientes + lista compacta (toggle)
- [x] Filtros y búsqueda mejorados
- [x] Select de ordenamiento con labels correctos (fix "apellido:ASC" → "Apellido A-Z")
- [x] Avatares con gradientes por hash de ID

### Rediseño Ficha Médica
- [x] Hero header con avatar gradiente, iconos de contacto, decoración de fondo
- [x] KPI cards con gradientes temáticos e iconos Lucide
- [x] Timeline visual para últimos procedimientos
- [x] Tabs modernos con iconos y empty states ilustrados
- [x] Badges de estado con colores semánticos

### Dashboard Configurable
- [x] Secciones reordenables con drag-and-drop (HTML5 API)
- [x] Orden persistido por rol en localStorage
- [x] Estado de turnos al inicio para médico/secretaria
- [x] Toggle editar/bloquear disposición

### Visibilidad de KPIs por Rol
- [x] Campo `kpi_visibility` (jsonb) en entidad Clinica
- [x] Tab "Dashboard" en configuración (admin)
- [x] Switches por rol (Profesional/Secretaria) para cada KPI y sección
- [x] Dashboard filtra KPIs y secciones según config guardada
- [x] Admin siempre ve todo

### Auto-generación de Pagos
- [x] Al crear turno con tratamiento con precio, se genera pago pendiente automáticamente
- [x] Lookup por nombre de tratamiento activo de la clínica

### Fixes Críticos
- [x] Fix hooks error: `useFeatureFlagProvider` movido antes de returns condicionales
- [x] Fix turnos no cargaba datos: `@Roles(ADMIN)` removido a nivel clase en UsersController
- [x] Panel médico sin datos financieros, secretaria muestra conteo no montos
- [x] Sidebar: nombre clínica con font dinámico, logo actualizado a Avax Health
- [x] Rebranding BD: username `avax_health`, database `Avax_Health_BDs`

---

## Fase M: Rename Professional + Mi Suscripción + Soporte Tickets ✅ COMPLETADA

### Rename odontologist → professional
- [x] Backend: enum UserRole solo tiene SUPERADMIN, ADMIN, PROFESSIONAL, ASSISTANT
- [x] Backend: historial-medico controller actualizado @Roles
- [x] Backend: pacientes.service.ts — campo API `odontologo` → `profesional`
- [x] Frontend: types/index.ts, users.service.ts, pacientes.service.ts — role type actualizado
- [x] Frontend: sidebar.tsx, chat-widget.tsx — role labels y colores
- [x] Frontend: turnos/page.tsx — variables, filtros, labels (odontologos→profesionales)
- [x] Frontend: configuracion/page.tsx — ROLE_LABELS, roleColor, ROLES, KPI defaults
- [x] Frontend: historial-medico/page.tsx — RoleGuard roles
- [x] Frontend: pacientes/[id]/page.tsx — campo turno.profesional

### Página "Mi Suscripción" (dashboard clínica)
- [x] Backend: GET /subscriptions/mi-suscripcion — nuevo controller + module update
- [x] Frontend: /dashboard/suscripcion/page.tsx
- [x] 4 KPI cards premium (estado, plan, días restantes, próximo pago)
- [x] Detalles de suscripción con progress bar y features
- [x] Historial de pagos con tabla
- [x] Soporte técnico: lista de tickets expandibles + dialog para crear
- [x] Servicios: tickets.service.ts, subscriptions.service.ts
- [x] Sidebar: "Mi Suscripción" con icono BadgeCheck

### Módulo de Tickets/Soporte (backend)
- [x] Entity Ticket con enums: CategoriaTicket, PrioridadTicket, EstadoTicket
- [x] DTOs: CreateTicketDto, RespondTicketDto, UpdateEstadoTicketDto
- [x] Service: CRUD clínica + findAllAdmin con JOINs + stats por estado
- [x] Controller: endpoints clínica (POST/GET) + admin (SuperAdminGuard)
- [x] Registrado en app.module.ts

### Panel Admin — Soporte/Incidencias
- [x] /admin/soporte/page.tsx — gestión de tickets
- [x] KPIs: total, abiertos, esperando, resueltos
- [x] Filtros: estado, categoría, prioridad + búsqueda
- [x] Lista de tickets con badges de estado/prioridad/categoría
- [x] Panel lateral de detalle con respuesta y cambio de estado
- [x] Sidebar admin: "Soporte" con icono Ticket

---

## Fase N: Fixes de Producción ✅ COMPLETADA

### Turnos — Móvil y Profesional
- [x] CalendarHeader: toggle vista visible en móvil con iconos (Lista/Día/Semana), ya no se oculta
- [x] Vista por defecto cambiada de "semana" a "tabla" (lista) — más usable en móvil
- [x] Profesionales solo ven sus propios turnos (tabla + calendario filtrado por user_id)

### UI General
- [x] Welcome banner: 8 mensajes genéricos de salud sin enfoque a especialidad
- [x] Login: logo agrandado a 96px con shadow, removido link de registro público
- [x] "Mi Suscripción" visible para todos los roles (no solo admin)

### Debug
- [x] Chat: console.error en handleSend para debugging (en vez de silent fail)

---

## Fase O: Planes Dinámicos + Registro Premium + Auto-Trial ✅ COMPLETADA

### Backend — Plan entity ampliado
- [x] Nuevos campos: descripcion, is_highlighted, is_default_trial, orden
- [x] Endpoint público GET /plans (sin auth, @Public) para landing page
- [x] Plan Trial Gratuito agregado a PLAN_TEMPLATES (precio $0, 2 usuarios, 50 pacientes)
- [x] 5 templates: Trial + 4 pagos con descripciones, orden y flags
- [x] DTOs actualizados (CreatePlanDto, UpdatePlanDto) con nuevos campos
- [x] FEATURE_LABELS exportable para display de features

### Backend — Auto-asignación de trial
- [x] AuthService.register() inyecta PlansService + SubscriptionsService
- [x] Al registrarse: busca plan con is_default_trial=true, crea subscription trial 14 días
- [x] AuthModule importa PlansModule + SubscriptionsModule

### Frontend — Landing /planes dinámica
- [x] Fetch desde GET /plans en vez de datos hardcodeados
- [x] Features mapeadas con FEATURE_LABELS
- [x] Badge "Mas popular" controlado por is_highlighted desde DB
- [x] Descripción del plan visible
- [x] Loading skeleton mientras carga
- [x] plans.service.ts creado para endpoint público

### Frontend — Formulario de registro multi-step premium
- [x] Step 0: Selección de plan (cards interactivas con radio visual, features, precios)
- [x] Step 1: Datos de la clínica (con chip del plan seleccionado + botón "Cambiar")
- [x] Step 2: Cuenta admin (show/hide password, validación real-time, resumen, badge seguridad)
- [x] Stepper visual con iconos, navegación entre pasos, estados done/active/pending
- [x] Si llega con ?plan=<id> desde landing, salta al step 1 automáticamente
- [x] Suspense boundary para useSearchParams

### Frontend — Admin planes mejorado
- [x] Campos: descripcion, is_highlighted, is_default_trial, orden editables
- [x] Badges de estado: "Destacado", "Trial", "Inactivo"
- [x] Número de orden visible en cards

---

## Fase P: Bugs Admin + Flujo Trial + Rediseño HEALTH_TRUST ✅ COMPLETADA

### P1: Bug Fixes Admin Panel ✅ COMPLETADA
- [x] Fix MRR NaN: `Number(mrrResult?.mrr ?? 0)` — admin.service.ts
- [x] Fix relación plan faltante en findClinicaById: `subscriptions.plan` en relations
- [x] Error handling en frontend: estado `error` + UI de reintento en clínicas y detalle

### P2: Flujo "Solicitar Prueba Gratuita" ✅ COMPLETADA
- [x] Columna `estado_aprobacion` en Clinica entity (pendiente | aprobado | rechazado)
- [x] Registro crea clínica con `estado_aprobacion: 'pendiente'`, no devuelve tokens
- [x] Login verifica estado de aprobación antes de dar acceso
- [x] Endpoints PATCH `/admin/clinicas/:id/aprobar` y `/rechazar`
- [x] Filtro `estado_aprobacion` en listado admin de clínicas
- [x] Login: eliminado "No tenes cuenta? Registrate gratis", botón → "Solicitar Prueba Gratuita"
- [x] Registro: pantalla de éxito "Solicitud enviada" sin redirect a dashboard
- [x] Auth service: register() ya no almacena tokens
- [x] Admin clínicas: badge "Pendiente" con pulse, botones Aprobar/Rechazar

### P3: Rediseño UI — Design System HEALTH_TRUST ✅ COMPLETADA
- [x] globals.css reescrito con tokens HEALTH_TRUST (hex), variables de sombras, gradientes, transiciones
- [x] Fuentes: Plus Jakarta Sans (display) + Inter (body) + JetBrains Mono (mono)
- [x] Keyframes: page-in, count-up, modal-in, glow-pulse, shimmer
- [x] Clases utilitarias: animate-page-in, skeleton, card-hover, stagger-item, scrollbar-none
- [x] Sidebar dashboard: gradiente, grupos con labels uppercase, items con border-l-2 primary
- [x] Sidebar admin: misma paleta HEALTH_TRUST, paddings optimizados, scrollbar oculto
- [x] Headers: bg-white/80 backdrop-blur-xl, breadcrumbs con "/" separador y current en primary
- [x] KPI Card: variantes por tipo (primary/accent/warm/danger), glow decoration, shadow-card
- [x] Status Badge: bordes semánticos por estado
- [x] Table: header bg-slate-50/80, uppercase tracking, hover states suaves
- [x] CHART_COLORS migrados a HEALTH_TRUST, CHART_TOOLTIP_STYLE oscuro
- [x] Input: focus states con ring-primary/20, border-primary
- [x] Button: shadow-primary con hover lift
- [x] Auth pages (login/register): migrados a paleta HEALTH_TRUST
- [x] Admin pages: colores migrados a tokens HEALTH_TRUST
- [x] Dashboard pages: colores de charts, gradientes, grid patterns migrados
- [x] Limpieza global: 0 referencias a #1b3553, #7cd1c4, #5bbcad en codebase
- [x] animate-page-in en 18+ páginas (dashboard + admin)
- [x] Fix auth-provider: tipo de retorno de register corregido
- [x] Fix search-input: useRef con initial value para React 19
- [x] Dark mode completo con equivalentes oscuros para todos los tokens

---

## Fase Q: Workflow n8n Zoé + Fixes Admin ✅ COMPLETADA

### Workflow n8n Zoé
- [x] Workflow n8n funcional para agente Zoé (WhatsApp IA)
- [x] Widget Zoé en frontend
- [x] Configuración WhatsApp en panel clínica y admin
- [x] URLs corregidas a endpoints reales de producción

### Fixes Admin
- [x] Fix eliminación de clínicas (cascade sin pagos)
- [x] Fix KPIs admin — trials pendientes no contaban como activas
- [x] Diseño cinta/ribbon para badges trial y destacado en planes

---

## Fase R: Simplificación + Dominio Producción ✅ COMPLETADA

### Simplificación estados de suscripción (7 → 4)
- [x] Enum reducido: `activa`, `inactiva`, `cancelada`, `vencida`
- [x] Trial se detecta por `trial_ends_at` (no por estado separado)
- [x] `past_due` y `gracia` eliminados (absorbidos por activa/vencida)
- [x] `suspendida` → `inactiva`
- [x] Subscription guard simplificado (4 casos en vez de 7)
- [x] Feature flag service y plan limit guard actualizados
- [x] Admin KPIs: trials calculados por `trial_ends_at` en vez de estado
- [x] Frontend: tipos, colores, labels, filtros actualizados en todas las páginas
- [x] Script SQL de migración para datos existentes (`scripts/migrate-subscription-states.sql`)

### Config WhatsApp solo en admin
- [x] Campos `evolution_instance` y `evolution_api_key` removidos del DTO de clínica
- [x] Tab WhatsApp en config clínica: solo toggle agente, nombre e instrucciones
- [x] Card "Estado WhatsApp" muestra si está conectado (sin exponer credenciales)
- [x] Admin mantiene acceso completo a credenciales Evolution API

### Dominio avaxhealth.com
- [x] `.env.production` con `DOMAIN_NAME=avaxhealth.com`
- [x] Frontend `.env.production` con API URL de producción
- [x] Docker compose: routers Traefik para dominio + redirect www → sin www (301)
- [x] Metadata OpenGraph y `metadataBase` configurados
- [x] Landing page actualizada

---

## Pendientes Planificados

### Horarios por Profesional
- [x] Entidad HorarioProfesional (user_id, clinica_id, horarios jsonb) — backend creado
- [x] Config → tab Equipo: horario individual por profesional — frontend creado
- [ ] Agente Zoe usa horarios por profesional

### Reportes Avanzados
- [ ] Productividad, pacientes, financiero, ocupación, tratamientos
- [ ] Export PDF + Excel con branding clínica

### Agente Zoe IA (Multi-tenant)
- [ ] 1 flujo n8n para todas las clínicas, router por clinica_id
- [ ] Paciente vía WhatsApp: ver turnos, registrarse, agendar, info clínica
- [ ] Admin vía WhatsApp: resumen turnos, finanzas, alertas

### Migración a Supabase (6 fases)
- [ ] **S1 — DB Managed:** Migrar PostgreSQL self-hosted a Supabase Postgres (pg_dump/restore, cambiar env vars)
- [ ] **S2 — Storage:** Archivos médicos (bucket privado, signed URLs) + logos clínica (bucket público) con `@supabase/supabase-js`
- [ ] **S3 — Auth:** Reemplazar JWT custom/bcrypt por Supabase Auth (import masivo de hashes, `app_metadata` con clinica_id/role)
- [ ] **S4 — Realtime:** Chat push vía WebSocket (eliminar 3 setInterval de polling) + notificaciones instantáneas + Presence para estado online
- [ ] **S5 — RLS:** Row Level Security multi-tenant (policies por clinica_id, denormalizar pagos, subquery para historial_medico)
- [ ] **S6 — Frontend:** Queries directas con anon key (turnos, pacientes read-only) + suscripciones Realtime al calendario

**Dependencias:** S1 → S2 (paralelo), S3, S4 → S5 (requiere S3) → S6
**Secuencia:** S1 → S2 + S4 (paralelo) → S3 → S5 → S6

---

## Estado General

| Fase | Descripción | Estado |
|------|-------------|--------|
| **A** | Ficha del Paciente | ✅ Completada |
| **B** | Mejoras Visuales y Funcionales | ✅ Completada |
| **C** | Tratamientos Dinámicos y Mejoras Formularios | ✅ Completada |
| **D** | Logo de Clínica y Branding Dinámico | ✅ Completada |
| **E** | Configuración de la Clínica (5 tabs) | ✅ Completada |
| **F** | Webhooks y Recordatorios Nativos | ✅ Completada |
| **G** | Notificaciones | ✅ Completada |
| **H** | Navegación Cruzada | ✅ Completada |
| **I** | Panel Admin SaaS — Diseño Premium | ✅ Completada |
| **J** | Rebranding y Mejoras UX | ✅ Completada |
| **K** | Feature Flags + Panel Profesional | ✅ Completada |
| **L** | Chat Interno + Rediseño Pacientes/Ficha + Dashboard Configurable | ✅ Completada |
| **M** | Rename professional + Mi Suscripción + Soporte Tickets | ✅ Completada |
| **N** | Fixes de Producción (móvil, logo, filtro profesional, soporte global) | ✅ Completada |
| **O** | Planes Dinámicos + Registro Premium + Auto-Trial | ✅ Completada |
| **P** | Bugs Admin + Flujo Trial + Rediseño UI HEALTH_TRUST | ✅ Completada |
| **Q** | Workflow n8n Zoé + Fixes Admin | ✅ Completada |
| **R** | Simplificación suscripciones + Dominio avaxhealth.com | ✅ Completada |
| **S1** | Supabase — Migrar DB Managed | ⏳ Pendiente |
| **S2** | Supabase — Storage (archivos médicos + logos) | ⏳ Pendiente |
| **S3** | Supabase — Auth (reemplazar JWT custom) | ⏳ Pendiente |
| **S4** | Supabase — Realtime (chat + notificaciones push) | ⏳ Pendiente |
| **S5** | Supabase — RLS (multi-tenancy a nivel DB) | ⏳ Pendiente |
| **S6** | Supabase — Optimizaciones frontend | ⏳ Pendiente |
