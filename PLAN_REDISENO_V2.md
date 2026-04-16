# Plan Maestro de Rediseño Avax Health — V2
> Generado con ui-ux-pro-max skill + análisis completo de codebase
> Fecha: 2026-04-16

---

## 1. Design System Oficial (dictado por ui-ux-pro-max)

### Estilo Base
- **Categoría**: Accessible & Ethical + Swiss Modernism 2.0
- **Referencia visual**: Linear.app + Stripe Dashboard + Vercel
- **Modo**: Light full + Dark full
- **Performance**: Excellent | **Accesibilidad**: WCAG AAA target

### Paleta de Colores (Medical Clinic — ui-ux-pro-max)
```css
/* Tokens HEALTH_TRUST v2 — reemplazar globals.css */
--color-primary:       #0284C7;   /* Medical Blue */
--color-primary-light: #0EA5E9;
--color-secondary:     #0891B2;
--color-accent:        #16A34A;   /* Health Green */
--color-accent-warm:   #D97706;   /* Amber warning */
--color-danger:        #DC2626;

--color-bg:            #F0F9FF;   /* Light blue tint */
--color-fg:            #0F172A;
--color-card:          #FFFFFF;
--color-card-fg:       #0F172A;
--color-muted:         #EFF7FB;
--color-muted-fg:      #64748B;
--color-border:        #E0F0F8;
--color-border-light:  #F0F8FF;

/* Sombras */
--shadow-card:     0 1px 3px rgba(2,132,199,0.06), 0 1px 2px rgba(0,0,0,0.04);
--shadow-md:       0 4px 12px rgba(2,132,199,0.08), 0 2px 4px rgba(0,0,0,0.04);
--shadow-primary:  0 4px 14px rgba(2,132,199,0.25);
--shadow-hover:    0 8px 24px rgba(2,132,199,0.12);
```

### Tipografía (Medical Clean — ui-ux-pro-max)
```css
/* Google Fonts */
@import url('https://fonts.googleapis.com/css2?family=Figtree:wght@300;400;500;600;700&family=Noto+Sans:wght@300;400;500;700&display=swap');

--font-heading: 'Figtree', sans-serif;   /* Títulos, KPIs, nav */
--font-body:    'Noto Sans', sans-serif; /* Texto, tablas, formularios */

/* Scale */
--text-xs:   11px;
--text-sm:   13px;
--text-base: 15px;
--text-lg:   17px;
--text-xl:   20px;
--text-2xl:  24px;
--text-3xl:  30px;
--text-4xl:  36px;
```

### Principios de Diseño
1. **Una acción primaria por pantalla** — botón gradient principal siempre visible
2. **Jerarquía de datos clara** — KPIs arriba, tablas abajo, acciones a la derecha
3. **Features bloqueadas = visible pero degradado** — nunca ocultar, siempre mostrar con lock + tooltip upgrade
4. **Estado vacío siempre útil** — imagen/ícono + mensaje + CTA (nunca pantalla en blanco)
5. **Feedback inmediato** — loading skeleton, toast en < 100ms
6. **Mobile first** — breakpoints: 375 / 768 / 1024 / 1440px
7. **Espaciado 4/8pt** — toda separación es múltiplo de 4px

---

## 2. Mapa de Feature Gating por Plan

### Qué muestra cada plan y cómo se bloquea en UI

| Feature | Trial | Consultorio Std | Consultorio+ IA | Clínica Std | Clínica+ IA | Pro IA |
|---------|-------|-----------------|-----------------|-------------|-------------|--------|
| Turnos/Agenda | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Pacientes | ✅ (50 max) | ✅ (500) | ✅ (2000) | ✅ (∞) | ✅ (∞) | ✅ (∞) |
| Historial médico | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Chat interno | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Pagos** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Inventario** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Exportar CSV | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Proveedores** | 🔒 | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Recordatorios WA** | 🔒 | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Agente IA WA** | 🔒 | 🔒 | ✅ | ✅ | ✅ | ✅ |
| **Reportes Avanzados** | 🔒 | 🔒 | ✅ | ✅ | ✅ | ✅ |
| **Branding Personalizado** | 🔒 | 🔒 | ✅ | ✅ | ✅ | ✅ |
| **Auditoría** | 🔒 | 🔒 | ✅ | ✅ | ✅ | ✅ |
| **Multi-Consultorio** | 🔒 | 🔒 | 🔒 | ✅ | ✅ | ✅ |
| **Acceso API** | 🔒 | 🔒 | 🔒 | ✅ | ✅ | ✅ |
| **Soporte Prioritario** | 🔒 | 🔒 | 🔒 | 🔒 | ✅ | ✅ |
| **Multi-Sucursal** | 🔒 | 🔒 | 🔒 | 🔒 | 🔒 | ✅ |

### Componente `<FeatureGate>` (a crear en frontend)
```tsx
// frontend/src/components/ui/feature-gate.tsx
// Uso: <FeatureGate feature="whatsapp_agent" planRequired="Avax Consultorio Plus IA">
//        <ConfiguracionAgente />
//      </FeatureGate>
//
// Si NO tiene la feature → muestra overlay con lock + "Disponible en [plan]" + botón Upgrade
// Si SÍ tiene → render normal
```

---

## 3. Plan de Rediseño por Página

### FASE 1 — Componente FeatureGate + Design Tokens ⭐ CRÍTICO
**Archivos a crear/modificar:**
- `frontend/src/components/ui/feature-gate.tsx` — NUEVO
- `frontend/src/app/globals.css` — actualizar tokens a paleta Medical Clinic
- `frontend/src/lib/constants.ts` — actualizar STATUS_COLORS
- `frontend/tailwind.config.ts` — agregar Figtree + Noto Sans

**FeatureGate UI Pattern:**
```
┌─────────────────────────────────────┐
│  [Ícono función]  Agente IA         │
│  ────────────────────────────────   │
│  🔒  Esta función requiere          │
│      Avax Consultorio Plus IA       │
│                                     │
│  [Ver planes]  [Contactar equipo]   │
└─────────────────────────────────────┘
```
- Overlay sutil (blur + opacity 40%) sobre el contenido real
- Badge "Plan requerido: [nombre]" en esquina superior derecha de la card
- Cursor not-allowed en toda la sección

---

### FASE 2 — Dashboard Principal
**Archivo:** `frontend/src/app/(dashboard)/dashboard/page.tsx`

**Problemas actuales:**
- KPI cards no usan Figtree para números
- No hay gating en KPIs de reportes avanzados
- Charts no tienen tooltips ni leyendas accesibles
- Empty state básico

**Rediseño:**
- KPIs grandes con Figtree bold, tendencia con flecha color
- Chart de turnos semanales con tooltip al hover
- Sección "Accesos rápidos" con los 4 módulos más usados
- Si plan no incluye `advanced_reports`: card de reportes con FeatureGate overlay

---

### FASE 3 — Configuración (6 tabs)
**Archivo:** `frontend/src/app/(dashboard)/dashboard/configuracion/page.tsx`

**Problemas actuales — feature gating FALTANTE:**

| Tab | Sección | Feature requerida | Estado actual |
|-----|---------|-------------------|---------------|
| WhatsApp | Agente IA (toggle + instrucciones) | `whatsapp_agent` | ❌ Sin gate |
| WhatsApp | Recordatorios automáticos | `whatsapp_reminders` | ❌ Sin gate |
| Clínica | Branding/logo personalizado | `custom_branding` | ❌ Sin gate |
| Integraciones | Webhooks | `api_access` | ❌ Sin gate |
| Equipo | Nuevo miembro (límite usuarios) | Límite de plan | ✅ Parcial |
| Dashboard | Visibilidad KPIs | — | ✅ Sin gate necesario |

**Acción:** Envolver secciones bloqueadas con `<FeatureGate>`.

---

### FASE 4 — Sección Proveedores
**Archivo:** `frontend/src/app/(dashboard)/dashboard/proveedores/page.tsx`

**Feature:** `proveedores` — bloqueada en Trial
**Acción:** Si `!isEnabled('proveedores')` → mostrar página completa con FeatureGate overlay en lugar del contenido, con preview difuminado de cómo se vería.

---

### FASE 5 — Landing Page (public/page.tsx)
**Archivo:** `frontend/src/app/(public)/page.tsx`

**Rediseño con ui-ux-pro-max guidance (Social Proof-Focused + Trust & Authority):**

**Secciones en orden:**
1. **Navbar** — logo + links Funcionalidades/Planes/FAQ + CTA "Empezar gratis"
2. **Hero** — Headline impactante + subheadline beneficio + 2 CTAs + badge trust + preview del dashboard (screenshot o mockup)
3. **Social proof strip** — "Más de 200 clínicas confían en Avax Health" + logos/avatares
4. **Pain Points** (3 cards) — problema → solución
5. **Features grid** (6 features) — icono + título + descripción
6. **Cómo funciona** (3 pasos) — numbered steps con screenshots
7. **Stats** — 4 números con animate-in
8. **Testimonios** (3 tarjetas) — nombre + especialidad + quote
9. **Planes** — 3 cards con features, destacar el más popular
10. **Integraciones** — logos WhatsApp, Google Calendar, Mercado Pago, etc.
11. **FAQ** — 6 preguntas con details/summary
12. **CTA final** — "14 días gratis, sin tarjeta de crédito"
13. **Footer** — links + redes + legal

**Criterios ui-ux-pro-max:**
- Figtree para títulos, Noto Sans para body
- Medical Blue #0284C7 como color primario
- Health Green #16A34A para CTAs y badges positivos
- Sin emojis como íconos — solo Lucide SVG
- Contrast mínimo 4.5:1 en todo texto

---

### FASE 6 — Página Planes (public/planes/page.tsx)
**Archivo:** `frontend/src/app/(public)/planes/page.tsx`

**Rediseño:**
- Toggle mensual/anual (descuento 20% anual)
- Cards con glassmorphism sutil, borde gradient en el plan destacado
- Lista de features con ✅/— para cada plan
- CTA primario en cada card
- Sección de comparación detallada abajo
- FAB "Comparar planes" en mobile

---

### FASE 7 — Layout público (navbar + footer)
**Archivo:** `frontend/src/app/(public)/layout.tsx`

**Problemas:**
- Faltan enlaces "Funcionalidades" y "FAQ" en navbar
- Footer sin acentos correctos
- Sin indicador de sección activa en scroll

**Rediseño:**
- Navbar sticky con blur backdrop
- Links: Inicio / Funcionalidades / Planes / FAQ
- CTA "Empezar gratis" + "Iniciar sesión" secundario
- Footer 3 columnas + legal row

---

### FASE 8 — Páginas de pacientes, turnos, historial
**Features sin gate (OK en todos los planes) pero rediseño visual:**
- Cards a HEALTH_TRUST v2 con tokens actualizados
- Tablas con hover highlight y sort accesible
- Filtros sticky en mobile
- Estados vacíos con ilustración SVG simple

---

### FASE 9 — Admin Panel
**Archivos:** `frontend/src/app/(admin)/admin/`

**Mejoras:**
- Panel de KPIs con charts reales (recharts)
- Tabla de clínicas con columna de "salud" del plan
- Gestión de planes con editor de features tipo checkbox grid

---

## 4. Componente FeatureGate — Especificación Técnica

```tsx
// Props
interface FeatureGateProps {
  feature: string;          // key de la feature (ej: 'whatsapp_agent')
  planRequired?: string;    // nombre del plan mínimo (ej: 'Avax Consultorio Plus IA')
  children: React.ReactNode;
  mode?: 'overlay' | 'replace' | 'hide';
  // overlay: muestra children difuminados con overlay de lock (default)
  // replace: reemplaza completamente el contenido con la card de upgrade
  // hide: oculta silenciosamente (solo para items de menú)
}
```

**Overlay pattern (mode='overlay'):**
```
┌──────────────────────────────────────────────────────┐
│  [contenido real difuminado blur-sm opacity-40]      │
│                                                      │
│           ┌─────────────────────────┐               │
│           │  🔒  Función bloqueada  │               │
│           │                         │               │
│           │  Disponible en:         │               │
│           │  Avax Consultorio       │               │
│           │  Plus IA                │               │
│           │                         │               │
│           │  [Ver planes]           │               │
│           └─────────────────────────┘               │
└──────────────────────────────────────────────────────┘
```

---

## 5. Orden de Implementación

| # | Tarea | Impacto | Complejidad | Archivos |
|---|-------|---------|-------------|---------|
| 1 | Design tokens v2 + Figtree en globals.css | Alto | Bajo | globals.css, tailwind.config.ts |
| 2 | Componente `<FeatureGate>` | Crítico | Medio | feature-gate.tsx |
| 3 | Feature gating en Configuración (tab WhatsApp + Integraciones) | Crítico | Medio | configuracion/page.tsx |
| 4 | Feature gating en Proveedores (plan sin `proveedores`) | Alto | Bajo | proveedores/page.tsx |
| 5 | Landing page rediseño completo | Alto | Alto | (public)/page.tsx |
| 6 | Navbar + footer público | Medio | Bajo | (public)/layout.tsx |
| 7 | Página de planes rediseño | Alto | Medio | (public)/planes/page.tsx |
| 8 | Dashboard principal — KPIs + charts | Medio | Medio | dashboard/page.tsx |
| 9 | Admin panel — charts reales | Bajo | Medio | (admin)/admin/page.tsx |

---

## 6. Checklist ui-ux-pro-max Pre-Delivery

Aplicar antes de considerar cada fase como completa:

- [ ] Sin emojis como íconos — solo Lucide SVG
- [ ] Todos los elementos clickeables tienen `cursor-pointer`
- [ ] Hover states con transición 150-300ms
- [ ] Contraste texto 4.5:1 mínimo (light mode)
- [ ] Focus states visibles para navegación por teclado
- [ ] `prefers-reduced-motion` respetado en animaciones
- [ ] Responsive verificado: 375px, 768px, 1024px, 1440px
- [ ] Touch targets ≥ 44×44px en mobile
- [ ] Skeleton loaders en carga > 300ms (no spinners)
- [ ] Empty states con mensaje + acción (no pantalla vacía)
- [ ] Figtree en headings y números KPI
- [ ] Noto Sans en texto de cuerpo
- [ ] Tokens HEALTH_TRUST v2 sin hex hardcodeados en componentes

---

## 7. Anti-Patrones a Eliminar (detectados en codebase actual)

| Problema | Ubicación | Fix |
|---------|-----------|-----|
| Hex hardcodeados en componentes | múltiples páginas | Usar `var(--color-*)` |
| Gradients decorativos excesivos en cards | configuracion, dashboard | Reducir a 1 gradient por sección |
| Feature gating inexistente en WhatsApp tab | configuracion/page.tsx | Agregar `<FeatureGate feature="whatsapp_agent">` |
| Feature gating inexistente en Proveedores page | proveedores/page.tsx | Agregar `<FeatureGate feature="proveedores" mode="replace">` |
| Landing sin Figtree ni tokens v2 | (public)/page.tsx | Aplicar en reescritura |
| Navbar público sin links de sección | (public)/layout.tsx | Agregar Funcionalidades + FAQ |
| Tildes faltantes en copy español | múltiples públicas | Fix exhaustivo |
| Spinner blocking en lugar de skeleton | múltiples | Reemplazar con `animate-pulse` skeleton |
