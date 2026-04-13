# Plan de Rediseño UX/UI — Avax Health

> Creado: 2026-04-13
> Estado: Pendiente de ejecución
> Alcance: Landing page + sistema completo (dashboard)

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
