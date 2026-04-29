# PROMPT — Documentación Profesional del Sistema Avax Health

> **Cómo usarlo:** copiá y pegá todo el bloque de "PROMPT" abajo en Claude (claude.ai, Claude Code, o API). El prompt es self-contained: incluye todo el contexto del producto, la arquitectura, los módulos y las capacidades. Claude debe entregar una documentación completa lista para distribuir.

---

## PROMPT

Vas a actuar como un **Technical Writer Senior + Arquitecto de Software** con 12+ años de experiencia documentando plataformas SaaS multi-tenant del sector salud. Tu misión es generar la **documentación oficial completa** del sistema **Avax Health** — un SaaS de gestión integral para clínicas y consultorios médicos de cualquier especialidad.

La documentación debe ser:
- **Profesional y precisa** — sin marketing inflado, sin promesas vacías; cada afirmación basada en una capacidad real listada abajo.
- **Operativa** — un usuario nuevo (clínico, dev, comercial, soporte) debe poder leerla y entender exactamente qué hace cada cosa, cómo y por qué.
- **Estructurada por audiencia** — separa claramente lo que le importa al **profesional médico**, al **administrador de clínica**, al **superadmin de la plataforma**, al **desarrollador** y al **integrador externo**.
- **Innovadora en formato** — usá tablas comparativas, diagramas en Mermaid, fragmentos de código reales, ejemplos de payloads, flowcharts de procesos clínicos, matriz de roles vs. permisos, y un glosario al final.

---

### 1. CONTEXTO DEL PRODUCTO

**Avax Health** es un SaaS B2B para clínicas y consultorios de **cualquier especialidad médica** (odontología, kinesiología, nutrición, psicología, dermatología, oftalmología, medicina general). Multi-tenant nativo, multi-rol, impulsado por IA. Su valor central es **eliminar el caos administrativo** y reemplazar planillas + WhatsApp manual + cuadernos por una única plataforma inteligente.

**Dominio en producción:** `avaxhealth.com` (frontend) · `api.avaxhealth.com` (backend) · TLS vía Traefik.

**Diferenciadores:**
1. Agente IA Avax que atiende WhatsApp de forma autónoma (n8n + Evolution API + OpenAI).
2. Multi-tenant desde el diseño: aislamiento total de datos por clínica.
3. Trial gratuito 14 días sin tarjeta + onboarding wizard.
4. Cada clínica conecta sus propias credenciales de Mercado Pago para cobrar a sus pacientes.
5. Self-service billing recurrente vía Mercado Pago PreApproval.

---

### 2. STACK TÉCNICO REAL

```
Backend:        NestJS (Node.js) + TypeScript estricto + PostgreSQL (Supabase) + Redis
Frontend:       Next.js 16 App Router + React + TailwindCSS + shadcn/ui (base-ui underneath)
IA:             OpenAI GPT (informe IA + agente Avax)
Automatización: n8n (workflows WhatsApp) + Evolution API (WhatsApp gateway)
Storage:        Supabase Storage (archivos médicos, logos, consentimientos)
Realtime:       Supabase Realtime + Presence (chat, notificaciones)
Auth:           Supabase Auth + JWT multi-tenant + RLS + API Key para agente
Pagos:          Mercado Pago (clínica → paciente + plataforma → clínica via PreApproval)
Email:          Resend (bienvenida + reset password con plantillas brandadas)
Infra:          Docker + Traefik + VPS Linux + docker-compose.prod.yml
```

**Backend modular:** organización por módulos NestJS bajo `/backend/src/modules`:
`admin · agent · archivos-medicos · auth · billing · categorias · chat · clinica-mp · clinicas · dashboard · historial-medico · horarios-profesional · inventario · leads · lista-espera · mail · notificaciones · obras-sociales · pacientes · pagos · plans · proveedores · reports · subscriptions · sucursales · tickets · tratamientos · turnos · users`.

**Patrón:** Controller → Service → Repository, validación con DTOs, multi-tenant en cada query.

**Frontend:** App Router con `/app/(dashboard)`, `/app/(admin)`, `/app/(auth)`, `/app/(public)`. Páginas: configuracion, historial-medico, inventario, lista-espera, obras-sociales, pacientes, pagos, proveedores, reportes, soporte, sucursales, suscripcion, turnos.

---

### 3. ROLES Y PERMISOS

| Rol | Alcance | Restricciones |
|-----|---------|---------------|
| **Superadmin (Avax Health)** | Panel `/admin`: gestiona TODAS las clínicas, planes, suscripciones, tickets | No accede a datos clínicos sensibles directamente |
| **Admin de clínica** | Acceso total a su clínica: turnos, pacientes, equipo, finanzas, configuración, reportes | Aislado por `clinica_id` |
| **Profesional** | Solo SUS turnos, SUS pacientes (los que atendió), historial médico de sus pacientes | No ve datos financieros consolidados de la clínica |
| **Asistente / Secretaria** | Agenda, cobros, pacientes — sin reportes financieros completos | Configurable por admin |

---

### 4. INVENTARIO COMPLETO DE FUNCIONALIDADES

Documentá cada uno de estos módulos en detalle (qué hace, casos de uso, campos, flujos, edge cases, integraciones):

#### 4.1 Gestión de Pacientes
- CRUD con búsqueda avanzada (nombre, apellido, DNI, obra social, teléfono).
- **Ficha unificada:** datos personales + obra social + turnos + historial clínico + pagos + archivos en una sola vista.
- Vistas dual: cards con avatares (iniciales sobre gradiente) o tabla compacta.
- Navegación cruzada: desde turnos / pagos / historial → ficha.

#### 4.2 Turnos e Agenda
- **4 vistas:** Kanban (por estado, drag & drop), Listado (tabla con filtros), Día (timeline horario), Semana (grid).
- Estados: `pendiente · confirmado · completado · cancelado · perdido`.
- Detección de solapamiento en tiempo real al crear/editar.
- Auto-generación de pago pendiente si el tratamiento tiene precio.
- Reprogramación: marca `fue_reprogramado`, link al turno original.
- Source: `dashboard` (manual) o `whatsapp` (creado por Avax).
- Filtros: profesional, fecha, estado, tratamiento, paciente.
- KPIs en cards: pendientes, confirmados, completados, cancelados, perdidos.

#### 4.3 Agente IA Avax (WhatsApp + n8n)
- Workflow n8n único (`fdPc4lAYuj9x71JD`) compartido por todas las clínicas, multi-tenant por instance Evolution API.
- **17 tools del agente:** registrar paciente, consultar tratamientos, consultar obras sociales, ficha del paciente, lista de espera, "quién escribe" (paciente/profesional/admin), mis turnos (profesional), resumen, finanzas, inventario alertas, pacientes stats, consultar equipo, ver disponibilidad por profesional con horarios propios, crear turno, cancelar, reprogramar, dar info de la clínica.
- Personalización por clínica: nombre del agente + instrucciones específicas.
- Cache en memoria: `findClinicaByInstance` (TTL 1h), `getClinicaInfo` (TTL 5min).

#### 4.4 Historia Clínica
- Registros vinculados a turno (pero también independientes).
- Notas, procedimientos, diagnósticos.
- Timeline visual de últimas intervenciones por paciente.
- Filtros por profesional y fecha.

#### 4.5 Tratamientos Dinámicos
- Catálogo por clínica: nombre, duración (min), precio, color.
- Select de turnos muestra tratamientos reales con sus colores.

#### 4.6 Pagos (Clínica → Paciente)
- Métodos: efectivo, tarjeta, transferencia, Mercado Pago.
- Estados: aprobado, pendiente, rechazado.
- Doble cobro bloqueado por validación.
- Fuentes: particular u obra social (con código de prestación + nro autorización).
- Export CSV con BOM UTF-8.
- Donut por método de pago.
- **Cada clínica usa SUS credenciales MP** (módulo `clinica-mp`).

#### 4.7 Obras Sociales
- Catálogo: código, nombre, descripción, estado.
- Cuenta corriente con prestaciones, importes, estado de cobro.
- Reporte: turnos / completados / pacientes / facturado por OS.

#### 4.8 Consentimientos Informados
- Generación de PDF (datos turno + paciente + clínica + texto legal).
- Envío por WhatsApp con link Supabase Storage (URL firmada, expiración 1h).
- Paciente responde "ACEPTO" → registro automático.
- Estado en tabla turnos: `no enviado | enviado | aceptado`.

#### 4.9 Lista de Espera
- Cola de pacientes esperando disponibilidad.
- Notificación automática vía webhook al liberarse turno.

#### 4.10 NPS Post-Turno
- Encuesta automática por WhatsApp tras "completado".
- Score: promotores (9-10), pasivos (7-8), detractores (0-6).
- Reporte con distribución y comentarios libres.

#### 4.11 Recordatorios Automáticos
- Configurables: 2 / 4 / 12 / 24 / 48 hs antes.
- Webhook al motor (n8n) → WhatsApp.

#### 4.12 Reportes e Inteligencia
- Reporte de Turnos · Insights de Agenda (día/hora pico, retención) · Reporte de Pacientes · Reporte NPS · Reporte de Obras Sociales · Reportes avanzados (productividad por profesional, financiero consolidado).
- **Informe IA:** análisis textual generado por OpenAI con todos los KPIs del período → PDF descargable.
- Export CSV + XLSX.

#### 4.13 Archivos Médicos
- JPG / PNG / WebP / PDF / DICOM.
- Supabase Storage con URLs firmadas (1h).
- Límite 10MB por archivo.
- Organizados por paciente y clínica.

#### 4.14 Logo y Branding por Clínica
- Upload de logo (Supabase Storage).
- Fallback: ícono SVG por especialidad.
- Aparece en sidebar, login de la clínica, documentos generados.

#### 4.15 Configuración (5 tabs)
1. **Clínica:** datos, dirección, especialidad, logo.
2. **Horarios:** mañana/tarde independientes por día.
3. **Equipo:** CRUD usuarios + horarios individuales por profesional (`HorarioProfesional`).
4. **Tratamientos:** catálogo con precios y colores.
5. **Integraciones:** webhooks por evento, recordatorios, agente Avax.

#### 4.16 Webhooks Configurables (6 eventos)
`turno_confirmado · turno_completado · turno_cancelado · turno_perdido · turno_pendiente · recordatorio` — switch individual + URL por evento. Payload completo (paciente, profesional, tratamiento, clínica, estado). Compatible con n8n / Zapier / Make / endpoint propio.

#### 4.17 Chat Interno
- Canal general + DMs.
- Check / doble check de lectura.
- Estado online en tiempo real (Supabase Realtime + Presence).
- Notificaciones de no leídos.

#### 4.18 Notificaciones en Tiempo Real
- Centro en header con badge.
- Tipos: turno próximo (1h antes), stock bajo (cada 30 min), pago pendiente, turno cancelado, turno confirmado.
- Click navega a sección relevante.

#### 4.19 Inventario
- Productos: nombre, descripción, precio, stock, categoría.
- Alertas automáticas de stock bajo.

#### 4.20 Proveedores
- Multi-categoría, contacto, estado activo/inactivo.

#### 4.21 Dashboard Configurable
- KPI cards con gradientes y `count-up` animation.
- Secciones reordenables con drag-and-drop.
- Orden persistido por rol en localStorage.
- Visibilidad de KPIs configurable por rol.

#### 4.22 Lista de Sucursales
- Multi-sede bajo una organización (preparado para escalado).

#### 4.23 Soporte / Tickets
- Categoría, prioridad, estado, conversación.

---

### 5. PANEL SUPERADMIN (`/admin`)

- **Dashboard de plataforma:** clínicas activas, MRR, trials venciendo, distribución por plan.
- **Gestión de clínicas:** búsqueda, filtros, aprobación de registros, edición, desactivación.
- **Detalle de clínica:** webhooks, Evolution API, suscripción activa, métricas de uso.
- **Planes:** CRUD con precios, límites, features, badges.
- **Suscripciones:** asignación de planes, estados, extensión de trials.
- **Tickets:** gestión con respuesta, prioridad y estado.
- **Notificaciones admin:** bell con eventos `clinica_nueva` (cuando se registra una nueva clínica).

---

### 6. BILLING SAAS (Plataforma → Clínica)

Flujo self-service completo:
1. Lead llega a `/planes` → click "Contratar ahora".
2. `/register?plan={id}` → registro con `plan_id`.
3. Backend crea suscripción **INACTIVA** + clínica pendiente de aprobación.
4. `POST /billing/checkout-registro` → MP **PreApproval** → `init_point`.
5. Webhook `subscription_preapproval` (status: authorized) → activa sub + auto-aprueba clínica.
6. Webhook `payment` → renueva suscripción mensual.
7. **Fallback trial:** si el pago se abandona, `/bienvenida` poll 40s → opciones "Reintentar pago" o "Activar prueba gratuita".

**Estados de suscripción:** `inactiva · trial · activa · cancelada`.

**Webhook MP global:** `https://api.avaxhealth.com/api/billing/webhook` (eventos `subscription_preapproval` + `payment`).

---

### 7. AUTENTICACIÓN Y SEGURIDAD

- **Supabase Auth** + custom JWT con `clinica_id` y `role`.
- Migración automática de usuarios legacy a Supabase Auth en `forgot-password`.
- Reset password con `hashed_token` + `verifyOtp({ token_hash, type: 'recovery' })` en frontend.
- API Key separada para el agente Avax (n8n llama al backend con esa key).
- RLS en tablas críticas de Supabase.
- Email transaccional vía Resend (bienvenida + reset). Plantillas brandadas con logo Avax Health.

---

### 8. EMAIL TRANSACCIONAL

- `sendBienvenida` — gradient azul, primeros pasos, resumen del trial.
- `sendResetPassword` — header `#0F172A`, ícono escudo, badge expiración 1h, aviso de seguridad rojo.
- Si no hay `RESEND_API_KEY`, no envía (no rompe flujo).

---

### 9. DESIGN SYSTEM "HEALTH_TRUST"

Token reference (ya implementado):
- `--ht-primary: #0284C7` (Medical Blue)
- `--ht-primary-dark: #075985`
- `--ht-accent: #16A34A` (Health Green)
- `--ht-accent-warm: #D97706` (Amber)
- `--ht-danger: #DC2626`
- Gradientes: Hero, Primary, Accent, Warm, Sidebar, Card.
- Tipografías: Plus Jakarta Sans (display) + Inter (body) + JetBrains Mono (code).
- Animaciones: `page-in · modal-in · shimmer · glow-pulse · count-up`.
- Dark mode completo.

---

### 10. ESTADO ACTUAL (al 2026-04-28)

**En producción:**
- Supabase DB / Storage / Auth / Realtime
- MP por clínica
- R1–R7 (reportes, OS, NPS, lista espera)
- Email transaccional + reset password verificado
- Agente Avax n8n con 17 tools

**Code-complete, deploy pendiente:**
- Billing self-service MP + fallback trial
- Onboarding wizard fix
- Admin notificaciones
- Reportes avanzados (productividad + financiero)
- Vista Kanban en turnos (commit `1fc9404`)
- Fix usuarios huérfanos Supabase Auth al eliminar clínica
- Fix SelectValue en 6 páginas

**Pendiente de ejecución manual en producción:**
- SQL en Supabase (3 ALTER TABLE / CREATE TABLE para `subscriptions.preapproval_id`, `clinicas.onboarding_completado`, `admin_notificaciones`)
- Configurar webhook MP global
- Variables de entorno `RESEND_API_KEY` + `MAIL_FROM` en `.env.production`
- Deshabilitar email nativo de reset en Supabase Dashboard

---

### 11. ENTREGABLE — DOCUMENTACIÓN A GENERAR

Generá una documentación dividida en estos capítulos. Cada capítulo es un `.md` independiente, con frontmatter (`title`, `audience`, `last_updated`), índice de contenidos navegable, ejemplos concretos y diagramas Mermaid donde aplique.

```
docs/
├── 00-overview.md                  → resumen ejecutivo + en una frase + propuesta de valor
├── 01-arquitectura.md              → diagrama C4 (contexto/contenedores/componentes), stack, decisiones
├── 02-modelo-de-datos.md           → ER simplificado, tablas core (clinicas, users, pacientes, turnos, pagos, suscripciones), multi-tenancy
├── 03-roles-y-permisos.md          → matriz roles × módulos × acciones; flujos de auth
├── 04-modulos-funcionales.md       → uno por uno con: qué hace, campos, flujo, screenshots conceptuales (texto), edge cases
├── 05-agente-zoe.md                → arquitectura n8n + Evolution + OpenAI; tools listadas; ejemplos de conversación
├── 06-billing-saas.md              → flujo self-service MP, estados de suscripción, webhooks, fallback trial
├── 07-integraciones.md             → webhooks (6 eventos), Mercado Pago por clínica, Google (futuro), Resend
├── 08-api-reference.md             → endpoints públicos por módulo con request/response samples
├── 09-frontend-uxui.md             → design system HEALTH_TRUST, tokens, patrones, componentes reusables
├── 10-deploy-y-operaciones.md      → docker-compose, Traefik, VPS, backups, runbook de incidentes
├── 11-seguridad-y-compliance.md    → RLS, JWT, API Key, archivos firmados, datos sensibles, GDPR/HIPAA gap analysis
├── 12-reportes-e-inteligencia.md   → cada reporte con su SQL/lógica, informe IA con prompt OpenAI, exports
├── 13-onboarding-clinica.md        → wizard, trial, primeros 5 minutos, checklist de "clínica lista para operar"
├── 14-roadmap-y-escalabilidad.md   → corto/mediano/largo plazo; preparación para microservicios
├── 15-glosario.md                  → 60+ términos del producto, técnicos y clínicos
└── 16-faq.md                       → 30+ preguntas reales agrupadas por audiencia
```

---

### 12. REQUISITOS DE CALIDAD INNEGOCIABLES

1. **Cero invenciones.** Si un dato no está en este prompt, marcalo como `⚠ pendiente de validar` en lugar de inventarlo.
2. **Ejemplos reales.** Cada endpoint con request/response en JSON. Cada flujo con un caso narrativo ("María, recepcionista, abre el calendario el lunes a las 9 hs y…").
3. **Diagramas Mermaid** para: ER, flujos de auth, billing, agente IA, webhooks.
4. **Tablas comparativas** donde haya múltiples opciones (ej. métodos de pago, vistas de turnos).
5. **Tono profesional español rioplatense** — voseo natural ("podés", "tenés"), sin jerga corporativa hueca.
6. **Markdown limpio:** headings consistentes, code fences con lenguaje, listas paralelas, sin walls of text.
7. **Cada capítulo termina con "Próximos pasos / cómo extender"** — para que un dev pueda contribuir.

---

### 13. INSTRUCCIONES OPERATIVAS PARA CLAUDE

- Generá los 17 archivos en orden, uno por respuesta o uno por bloque, hasta completarlos todos.
- Si algún capítulo supera 1000 líneas, dividilo en sub-archivos numerados (ej. `04a-turnos.md`, `04b-pacientes.md`).
- Antes de empezar, devolveme un **plan maestro** (1 página) listando: capítulos, longitud estimada, dependencias entre ellos, riesgos de información faltante, y 3 preguntas concretas que necesitás que yo responda para no inventar.
- Después de cada capítulo, ofrecé un mini-changelog ("añadí X, omití Y por falta de info, recomiendo confirmar Z").

Empezá por el plan maestro.
