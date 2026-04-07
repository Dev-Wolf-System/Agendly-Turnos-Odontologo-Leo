# 🎨 PROMPT MAESTRO — Rediseño UI/UX Completo · Avax Health SaaS
> Para usar directamente con Claude Code en cada sesión de rediseño

---

## 🧠 CONTEXTO DEL PROYECTO

Estás trabajando en **Avax Health**, un SaaS multi-tenant B2B de gestión consultorios/clínica/clínicas para PyMEs de salud en Argentina. El sistema tiene dos paneles completamente separados:

1. **Panel Clínica** (`/dashboard`) — Usado por cada clínica suscripta que a su vez tiene posee panel para los profecionales (medicos) y panel para secretarias: turnos, pacientes, agenda, pagos, soporte, configuración, KPIs, agente Zoé IA.
2. **Panel Admin** (`/admin`) — Usado por el equipo Avax Health: gestión de clínicas, planes, suscripciones, leads, soporte, métricas de plataforma (MRR, churn, etc.)

**Stack frontend actual:** Next.js 14 App Router · TypeScript · Tailwind CSS · shadcn/ui · Recharts · React Hook Form · Zod

**REGLA ABSOLUTA:** No romper ninguna funcionalidad existente. Solo intervenir en la capa visual (CSS, clases Tailwind, estructura JSX de presentación). No tocar lógica de negocio, hooks, servicios, stores, validaciones ni llamadas a API.

---

## 🎨 DESIGN SYSTEM — HEALTH_TRUST

Aplicar estas variables CSS en `globals.css` como la fuente de verdad de todo el sistema:

```css
:root {
  /* === COLORES BASE === */
  --primary:          #0EA5E9;
  --primary-dark:     #0369A1;
  --primary-light:    #38BDF8;
  --primary-glow:     #0EA5E920;
  --accent:           #10B981;
  --accent-dark:      #059669;
  --accent-warm:      #F59E0B;
  --accent-warm-dark: #D97706;

  /* === FONDOS === */
  --bg-base:          #F8FAFC;
  --bg-surface:       #FFFFFF;
  --bg-card:          #F1F5F9;
  --bg-sidebar:       #0F172A;
  --bg-sidebar-hover: #1E293B;

  /* === BORDES === */
  --border:           #CBD5E1;
  --border-light:     #E2E8F0;
  --border-focus:     #0EA5E9;

  /* === TEXTO === */
  --text-primary:     #0F172A;
  --text-secondary:   #334155;
  --text-muted:       #64748B;
  --text-disabled:    #94A3B8;
  --text-inverse:     #F8FAFC;

  /* === SEMÁNTICOS === */
  --success:          #10B981;
  --success-bg:       #ECFDF5;
  --success-border:   #6EE7B7;
  --warning:          #F59E0B;
  --warning-bg:       #FFFBEB;
  --warning-border:   #FCD34D;
  --danger:           #EF4444;
  --danger-bg:        #FEF2F2;
  --danger-border:    #FCA5A5;
  --info:             #0EA5E9;
  --info-bg:          #EFF6FF;
  --info-border:      #BAE6FD;

  /* === GRADIENTES === */
  --gradient-hero:    linear-gradient(135deg, #EFF6FF 0%, #ECFDF5 100%);
  --gradient-primary: linear-gradient(135deg, #0EA5E9 0%, #0369A1 100%);
  --gradient-accent:  linear-gradient(135deg, #10B981 0%, #059669 100%);
  --gradient-warm:    linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
  --gradient-card:    linear-gradient(145deg, #FFFFFF 0%, #F1F5F9 100%);
  --gradient-sidebar: linear-gradient(180deg, #0F172A 0%, #1E293B 100%);

  /* === SOMBRAS === */
  --shadow-xs:        0 1px 2px rgba(15, 23, 42, 0.04);
  --shadow-sm:        0 1px 4px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04);
  --shadow-md:        0 4px 16px rgba(15, 23, 42, 0.08), 0 2px 4px rgba(15, 23, 42, 0.04);
  --shadow-lg:        0 8px 32px rgba(15, 23, 42, 0.10), 0 4px 8px rgba(15, 23, 42, 0.04);
  --shadow-xl:        0 16px 48px rgba(15, 23, 42, 0.12);
  --shadow-primary:   0 4px 20px rgba(14, 165, 233, 0.25);
  --shadow-accent:    0 4px 20px rgba(16, 185, 129, 0.25);
  --shadow-card:      0 2px 12px rgba(15, 23, 42, 0.06);

  /* === RADIOS === */
  --radius-sm:        6px;
  --radius-md:        10px;
  --radius-lg:        14px;
  --radius-xl:        18px;
  --radius-2xl:       24px;
  --radius-full:      9999px;

  /* === TIPOGRAFÍA === */
  --font-display:     'Plus Jakarta Sans', sans-serif;
  --font-body:        'Inter', sans-serif;
  --font-mono:        'JetBrains Mono', monospace;

  /* === TRANSICIONES === */
  --transition-fast:  150ms cubic-bezier(0.16, 1, 0.3, 1);
  --transition-base:  250ms cubic-bezier(0.16, 1, 0.3, 1);
  --transition-slow:  400ms cubic-bezier(0.16, 1, 0.3, 1);
  --ease-spring:      cubic-bezier(0.34, 1.56, 0.64, 1);
}
```

### Fuentes (agregar en `layout.tsx`)
```typescript
import { Plus_Jakarta_Sans, Inter, JetBrains_Mono } from 'next/font/google'

const displayFont = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['400', '500', '600', '700', '800'],
})
const bodyFont = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['400', '500', '600'],
})
const monoFont = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '500'],
})
```

---

## 🏗️ COMPONENTES A REDISEÑAR

### 1. SIDEBAR NAVIGATION (ambos paneles)

**Estructura visual objetivo:**
```
┌─────────────────────────┐
│  [Logo] Avax Health     │  ← fondo #0F172A, logo con gradiente primary
│─────────────────────────│
│  ○ Usuario actual       │  ← avatar con iniciales + gradiente, nombre + rol
│─────────────────────────│
│  MAIN MENU              │  ← label uppercase tracking-widest text-xs text-slate-500
│  ▣ Dashboard            │  ← icono 20px + texto, activo con bg primary/10 + border-l-2 primary
│  📅 Turnos              │
│  👥 Pacientes           │
│  💳 Pagos               │
│  🤖 Agente Zoé          │  ← badge "IA" con gradiente accent
│─────────────────────────│
│  GESTIÓN                │
│  ⚙️  Configuración      │
│  💬 Soporte             │
│─────────────────────────│
│  Plan: Pro IA  [badge]  │  ← sección de plan al fondo con indicador
│  [⚙] [?] [Salir]        │  ← íconos de acción rápida
└─────────────────────────┘
```

**CSS/Tailwind a aplicar:**
- Fondo: `bg-[#0F172A]` con gradiente sutil
- Items activos: `bg-primary/10 border-l-2 border-primary text-primary font-medium`
- Items hover: `hover:bg-white/5 transition-all duration-150`
- Grupos: `text-[10px] uppercase tracking-[0.15em] text-slate-500 font-semibold px-3 mb-1`
- Separadores: `border-t border-white/5`
- Ancho: `w-64` expandido · `w-[72px]` colapsado (solo íconos con tooltips)
- Colapsable con `transition-width duration-300 ease-out`

---

### 2. TOP HEADER

**Estructura visual objetivo:**
```
┌──────────────────────────────────────────────────────────┐
│  [≡ breadcrumb]    [🔍 Buscar...]    [🔔] [👤 Alex M. ▾] │
└──────────────────────────────────────────────────────────┘
```

**Especificaciones:**
- Fondo: `bg-white/80 backdrop-blur-xl border-b border-slate-100`
- Altura: `h-16`
- Búsqueda: input con `rounded-full bg-slate-50 border border-slate-200 pl-10 pr-4` — foco con `ring-2 ring-primary/20 border-primary`
- Notificaciones: ícono con badge `absolute -top-1 -right-1 w-4 h-4 bg-danger text-white text-[10px] rounded-full`
- Avatar usuario: gradiente `from-primary to-accent` con iniciales en blanco
- Breadcrumb: `text-sm text-muted` · separador `/` · página actual `font-medium text-primary`

---

### 3. KPI CARDS (Dashboard Clínica y Admin)

**Estructura visual objetivo:**
```
┌─────────────────────────────────────┐
│  [🗓] Turnos Hoy        [+12% ↑]   │
│                                      │
│  47                                  │  ← número grande
│  ████████████░░░░░░  78%            │  ← barra de progreso opcional
│  vs ayer: 42 turnos                 │  ← sub-dato contextual
└─────────────────────────────────────┘
```

**CSS/Tailwind a aplicar:**
```tsx
// Card wrapper
className="relative bg-white rounded-xl border border-slate-100 p-5 
           shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-md)] 
           hover:-translate-y-0.5 transition-all duration-200 overflow-hidden"

// Ícono container
className="w-10 h-10 rounded-lg flex items-center justify-center text-white
           bg-gradient-to-br from-[var(--primary)] to-[var(--primary-dark)]
           shadow-[var(--shadow-primary)]"

// Valor principal
className="text-3xl font-bold font-[var(--font-display)] text-[var(--text-primary)] 
           mt-3 tabular-nums"

// Badge de tendencia positiva
className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium
           bg-success/10 text-success"

// Decoración de fondo (elemento visual sutil)
// Círculo difuso en esquina superior derecha del color del ícono
className="absolute -top-4 -right-4 w-24 h-24 rounded-full opacity-[0.06]
           bg-[var(--primary)]"
```

**Variantes de color por tipo de KPI:**
- Turnos/Agenda → `primary` (#0EA5E9)
- Pacientes/Personas → `accent` (#10B981)
- Ingresos/Pagos → `accent-warm` (#F59E0B)
- Alertas/Pendientes → `danger` (#EF4444)

---

### 4. HERO CHART (Gráfica principal de área)

**Especificaciones:**
- Fondo card: `bg-white rounded-xl border border-slate-100 p-6 shadow-[var(--shadow-card)]`
- Header: título `font-semibold text-[var(--text-primary)]` + leyenda + selector de período (pills)
- Selector período: `inline-flex bg-slate-50 rounded-lg p-1` → pills activos `bg-white shadow-sm text-primary font-medium`
- Área del gráfico: degradado fill desde `--primary` con `opacity 0.15 → 0`
- Línea: `stroke="#0EA5E9" strokeWidth={2.5}`
- Tooltip custom: `bg-[#0F172A] text-white rounded-lg px-3 py-2 text-sm shadow-xl`
- Grid: líneas muy sutiles `stroke="#E2E8F0" strokeDasharray="4 4"`
- Ejes: `fill="#94A3B8" fontSize={12} fontFamily="var(--font-body)"`

---

### 5. TABLAS DE DATOS

**Especificaciones:**
```tsx
// Table wrapper
className="bg-white rounded-xl border border-slate-100 shadow-[var(--shadow-card)] overflow-hidden"

// Header de tabla
className="bg-slate-50/80 border-b border-slate-100"

// Th
className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"

// Tr con hover
className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors duration-100"

// Td
className="px-4 py-3.5 text-sm text-[var(--text-secondary)]"

// Acciones (botones en hover de fila)
// Mostrar solo en group-hover con opacity-0 group-hover:opacity-100 transition-opacity
```

**Status badges en tablas:**
```tsx
// Confirmado
"bg-success/10 text-success border border-success/20 px-2.5 py-0.5 rounded-full text-xs font-medium"

// Pendiente
"bg-warning/10 text-warning border border-warning/20 px-2.5 py-0.5 rounded-full text-xs font-medium"

// Cancelado
"bg-danger/10 text-danger border border-danger/20 px-2.5 py-0.5 rounded-full text-xs font-medium"
```

---

### 6. SIDEBAR DERECHO / PANELES LATERALES (Detalle de turno, paciente, ticket)

**Especificaciones:**
- Ancho: `w-[400px]`
- Fondo: `bg-white border-l border-slate-100 shadow-[-8px_0_24px_rgba(15,23,42,0.06)]`
- Animación de entrada: `translate-x-full → translate-x-0 transition-transform duration-300 ease-out`
- Header del panel: `border-b border-slate-100 px-6 py-4 flex items-center justify-between`
- Secciones internas separadas por `<hr className="border-slate-100">`
- Campos de info: label `text-xs font-medium text-muted uppercase tracking-wide` + valor `text-sm font-medium text-primary mt-0.5`

---

### 7. MÓDULO AGENTE ZOÉ (Panel IA)

Este módulo merece tratamiento visual especial por ser diferenciador de producto:

**Header del módulo:**
```tsx
// Gradiente especial para Zoé — combina primary + accent
className="bg-gradient-to-r from-[#0EA5E9] to-[#10B981] rounded-xl p-6 text-white relative overflow-hidden"

// Elemento decorativo — ondas de "pulso IA"
// 3 círculos concéntricos animados alrededor del avatar de Zoé
// animation: ping con delays 0ms, 300ms, 600ms y opacidades 0.3, 0.2, 0.1
```

**Badge de estado del agente:**
```tsx
// Activo
className="flex items-center gap-1.5 px-3 py-1 bg-white/20 rounded-full text-white text-sm"
// Con punto verde pulsante: before:w-2 before:h-2 before:bg-green-400 before:rounded-full before:animate-pulse
```

**Chat / Log de conversaciones:**
- Burbujas usuario: `bg-primary text-white rounded-2xl rounded-br-sm`
- Burbujas Zoé: `bg-slate-100 text-text-primary rounded-2xl rounded-bl-sm`
- Timestamp: `text-xs text-muted mt-1`

---

### 8. ONBOARDING WIZARD

**Especificaciones:**
- Modal centrado: `max-w-lg w-full bg-white rounded-2xl shadow-xl p-8`
- Indicador de steps: círculos conectados con línea
  - Completado: `bg-primary text-white` + check icon
  - Actual: `bg-primary text-white ring-4 ring-primary/20`
  - Pendiente: `bg-slate-100 text-muted border-2 border-slate-200`
- Animación entre steps: `slide + fade` usando Framer Motion
  ```tsx
  initial={{ opacity: 0, x: 20 }}
  animate={{ opacity: 1, x: 0 }}
  exit={{ opacity: 0, x: -20 }}
  transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
  ```
- Botón "Siguiente": gradiente primary con `shadow-[var(--shadow-primary)]`

---

### 9. BANNERS DE ESTADO DE SUSCRIPCIÓN

```tsx
// Trial activo (informativo)
"bg-info-bg border border-info-border text-info rounded-lg px-4 py-3 flex items-center gap-3"

// Past due / gracia (warning)  
"bg-warning-bg border border-warning-border text-warning-dark rounded-lg px-4 py-3 flex items-center gap-3"

// Suspendida (crítico)
"bg-danger-bg border border-danger-border text-danger rounded-lg px-4 py-3 flex items-center gap-3"
```

---

### 10. FORMULARIOS Y MODALES

**Modal wrapper:**
```tsx
// Overlay
"fixed inset-0 bg-[#0F172A]/40 backdrop-blur-sm z-50"

// Modal card (animación de entrada)
"bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 p-6"
// animation: scale(0.95) opacity(0) → scale(1) opacity(1), duration 200ms ease-out

// Header del modal
"flex items-start justify-between mb-6"
// Título: text-lg font-semibold text-text-primary
// Subtítulo: text-sm text-muted mt-0.5
// Botón X: w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center
```

**Inputs:**
```tsx
"w-full px-3.5 py-2.5 rounded-lg border border-[var(--border)] bg-white
 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-disabled)]
 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary
 transition-all duration-150 disabled:bg-slate-50 disabled:text-muted"
```

**Botón primario:**
```tsx
"inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm text-white
 bg-gradient-to-r from-[var(--primary)] to-[var(--primary-dark)]
 shadow-[var(--shadow-primary)] hover:shadow-[0_4px_24px_rgba(14,165,233,0.35)]
 hover:-translate-y-px active:translate-y-0 transition-all duration-150"
```

**Botón secundario:**
```tsx
"inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm
 text-[var(--text-secondary)] bg-white border border-[var(--border)]
 hover:bg-slate-50 hover:border-slate-300 transition-all duration-150"
```

---

## 🎭 ANIMACIONES GLOBALES

Agregar en `globals.css`:

```css
/* Entrada de página */
@keyframes page-in {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* Contador animado de KPIs */
@keyframes count-up {
  from { opacity: 0; transform: translateY(8px) scale(0.95); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}

/* Entrada de modal */
@keyframes modal-in {
  from { opacity: 0; transform: scale(0.95) translateY(-8px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}

/* Pulso suave para elementos IA */
@keyframes glow-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(14, 165, 233, 0.3); }
  50%       { box-shadow: 0 0 0 8px rgba(14, 165, 233, 0); }
}

/* Skeleton shimmer */
@keyframes shimmer {
  from { background-position: -200% 0; }
  to   { background-position: 200% 0; }
}

/* Clases utilitarias */
.animate-page-in    { animation: page-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) both; }
.animate-modal-in   { animation: modal-in 0.2s cubic-bezier(0.16, 1, 0.3, 1) both; }
.animate-glow-pulse { animation: glow-pulse 2s ease-in-out infinite; }

.skeleton {
  background: linear-gradient(90deg, #F1F5F9 25%, #E2E8F0 50%, #F1F5F9 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
  border-radius: var(--radius-md);
}

/* Hover lift estándar para cards */
.card-hover {
  transition: transform var(--transition-base), box-shadow var(--transition-base);
}
.card-hover:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

/* Stagger de entrada para listas */
.stagger-item:nth-child(1)  { animation-delay: 0ms;   }
.stagger-item:nth-child(2)  { animation-delay: 60ms;  }
.stagger-item:nth-child(3)  { animation-delay: 120ms; }
.stagger-item:nth-child(4)  { animation-delay: 180ms; }
.stagger-item:nth-child(5)  { animation-delay: 240ms; }
.stagger-item:nth-child(6)  { animation-delay: 300ms; }
```

---

## 📐 LAYOUT GLOBAL

### Page wrapper estándar
```tsx
// Aplicar en todos los page.tsx del dashboard
<div className="flex-1 overflow-auto bg-[var(--bg-base)]">
  <div className="p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6 animate-page-in">
    {/* PageHeader */}
    {/* KPI Cards */}
    {/* Contenido */}
  </div>
</div>
```

### Grillas de KPI
```tsx
// 4 KPIs principales
"grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"

// 3 KPIs
"grid grid-cols-1 sm:grid-cols-3 gap-4"

// Dashboard con gráficas (2/3 + 1/3)
"grid grid-cols-1 xl:grid-cols-3 gap-6"
// Hero chart: xl:col-span-2
// Panel secundario: xl:col-span-1
```

---

## 🏥 PANEL CLÍNICA — PÁGINAS A REDISEÑAR

### `/dashboard` — Dashboard Principal
- [ ] KPI Cards (4+) con íconos de gradiente por tipo
- [ ] Hero Chart: gráfica de área "Turnos esta semana" con selector de período
- [ ] Donut chart: distribución de estados de turnos (confirmado/pendiente/cancelado)
- [ ] Quick Actions: grid 3 columnas con cards de acción (Nuevo Turno, Nuevo Paciente, Ver Agenda)
- [ ] AI Insights Widget: tarjeta con gradiente primary→accent, icono Zoé, 3 insights bullet points
- [ ] Recent Activity Feed: lista de últimos eventos con timestamps y avatares

### `/dashboard/turnos` — Gestión de Turnos
- [ ] Tabla de turnos con status badges rediseñados
- [ ] Filtros pill (Todos / Hoy / Esta semana / Por estado)
- [ ] Panel lateral de detalle (slide-in derecho)
- [ ] Botón "Nuevo Turno" con sombra primary

### `/dashboard/pacientes` — Gestión de Pacientes
- [ ] Cards de paciente o tabla con avatar + iniciales en gradiente
- [ ] Indicador de límite del plan: `X de Y pacientes` con barra de progreso
- [ ] Panel lateral de historial del paciente

### `/dashboard/pagos` — Pagos
- [ ] KPIs financieros con color warm/amber
- [ ] Tabla de pagos con badges de estado
- [ ] Mini sparkline de ingresos del mes

### `/dashboard/suscripcion` — Mi Suscripción
- [ ] Card de plan actual con gradiente del plan
- [ ] Barra de uso (pacientes, usuarios)
- [ ] Lista de features con checks (disponible / no disponible)
- [ ] Historial de pagos simplificado
- [ ] Sección de soporte/tickets integrada

### `/dashboard/configuracion` — Configuración
- [ ] Tabs laterales por sección (Clínica / Horarios / Usuarios / KPIs / Integraciones)
- [ ] Toggle switches con animación (para activar KPIs, etc.)
- [ ] Sección de Agente Zoé con preview del widget

---

## 🔧 PANEL ADMIN — PÁGINAS A REDISEÑAR

### `/admin` — Dashboard Admin (Plataforma)
- [ ] KPI Cards: Clínicas Activas · MRR · Trials Activos · Tickets Abiertos
- [ ] Gráfica de crecimiento de clínicas (línea mensual)
- [ ] Donut: distribución de planes
- [ ] Lista de "Clínicas en riesgo" (churn signals)
- [ ] Feed: últimas altas de clínicas

### `/admin/clinicas` — Gestión de Clínicas
- [ ] Tabla con filtros pill (Todas / Activas / Trial / Vencidas / Inactivas)
- [ ] Search integrado en la tabla
- [ ] Fila con avatar, nombre, plan badge, estado badge, MRR individual, acción
- [ ] Panel lateral de detalle de clínica (slide-in)

### `/admin/planes` — Planes SaaS
- [ ] Cards de planes con header de gradiente diferenciado por tier
- [ ] Precio destacado con font display
- [ ] Chips de features con check/cross
- [ ] Badge "Más popular" en plan destacado
- [ ] Modal de creación/edición de plan

### `/admin/suscripciones` — Suscripciones
- [ ] Filter pills por estado
- [ ] Timeline visual de estado (activa → past_due → gracia → suspendida)
- [ ] Indicador de días restantes con color semántico

### `/admin/prospectos` — Leads/Prospectos
- [ ] Kanban board por estado (Nuevo → Contactado → Negociación → Convertido)
- [ ] Cards de lead con info de contacto + botones de acción rápida

### `/admin/soporte` — Tickets de Soporte
- [ ] Split view: lista izquierda + detalle derecho
- [ ] Prioridad con badges de color
- [ ] Área de respuesta con editor simple

---

## ✅ REGLAS DE IMPLEMENTACIÓN

### Qué SÍ tocar
```
✅ Clases Tailwind en JSX (className="...")
✅ Variables CSS en globals.css
✅ Orden/estructura de elementos JSX de presentación
✅ Íconos (Lucide React) — cambiar tamaños y colores
✅ Animaciones CSS y transiciones
✅ Importar/usar los componentes UI ya creados: StatusBadge, KpiCard, PageHeader, SearchInput
✅ Agregar nuevas clases utilitarias en globals.css
```

### Qué NO tocar
```
❌ Hooks (useXxx)
❌ Servicios y llamadas API (*.service.ts, fetch, axios)
❌ Stores (Zustand)
❌ Validaciones (Zod schemas)
❌ Lógica de negocio dentro de componentes
❌ Rutas y middlewares
❌ Tipos TypeScript e interfaces
❌ Autenticación y guards
❌ Backend (ningún archivo fuera de frontend/src)
```

---

## 🚀 ORDEN DE IMPLEMENTACIÓN SUGERIDO

| Prioridad | Tarea | Impacto Visual |
|-----------|-------|---------------|
| **1** | Actualizar `globals.css` con Design System completo | Base de todo |
| **2** | Fuentes Plus Jakarta Sans + Inter en `layout.tsx` | Identidad tipográfica |
| **3** | Rediseñar Sidebar (ambos paneles) | Presente en 100% de las pantallas |
| **4** | Rediseñar Top Header | Presente en 100% de las pantallas |
| **5** | KPI Cards con nuevas variantes de color | Alto impacto en dashboard |
| **6** | Hero Chart (colores, tooltip, gradiente área) | Centro visual del dashboard |
| **7** | Status Badges y tablas | Coherencia en toda la app |
| **8** | Modales y formularios | Mejora UX en flujos clave |
| **9** | Módulo Agente Zoé | Diferenciador de producto |
| **10** | Páginas admin (clinicas, planes, suscripciones) | Panel de operaciones |
| **11** | Animaciones y micro-interacciones | Polish final |

*Avax Health · Design System v2.0 · 2026*
*Paleta: HEALTH_TRUST · Fuentes: Plus Jakarta Sans + Inter · Stack: Next.js 14 + Tailwind + shadcn/ui*
