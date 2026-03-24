# Plan de Desarrollo — Agendly CRM SaaS

> Última actualización: 2026-03-23

---

## Fase 1: Configuración Inicial y Arquitectura ✅ COMPLETADA

- [x] Monorepo (backend NestJS + frontend Next.js)
- [x] PostgreSQL + TypeORM (synchronize: false, migrations manuales)
- [x] Redis configurado
- [x] Estructura modular NestJS (/modules, /common, /config)
- [x] App Router Next.js (/app, /components, /services, /hooks)
- [x] TailwindCSS + Shadcn UI (13 componentes)
- [x] JWT auth con roles (admin, odontologist, assistant)
- [x] Multi-tenant (clinica_id en JWT, guards, filtrado en services)
- [x] Guards: JwtAuthGuard, RolesGuard, ClinicaTenantGuard
- [x] Decorators: @Public, @Roles, @CurrentUser, @CurrentClinica
- [x] GlobalExceptionFilter (errores en español)
- [x] DTOs con class-validator (whitelist + forbidNonWhitelisted)
- [x] Login page frontend
- [x] Auth provider + Theme provider (next-themes)

## Fase 2: Módulos CRUD Core ✅ COMPLETADA

### Backend (8 módulos)
- [x] **Auth** — register, login, refresh, me (crea clínica+admin automático)
- [x] **Clínicas** — GET/PATCH /clinicas/me (solo admin edita)
- [x] **Users** — CRUD completo (solo admin)
- [x] **Pacientes** — CRUD, búsqueda ILIKE, DNI único por clínica, count
- [x] **Turnos** — CRUD, validación solapamiento, filtros (fecha/estado/user_id), countToday
- [x] **Historial Médico** — CRUD por paciente, tenant via JOIN
- [x] **Pagos** — CRUD, filtro por turno, estados (pendiente/aprobado/rechazado)
- [x] **Inventario** — CRUD, alerta stock bajo (cantidad <= stock_min), relación proveedor
- [x] **Proveedores** — CRUD con relación inventario

### Frontend (7 páginas + dashboard)
- [x] **Login** — email/password con manejo de errores
- [x] **Dashboard** — 4 KPI cards + 6 gráficos Recharts (datos demo)
- [x] **Pacientes** — tabla, búsqueda, crear/editar/eliminar con modales
- [x] **Turnos** — filtros fecha/estado, CRUD, cambio estado por badge
- [x] **Pagos** — lista, editar monto/método/estado
- [x] **Inventario** — stock alerts (badge rojo), select proveedor
- [x] **Proveedores** — CRUD completo

### UI/UX implementado
- [x] Paleta Agendly (#143360, #00C198, #19D1F4, #9FA9FB)
- [x] Modo oscuro/claro con toggle (next-themes)
- [x] Font Plus Jakarta Sans
- [x] Sidebar con navegación + Header con theme toggle
- [x] Toasts con Sonner
- [x] Recharts para gráficos

### Services frontend
- [x] api.ts (Axios + interceptors)
- [x] auth.service.ts (login, register, refresh, logout)
- [x] pacientes.service.ts
- [x] turnos.service.ts
- [x] users.service.ts

---

## Fase 3: Completar UI/UX y Páginas Faltantes ✅ COMPLETADA

### Servicios frontend agregados
- [x] pagos.service.ts
- [x] inventario.service.ts
- [x] proveedores.service.ts
- [x] historial-medico.service.ts
- [x] dashboard.service.ts

### Páginas agregadas
- [x] **Historial Médico** — búsqueda por paciente, listado, CRUD, agregado al sidebar
- [x] **Registro** — formulario completo (clínica + usuario admin), link desde login

### Backend agregado
- [x] **Módulo Dashboard** — endpoint /dashboard/stats (KPIs reales) + /dashboard/turnos-hoy

### Mejoras Dashboard
- [x] KPI cards conectados a datos reales del API (turnos hoy, pacientes, ingresos, stock bajo)
- [x] Turnos de hoy desde API real
- [x] Gráfico pie de estados de turnos con datos reales

### Mejoras UI/UX
- [x] Loading skeletons en todas las tablas (componente Skeleton reutilizable)
- [x] Breadcrumbs dinámicos en header

---

## Fase 4: Integración Mercado Pago

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

## Fase 5: Integraciones Google

- [ ] **Google Calendar** — OAuth2, sincronizar turnos ↔ eventos
- [ ] **Google Docs** — exportar historial médico
- [ ] **Google Sheets** — exportar reportes financieros
- [ ] **Gmail** — notificaciones email (confirmación turno, recordatorios)

---

## Fase 6: WhatsApp + Automatizaciones (n8n) + IA

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

## Fase 7: Producción y Escalabilidad

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

### SaaS Features
- [ ] Onboarding de nueva clínica
- [ ] Planes/suscripciones
- [ ] Panel super-admin para gestionar clínicas
