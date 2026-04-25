# Avax Health — Guía de Marca y Potencial del Producto

> Documento generado para Claude Design · 2026-04-25  
> Uso: identidad visual, presencia de marca, materiales de marketing

---

## 1. ¿Qué es Avax Health?

**Avax Health** es una plataforma SaaS (Software as a Service) para la gestión integral de clínicas y consultorios médicos de **cualquier especialidad**: odontología, kinesiología, nutrición, psicología, medicina general, dermatología, oftalmología, y más.

Su propósito es **eliminar el caos administrativo** que viven los profesionales de la salud y reemplazarlo con una única plataforma inteligente que centraliza pacientes, turnos, historia clínica, cobros y comunicación — todo en un solo lugar, accesible desde cualquier dispositivo.

### Lo que hace diferente a Avax Health

- **Impulsado por IA:** el agente virtual Zoé gestiona turnos por WhatsApp de forma autónoma, responde pacientes, registra nuevos usuarios y confirma citas sin intervención humana
- **Multi-especialidad desde el diseño:** no es una app de odontología adaptada — fue construida para servir a cualquier tipo de consultorio
- **Multi-tenant nativo:** cada clínica tiene sus datos completamente aislados; cientos de clínicas pueden coexistir en la misma plataforma
- **Sin fricción:** las clínicas empiezan con un trial gratuito de 14 días sin necesidad de ingresar datos de pago

---

## 2. El Problema que Resuelve

Los profesionales de la salud pierden horas cada día en tareas que deberían ser automáticas:

- Responder WhatsApps de pacientes para confirmar o agendar turnos
- Recordar manualmente a pacientes sus citas del día siguiente
- Buscar en cuadernos o planillas quién debe cuánto y a qué obra social pertenece
- Gestionar archivos médicos dispersos en carpetas y correos
- No saber cuántos pacientes nuevos captaron este mes ni cuál es su tasa de retención

**Avax Health automatiza todo eso** y además le da al médico o al administrador una visión completa del negocio en tiempo real.

---

## 3. A Quién Va Dirigido

### Clientes directos (usuarios B2B)
- Clínicas odontológicas (1 a 10 profesionales)
- Consultorios médicos uni o multiprofesionales
- Centros de kinesiología y rehabilitación
- Consultorios de nutrición, psicología, dermatología
- Cualquier especialidad con agenda de turnos y atención a pacientes

### Roles dentro de cada clínica
| Rol | Qué puede hacer |
|-----|----------------|
| **Admin** | Acceso total: configuración, reportes, facturación, equipo |
| **Profesional** | Ve sus propios turnos y pacientes, historial médico |
| **Asistente/Secretaria** | Gestión de agenda, cobros, pacientes — sin acceso financiero completo |

### Operadores de la plataforma
- **Superadmin (equipo Avax Health):** panel propio para gestionar todas las clínicas suscriptas, aprobar registros, gestionar planes y suscripciones

---

## 4. Funcionalidades Completas

### 👥 Gestión de Pacientes
- Alta, edición y búsqueda avanzada de pacientes
- Ficha médica unificada: datos personales, obra social, turnos, historial, pagos — todo en una sola vista
- Vista dual: cards con avatares o tabla compacta
- Navegación cruzada: desde cualquier tabla se llega a la ficha del paciente con un clic
- Obra social asignable con filtros por cobertura

### 📅 Turnos e Agenda
- Calendario con vistas: semanal, diaria y tabla (lista)
- Detección en tiempo real de solapamiento de turnos
- Estados: pendiente, confirmado, completado, cancelado, perdido
- Filtros por profesional, fecha, estado, tratamiento
- Creación de turno desde el calendario con click en slot vacío
- Auto-generación de pago pendiente al crear un turno con tratamiento con precio
- Profesionales solo ven sus propios turnos (aislamiento por rol)

### 🤖 Agente IA Zoé (WhatsApp)
- Agente virtual que atiende a los pacientes por WhatsApp de forma autónoma
- Puede: buscar pacientes, registrar nuevos, ver disponibilidad, crear turnos, dar información de la clínica
- Personalizable: nombre del agente e instrucciones por clínica
- Funciona para todas las clínicas con un único flujo n8n (multi-tenant)
- Powered by OpenAI + Evolution API + n8n

### 📋 Historia Clínica
- Registros por turno: notas, procedimientos, diagnósticos
- Timeline visual de últimas intervenciones
- Filtros por profesional y fecha
- Acceso controlado por rol

### 💊 Tratamientos Dinámicos
- Catálogo de tratamientos por clínica: nombre, duración, precio, color
- El select de turnos muestra tratamientos reales con colores y duración
- Historial de tratamientos más realizados en reportes

### 💰 Pagos y Facturación
- Registro de pagos por turno: efectivo, tarjeta, transferencia, Mercado Pago
- Estados: aprobado, pendiente, rechazado
- Gráfico donut por método de pago
- Doble cobro bloqueado con validación
- Export CSV con BOM UTF-8
- Cada clínica puede conectar sus **propias credenciales de Mercado Pago**

### 🏥 Obras Sociales
- Catálogo de obras sociales con código, nombre, descripción, estado
- Cuenta corriente: registro de prestaciones, importes, estado de cobro, observaciones
- Reportes de obra social: turnos, completados, pacientes, facturado por cobertura
- Integración con el perfil del paciente y los turnos

### 📋 Consentimientos Informados
- Generación automática de PDF con datos del turno, paciente, clínica y texto legal
- Envío por WhatsApp al paciente con link seguro (Supabase Storage, URL con expiración)
- El paciente responde "ACEPTO" por WhatsApp y el sistema lo registra automáticamente
- Estado visible en la tabla de turnos: no enviado / enviado / aceptado

### ⏳ Lista de Espera
- Cola de pacientes que quieren un turno sin disponibilidad inmediata
- Al liberarse un turno, el sistema puede notificar automáticamente
- Integrado con webhooks configurables

### ⭐ NPS Post-Turno
- Encuesta automática de satisfacción enviada por WhatsApp tras completar un turno
- Score NPS calculado: promotores, pasivos, detractores
- Reporte visual con promedio, distribución y comentarios

### 🔔 Recordatorios Automáticos
- Recordatorio configurable: 2 / 4 / 12 / 24 / 48 horas antes del turno
- Enviado automáticamente vía webhook al paciente
- No requiere intervención manual

### 📊 Reportes e Inteligencia
- **Reporte de Turnos:** totales, por estado, por profesional, por mes, cancelaciones
- **Insights de Agenda:** día pico, hora pico, tasa retención, distribución por día/hora
- **Reporte de Pacientes:** totales, nuevos este mes, por obra social, evolución mensual
- **Reporte NPS:** score, promotores, detractores, respuestas individuales
- **Reporte de Obras Sociales:** facturado, turnos, pacientes por cobertura
- **Informe IA:** análisis textual generado por OpenAI con todos los KPIs del período, descargable en PDF
- Export CSV y Excel (XLSX) para todos los reportes de turnos

### 📁 Archivos Médicos
- Upload de imágenes (JPG, PNG, WebP), PDF y DICOM directamente desde la plataforma
- Almacenamiento privado en Supabase Storage con URLs firmadas (expiran en 1 hora)
- Organizados por paciente y clínica
- Límite de 10MB por archivo

### 🖼️ Logo y Branding por Clínica
- Cada clínica puede subir su propio logo
- Si no tiene logo, puede elegir un ícono SVG por especialidad (odontología, kinesiología, nutrición, etc.)
- El logo aparece en el sidebar, el login de la clínica y los documentos generados

### ⚙️ Configuración Completa
Panel de configuración con 5 tabs:
1. **Clínica** — datos básicos, dirección, teléfono, especialidad, logo
2. **Horarios** — mañana y tarde independientes por día de la semana
3. **Equipo** — CRUD de usuarios, roles, horarios individuales por profesional
4. **Tratamientos** — catálogo propio de tratamientos con precios y colores
5. **Integraciones** — webhooks por estado de turno, recordatorios, configuración del agente Zoé

### 🔗 Webhooks Configurables
- 6 eventos: turno confirmado, completado, cancelado, perdido, pendiente, recordatorio
- URL por evento, activable con switch individual
- Payload completo: datos del paciente, profesional, tratamiento, clínica, estado
- Compatible con n8n, Zapier, Make o cualquier endpoint propio

### 💬 Chat Interno
- Mensajes por canal general y directos entre miembros del equipo
- Indicadores de lectura (check/doble check)
- Estado online en tiempo real (Supabase Realtime + Presence)
- Notificaciones de mensajes sin leer
- Solo visible para el equipo de la clínica

### 🔔 Notificaciones en Tiempo Real
- Centro de notificaciones en el header con badge de sin leer
- Tipos: turno próximo, stock bajo, pago pendiente, turno cancelado, turno confirmado
- Click en notificación navega a la sección relevante
- Créditos automáticos: stock bajo cada 30 min, turno próximo 1 hora antes

### 📦 Inventario
- Productos con nombre, descripción, precio, stock, categoría
- Alertas automáticas de stock bajo
- Filtro por categoría, búsqueda por nombre

### 🚚 Proveedores
- Registro de proveedores con múltiples categorías
- Contacto, estado activo/inactivo
- Filtros y búsqueda

### 🎛️ Dashboard Configurable
- KPIs principales en cards con gradientes y animaciones
- Secciones reordenables con drag-and-drop
- Orden persistido por rol en localStorage
- Visibilidad de KPIs configurable por rol (admin puede ocultar datos financieros al profesional)

---

## 5. Panel de Administración SaaS

Interfaz exclusiva para el equipo de **Avax Health** en `/admin`:

- **Dashboard de plataforma:** clínicas activas, MRR (ingreso recurrente mensual), trials venciendo, distribución por plan
- **Gestión de clínicas:** búsqueda, filtros, aprobación de nuevos registros, edición, desactivación
- **Detalle de clínica:** configuración de webhooks, Evolution API, suscripción activa, métricas de uso
- **Planes:** CRUD de planes con precios, límites, features, badges de destacado/trial
- **Suscripciones:** asignación de planes, cambio de estados, extensión de trials
- **Soporte/Tickets:** gestión de incidencias con respuesta, cambio de prioridad y estado

---

## 6. Modelo de Negocio

- **SaaS mensual por suscripción** — planes diferenciados por cantidad de usuarios, pacientes y features
- **Trial gratuito de 14 días** — sin tarjeta de crédito, aprobación manual por el equipo Avax Health
- **Planes escalables:** desde consultorios uniprofesionales hasta clínicas con múltiples sucursales
- **Ingresos por clínica independientes** — cada clínica conecta su propio Mercado Pago para cobrar a sus pacientes

---

## 7. Identidad Visual — Design System HEALTH_TRUST

### Concepto de Marca
Avax Health transmite **confianza médica + tecnología moderna**. No es fría como un sistema hospitalario ni informal como una app de agenda. Es **profesional, cálida y accesible** — el tipo de herramienta que genera confianza desde el primer vistazo.

### Paleta de Colores Principal

| Token | Nombre | HEX | Uso |
|-------|--------|-----|-----|
| `--ht-primary` | Medical Blue | `#0284C7` | Color dominante — botones, links, KPIs primarios, borders activos |
| `--ht-primary-dark` | Deep Ocean | `#075985` | Hover de botones, estados pressed |
| `--ht-primary-light` | Sky | `#0EA5E9` | Gradientes, highlights |
| `--ht-accent` | Health Green | `#16A34A` | Éxito, completado, online, NPS positivo |
| `--ht-accent-dark` | Forest | `#15803D` | Hover green |
| `--ht-accent-warm` | Amber | `#D97706` | Advertencias, pendiente, stock bajo |
| `--ht-danger` | Alert Red | `#DC2626` | Errores, cancelaciones, eliminación |

### Paleta de Fondo y Texto

| Token | HEX | Uso |
|-------|-----|-----|
| `--bg-base` | `#F0F9FF` | Fondo general de la app (azul muy claro) |
| `--bg-surface` | `#FFFFFF` | Cards, modales, paneles |
| `--bg-card` | `#EBF5FF` | Fondo de cards secundarias |
| `--bg-sidebar` | `#0C1A2E` | Sidebar (azul marino oscuro) |
| `--text-primary` | `#0C1A2E` | Textos principales |
| `--text-secondary` | `#1E3A5F` | Textos secundarios |
| `--text-muted` | `#5A7A94` | Labels, hints, placeholders |
| `--border-light` | `#D6EAF8` | Bordes sutiles |

### Gradientes

| Nombre | Definición | Uso |
|--------|-----------|-----|
| Hero | `135deg, #EFF6FF → #F0FDF4` | Fondos de página, banners |
| Primary | `135deg, #0284C7 → #075985` | Botones CTA, header cards |
| Accent | `135deg, #16A34A → #15803D` | Estados de éxito, badges completado |
| Warm | `135deg, #D97706 → #B45309` | Advertencias, pendientes |
| Sidebar | `180deg, #0C1A2E → #1A2E45` | Navegación lateral |
| Card | `145deg, #FFFFFF → #EBF5FF` | Cards con profundidad sutil |

### Tipografía

| Rol | Fuente | Uso |
|-----|--------|-----|
| Display / Headings | **Plus Jakarta Sans** | Títulos, nombres de sección, KPI numbers |
| Body / UI | **Inter** | Textos de interfaz, tablas, formularios |
| Código / Mono | **JetBrains Mono** | Snippets, API keys, valores técnicos |

### Sombras y Efectos

```
shadow-card:    0 2px 12px rgba(2,48,71, 0.06)   — cards en reposo
shadow-primary: 0 4px 20px rgba(2,132,199, 0.28) — botones y elementos activos
shadow-lg:      0 8px 32px rgba(2,48,71, 0.10)   — modales, dropdowns elevados
glow-pulse:     pulso suave azul sobre elementos interactivos (2s infinito)
```

### Animaciones Clave
- **page-in** — slide + fade al entrar a cualquier página (0.4s cubic-bezier)
- **modal-in** — scale + fade para modales y dialogs
- **shimmer** — skeleton loading con movimiento horizontal
- **glow-pulse** — pulso de sombra azul para elementos de foco
- **count-up** — animación numérica para KPIs al cargar

### Patrones Visuales Recurrentes
- Cards con `border-radius: 16px` (`rounded-2xl`), fondo blanco, sombra card
- KPI cards con ícono de gradiente en esquina, número grande en Plus Jakarta Sans
- Badges de estado con dot de color + texto uppercase tracking wide
- Avatares con iniciales sobre gradiente primary→accent
- Sidebar oscuro (`#0C1A2E`) con items seleccionados marcados con `border-l-2 primary`
- Headers con `backdrop-blur-xl bg-white/80` efecto glass
- Tablas con header `bg-slate-50/80`, hover suave, bordes `border-slate-100`

### Dark Mode
Paleta completa con equivalentes oscuros:
- Fondo: `#0B1120` → `#0F172A`
- Cards: `#1E293B` → `#334155`  
- Primary: `#38BDF8` (más luminoso para contraste)
- Accent: `#4ADE80`
- Borders: `rgba(255,255,255, 0.08)`

---

## 8. Tono y Personalidad de Marca

### Voz
- **Directa y clara** — sin jerga médica innecesaria, sin tecnicismos de software
- **Cálida pero profesional** — habla de "tu clínica", "tus pacientes", "tu equipo"
- **Empoderador** — le da control al profesional, no lo hace sentir dependiente

### Valores de Marca
1. **Confianza** — los datos médicos son sensibles; la plataforma los protege
2. **Eficiencia** — cada minuto que el médico ahorra es un minuto más para sus pacientes
3. **Inteligencia** — la IA trabaja en segundo plano, sin interrumpir el flujo humano
4. **Accesibilidad** — desde el celular o la computadora, en cualquier clínica del país

### Lo que NO es Avax Health
- No es un ERP hospitalario complejo y frío
- No es una simple app de agenda
- No es solo para odontólogos
- No requiere un equipo IT para implementarlo

---

## 9. Potencial y Escalabilidad

### Corto plazo (próximas features)
- **Billing automático:** las suscripciones se cobran solas vía Mercado Pago recurrente
- **Self-service completo:** las clínicas upgradean, cancelan y gestionan su plan sin intervención
- **Reportes avanzados:** productividad por profesional, financiero consolidado, ocupación de agenda

### Mediano plazo
- **Integraciones Google:** Calendar (sincronización de agenda), Gmail (notificaciones), Sheets (exportación automática)
- **Email transaccional:** confirmaciones y recordatorios también por email (además de WhatsApp)
- **Multi-sucursal:** una organización con varias sedes bajo una misma cuenta

### Largo plazo
- **Marketplace de especialidades:** plantillas de historia clínica y consentimientos por especialidad
- **Paciente portal:** app web para que el paciente vea sus turnos, descargue consentimientos y pague online
- **Analítica avanzada con IA:** predicción de cancelaciones, análisis de ocupación, recomendaciones de agenda
- **Billing usage-based:** cobrar según volumen de pacientes o turnos en lugar de plan fijo

---

## 10. Stack Tecnológico (para referencia técnica)

```
Backend:       NestJS (Node.js) + TypeScript + PostgreSQL (Supabase) + Redis
Frontend:      Next.js (App Router) + React + TailwindCSS + shadcn/ui
IA:            OpenAI GPT (informe IA + agente Zoé)
Automatización: n8n (workflows WhatsApp) + Evolution API (WhatsApp gateway)
Storage:       Supabase Storage (archivos médicos, logos, consentimientos)
Realtime:      Supabase Realtime + Presence (chat, notificaciones)
Pagos:         Mercado Pago (cobros clínica + suscripciones SaaS)
Infraestructura: Docker + Traefik + VPS Linux
Dominio:       avaxhealth.com / api.avaxhealth.com
Seguridad:     JWT multi-tenant + RLS Supabase + API Key para agente
```

---

## 11. En una Sola Frase

> **Avax Health** es la plataforma inteligente que libera a los profesionales de la salud del caos administrativo para que puedan enfocarse en lo que realmente importa: sus pacientes.
