# Plan de Rediseño UX/UI — Avax Health

> Creado: 2026-04-13
> Estado: **En ejecución** — prueba de nivel (UI-2.1 Dropzone) completada 2026-04-15
> Alcance: Landing page + sistema completo (dashboard, secciones, modales, paneles etc. Todo)

## Decisiones tomadas (2026-04-15)

1. **Benchmark visual:** Linear + Stripe híbrido (densidad/minimalismo Linear + consistencia landing↔dashboard Stripe). Alineado con HEALTH_TRUST y con recomendación "Accessible & Ethical" del skill ui-ux-pro-max.
2. **Orden:** Dashboard primero, landing después. Mayor ROI (el producto ya tiene clientes, el dashboard es el diferenciador).
3. **S3 Auth NO va en paralelo.** Primero UI base (tokens → sidebar → header → KPIs). Luego S3. Evita conflictos de merge en `layout.tsx`/`globals.css`.
4. **Librerías extra:** solo Framer Motion si se requiere. Nada de aceternity-ui/magic-ui (chocan con HEALTH_TRUST y el skill advierte contra "motion-heavy" y "AI purple/pink gradients"). Stack: `shadcn/ui` + `lucide-react` + CSS transitions existentes en `globals.css`.

## Prueba de nivel — UI-2.1 Dropzone ✅ (2026-04-15)

- ✅ Creado `frontend/src/components/ui/dropzone.tsx` — drag&drop dual (drop + click), validación tipo/tamaño inline, estados idle/dragging/uploading/error, accesible (role=button, Enter/Space, aria-busy, aria-live para errores), tokens HEALTH_TRUST, animación `animate-glow-pulse` existente.
- ✅ Aplicado en tab Documentos de `frontend/src/app/(dashboard)/dashboard/pacientes/[id]/page.tsx` reemplazando el `<Input type="file">` nativo.
- ✅ `handleUploadArchivo` refactorizado para recibir `File` directo en lugar de `ChangeEvent`.
- ✅ Validado visualmente por el usuario 2026-04-15 ("convence hasta aquí todo ok, arranca con todo").

## Pipeline largo — progreso (2026-04-15, sesión continua)

### ✅ Paso 1-2: Tokens CSS + Fuentes — YA ESTABAN HECHOS
Al auditar `frontend/src/app/globals.css` y `frontend/src/app/layout.tsx` se detectó que el design system HEALTH_TRUST completo ya estaba implementado en sesiones anteriores: tokens light+dark, shadcn semantic mapping, status tokens, sidebar tokens, gradientes, shadows, keyframes (`page-in`, `count-up`, `modal-in`, `dialog-in`, `glow-pulse`, `shimmer`), utility classes. Fuentes Plus Jakarta Sans + Inter + JetBrains Mono ya cargadas vía `next/font/google` con variables `--font-display/--font-body/--font-mono`.

### ✅ Paso 3: Sidebar rediseñado
`frontend/src/components/layout/sidebar.tsx` — **400 LOC → 310 LOC**.
- Reemplazados ~100 líneas de SVG inline por imports de `lucide-react` (`LayoutDashboard`, `Users`, `Calendar`, `ClipboardList`, `CreditCard`, `Package`, `Truck`, `Building2`, `LifeBuoy`, `BadgeCheck`, `Settings`, `LogOut`, `ChevronsLeft`). Enforces regla del skill: un solo icon set consistente.
- A11y reforzada: `aria-label="Navegación principal"`, `aria-current="page"` en item activo, `role="tooltip"` en tooltip colapsado, `focus-visible:ring-2` en botones y links, `aria-hidden="true"` en icons decorativos.
- Rol del usuario visible debajo del nombre (`ROLE_LABEL` map: superadmin/admin/professional/assistant → "Super Admin"/"Administrador"/"Profesional"/"Secretaría").
- Sombras HEALTH_TRUST en avatar (`shadow-[var(--shadow-primary)]`), hover sutil `shadow-[inset_0_0_0_1px_rgba(56,189,248,0.08)]` en item activo.
- Transición `transition-[width]` en lugar de `transition-all` para mejor performance.
- **Pendiente** (requiere fetch adicional, fuera de scope visual): badge de plan actual al pie del sidebar según master doc. El tipo `Clinica` no expone `plan` directamente (vía `Subscription` aparte) → violaría la regla visual-only. Se deja como TODO funcional.

### ✅ Paso 4: Top Header
`frontend/src/components/layout/header.tsx`.
- Reemplazado SVG inline del hamburger por `Menu` de Lucide.
- Agregado `sticky top-0 z-30` para que el header se mantenga al hacer scroll.
- Focus ring accesible en botón hamburger.
- Hover con color semántico `text-[var(--text-secondary)] hover:text-[var(--text-primary)]`.
- **Nota:** el search input del header que sugiere el master doc requiere provider de búsqueda global → functional change, fuera de scope visual.

### ✅ Paso 5: KPI Cards — trend + progress bar
`frontend/src/components/ui/kpi-card.tsx`.
- Agregadas props opcionales `trend?: { value, direction: "up"|"down"|"flat", positive? }` y `progress?: number` (0-100). No breaking para usos existentes (ambos son opcionales).
- `TrendBadge` interno con icono direccional (`ArrowUpRight`/`ArrowDownRight`/`Minus`) y color semántico según si el trend es positivo/negativo/neutral. Soporta inversión con `positive: false` (ej. tiempo de espera: subir es malo).
- Progress bar con `role="progressbar"` + `aria-valuenow/valuemin/valuemax/label`, gradientes por variant, transición suave `duration-500 ease-out`.
- Hover enhancement: el glow decorativo aumenta de `opacity-[0.06]` a `opacity-[0.10]` en group-hover.
- Focus ring en todas las variantes + wrapper `<Link>`.

### ✅ Paso 6: Tablas y Status Badges — auditoría
- `frontend/src/components/ui/table.tsx` — ya matcheaba exactamente el master doc (`bg-slate-50/80` header, `uppercase tracking-wide` th, hover row, `px-4 py-3.5` td). Sin cambios.
- `frontend/src/components/ui/status-badge.tsx` + `STATUS_COLORS` en `lib/constants.ts` — ya usa los tokens status del HEALTH_TRUST (`status-success-bg/fg`, `status-warning-bg/fg`, etc.) con borders. Sin cambios.

### ✅ Paso 7: Dialog scrim — fix de legibilidad
`frontend/src/components/ui/dialog.tsx`.
- `bg-black/10` → `bg-[#0F172A]/40` con `backdrop-blur-sm`. Cumple con la regla del skill `scrim-opacity`: "40-60% black to preserve foreground legibility". El `bg-black/10` anterior era un scrim casi invisible que dejaba el background compitiendo con el modal.
- Transición subida de `duration-100` a `duration-150` para coincidir con el rango de micro-interacciones del master doc.

## Validación

- ✅ `tsc --noEmit` limpio tras cada paso (5 verificaciones consecutivas).
- ✅ Solo capa visual: cero tocar hooks, services, stores, Zod, API, rutas, auth.
- ⏳ Pendiente: validación visual del usuario en dev server.

## Próximos pasos del pipeline

| # | Paso | Archivo | Estado |
|---|------|---------|--------|
| 8 | Formularios (inputs primarios/secundarios) | `frontend/src/components/ui/{button,input,select,textarea}.tsx` | ✅ Auditado — ya alineado (text-base md:text-sm para evitar autozoom iOS) |
| 9 | Módulo Agente Zoé (header gradient, iconografía, textarea) | `frontend/src/app/(dashboard)/dashboard/configuracion/page.tsx` (sección Zoé) | ✅ Commit `9b6eefe` |
| 10 | Panel admin — dashboard | `frontend/src/app/(admin)/admin/page.tsx` | ✅ Commit `df0867f` |
| 10b | Panel admin — clínicas / planes / suscripciones / prospectos / soporte | `frontend/src/app/(admin)/admin/{clinicas,planes,suscripciones,prospectos,soporte}/*` | Por aplicar |
| 11 | Polish final (skeletons, micro-interacciones, toast) | global | Por aplicar |

## Commits del pipeline

- `d10d736` — rediseño base HEALTH_TRUST (dropzone, sidebar, header, kpi, dialog)
- `9b6eefe` — Agente Zoé (header gradient, Lucide icons, Textarea, tokens semánticos)
- `df0867f` — dashboard admin (KpiCard, Lucide, charts con paleta HEALTH_TRUST)

---

## Contexto

El sistema funciona pero la experiencia de usuario y el diseño visual no están al nivel de un producto SaaS premium. Casos concretos detectados:

- **Upload de documentos** en ficha del paciente usa un `<Input type="file">` nativo feo (`frontend/src/app/(dashboard)/dashboard/pacientes/[id]/page.tsx:699-732`). No cumple con estándar UX moderno (sin drag & drop, sin preview, sin progress, sin validación visual).
- Patrones inconsistentes de empty states, botones, cards y headers entre pantallas.
- Landing page requiere revisión con la nueva paleta HEALTH_TRUST.

## Filosofía del rediseño

- **No big-bang.** Avance iterativo por fases, cada fase un commit separado y revisable.
- **Reutilización antes que reescritura.** Construir primitivas sólidas y aplicarlas.
- **Compatible con el resto del roadmap** (Supabase S3-S6 pueden seguir en paralelo).

---

## Fase UI-1 — Auditoría y design tokens (1 día)

**Objetivo:** saber exactamente qué tocar antes de tocarlo.

- [ ] Auditar `frontend/src/components/ui/` — qué primitivas existen y cuáles faltan
- [ ] Revisar tokens CSS en `frontend/src/app/globals.css` (paleta HEALTH_TRUST, spacing, radius, shadows)
- [ ] Listar los 5-6 componentes de alta fricción repetidos en el sistema
- [ ] Documentar los patrones inconsistentes (botones, cards, empty states, headers)
- [ ] Definir referencia visual del "alto nivel" (Linear, Stripe, Vercel, Notion como benchmarks)

**Entregable:** documento corto con hallazgos y prioridades concretas.

---

## Fase UI-2 — Componentes base reutilizables (2-3 días)

**Objetivo:** construir 4 primitivas que resuelvan el 80% de las mejoras.

### 2.1 `<Dropzone>` — crítico
Reemplaza todos los `<Input type="file">` del sistema, incluido el de Documentos.
- **Drag & drop nativo** (HTML5 Drag and Drop API) con estado visual (hover, dragging, dropping)
- **Botón "Seleccionar archivo" también disponible** — UX dual: el usuario puede arrastrar O clickear, ambos caminos soportados en el mismo componente
- Preview de imágenes
- Progress bar durante upload
- Validación visual de tipo y tamaño
- Mensajes de error inline
- Soporte multi-archivo
- Accesible (keyboard nav, aria-labels)

**Nota UX explícita:** el componente debe exponer ambas interacciones simultáneamente — no un modo "solo drop" ni "solo click". Esto aplica al upload de documentos del paciente y al upload de logo de clínica.

**Ubicación:** `frontend/src/components/ui/dropzone.tsx`

### 2.2 `<EmptyState>`
Unificar los estados vacíos repartidos por el sistema.
- Icono grande
- Título + descripción
- CTA opcional
- Variantes: default, error, loading

**Ubicación:** `frontend/src/components/ui/empty-state.tsx`

### 2.3 `<PageHeader>`
Header consistente para todas las páginas del dashboard.
- Breadcrumbs
- Título + subtítulo
- Acciones primarias/secundarias
- Badge de estado opcional

**Ubicación:** `frontend/src/components/ui/page-header.tsx`

### 2.4 `<StatCard>`
Para KPIs del dashboard y reportes.
- Valor grande + label
- Trend indicator (up/down/flat)
- Icono contextual
- Loading skeleton

**Ubicación:** `frontend/src/components/ui/stat-card.tsx`

**Entregable:** 4 componentes con Storybook-like examples o documentados con JSDoc.

---

## Fase UI-3 — Rediseño por sección (iterativo)

**Objetivo:** aplicar las primitivas y rediseñar cada sección con criterio premium.

### Orden propuesto (por visibilidad e impacto)

1. [ ] **Landing page** (`frontend/src/app/page.tsx` + `/planes`)
   - Hero, features, pricing, testimonials, CTA
   - Aplicar HEALTH_TRUST palette
   - Animaciones sutiles
2. [ ] **Login/Register** (`frontend/src/app/(auth)/`)
   - Split screen elegante
   - Hero illustration o gradiente
3. [ ] **Dashboard home** (`frontend/src/app/(dashboard)/dashboard/page.tsx`)
   - Stat cards con trends
   - Quick actions
   - Gráficos con loading states
4. [ ] **Ficha del paciente** (`frontend/src/app/(dashboard)/dashboard/pacientes/[id]/page.tsx`)
   - **Tab Documentos con el nuevo `<Dropzone>`** (caso explícito del usuario)
   - Header con avatar + info key
   - Timeline de turnos
5. [ ] **Turnos** (`frontend/src/app/(dashboard)/dashboard/turnos/page.tsx`)
   - Calendario visual mejorado
   - Cards de turno con info densa
   - Modal de crear turno rediseñado
6. [ ] **Configuración** (`frontend/src/app/(dashboard)/dashboard/configuracion/page.tsx`)
   - Tabs con mejor jerarquía visual
   - Upload de logo con `<Dropzone>`
7. [ ] **Lista de pacientes** — tabla con filtros, bulk actions
8. [ ] **Tratamientos** — cards con precios
9. [ ] **Panel admin** — sin urgencia, solo lo ve el superadmin

**Cada sección = 1 commit.** Mergeable independientemente.

---

## Fase UI-4 — Micro-interacciones y polish

**Objetivo:** el detalle final que distingue un producto "bueno" de un producto "premium".

- [ ] Skeletons de loading en todas las listas/cards
- [ ] Transiciones suaves entre rutas
- [ ] Hover/focus states consistentes
- [ ] Toast notifications rediseñados
- [ ] Dark mode consistency audit (contraste, legibilidad)
- [ ] Accesibilidad: aria-labels, keyboard nav, focus rings
- [ ] Animaciones con Framer Motion en puntos clave (no abusar)

---

## Referencias visuales recomendadas

Antes de empezar, definir qué benchmarks visuales queremos imitar:

- **Linear** — dashboard minimalista, alta densidad de info
- **Stripe** — dashboard + landing, excelente consistencia
- **Vercel** — cards con gradientes sutiles
- **Notion** — tipografía y spacing impecables
- **Framer** — animaciones y transiciones

**Pregunta pendiente al usuario:** ¿cuál es la referencia más cercana a lo que buscás? Sin un norte visual claro, la ejecución es puro ensayo y error.

---

## Preguntas abiertas antes de ejecutar

1. **¿Referencia visual?** (Linear, Stripe, Vercel, Notion, otro)
2. **¿Prioridad landing o dashboard?**
3. **¿Se intercala con Fase S3 (Auth) o primero se termina UI?**
4. **¿Hay algún componente de terceros que quieras usar?** (ej. `shadcn/ui` ya está, ¿añadir `aceternity-ui`, `magic-ui`, `motion-primitives`?)

---

## Dependencias y consideraciones técnicas

- **Stack actual:** Next.js 16 (Turbopack) + TailwindCSS + shadcn/ui
- **Paleta:** HEALTH_TRUST (ya implementada en globals.css)
- **NO romper:** auth flow, funcionalidades de chat, calendario de turnos, webhooks
- **Testing:** cada commit debe compilar (`tsc --noEmit`) y arrancar dev server sin warnings nuevos

---

## Estimación total

| Fase | Días | Riesgo |
|------|------|--------|
| UI-1 Auditoría | 1 | Bajo |
| UI-2 Componentes base | 2-3 | Bajo |
| UI-3 Rediseño secciones | 5-8 | Medio (por superficie amplia) |
| UI-4 Polish | 2-3 | Bajo |
| **Total** | **10-15 días** | **Medio** |

Si el usuario quiere una muestra rápida antes de comprometer todo esto, se puede ejecutar **solo UI-2.1 (Dropzone) + aplicar al tab Documentos** como prueba del nivel esperado. ~4 horas.


## UTILIZALAS SKILLS QUE SE ENCUENTRAN EN LA CARPETA SKILL TEN EN CUENTA LAS PAUTAS IMPORTANTES QUE ESTAN EN EL ARCHIVO PLAN_REDISENO_UI_AVAX_HEALTH.MD, RECUERDA QUE EL DISEÑO, SEO Y EXPERIENCIA DEL USUARIO DEBE SER DE PRIMER NIVEL.