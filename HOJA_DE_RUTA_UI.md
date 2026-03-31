# Hoja de Ruta — Reestilizado y Mejoras UI/UX

> Última actualización: 2026-03-31

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
