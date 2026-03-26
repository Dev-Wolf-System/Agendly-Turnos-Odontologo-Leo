# Hoja de Ruta — Reestilizado y Mejoras UI/UX

> Última actualización: 2026-03-26

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
- [x] Logo Agendly en sidebar, login y register

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
