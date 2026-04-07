# 📌 Plan de Mejoras — Dashboard, Landing, Admin, Enforcement

**El plan cubre 13 puntos organizados en 7 grupos por área, con orden de implementación sugerido de menor a mayor complejidad.**

## 🔎 Resumen rápido
1. KPIs layout → 2 filas de 3 (`max lg:grid-cols-3`)
2. Config dashboard → agregar los 7 KPIs + "Seleccionar todos"
3. Fix delete plan → validar suscripciones antes de borrar + soft-delete
4. Especialidad en registro → select en Step 1, auto-asigna logo `__esp:`
5. Plan Pro IA → nuevo tier con `multi_sucursal` + `max_sucursales`
6. Sucursales → módulo completo backend + frontend (solo plan Pro IA)
7. Carousel planes → scroll-snap mobile and desktop.
8. Landing premium → hero con mockup, secciones extra, animaciones
9. Botones planes → "Contactanos" para pagos, solo trial en registro
10. Onboarding wizard → 5 steps al primer login, flag `onboarding_completado`
11. Estados suscripción → mejorar labels + tooltips
12. Prospectos/Leads → módulo nuevo backend + admin panel
13. Enforcement límites → hook `usePlanLimits` + indicadores frontend + guards

---

## 🧠 Contexto

El usuario solicita 13 mejoras/fixes que abarcan Dashboard clínica, Configuración KPIs, Landing page, Planes, Panel admin y Enforcement de límites. Se agrupan por área para implementación eficiente.

---

# 🧩 Grupo 1: Dashboard Clínica (Puntos 1 y 2)

## Punto 1 — KPIs en 2 filas de 3

**Problema:** 6 KPIs en una sola fila (`xl:grid-cols-6`) quedan comprimidos y poco legibles.

**Solución:** Usar máximo `lg:grid-cols-3` → 2 filas de 3, agregar `gap-6`.

**Archivo:** `frontend/src/app/(dashboard)/dashboard/page.tsx` (línea 538)

**Cambios:**
- `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6`
- Eliminar `xl:grid-cols-5/6`
- Ajustar skeleton loader (~línea 186)

## Punto 2 — Configuración Dashboard

**Problema:** Faltan KPIs y opción de activar/desactivar todos.

**Solución:** Agregar `completadosHoy`, `confirmadosRestantes`, botón "Seleccionar todos" / "Deseleccionar todos".

**Archivo:** `frontend/src/app/(dashboard)/dashboard/configuracion/page.tsx`

**Cambios:** Extender `KPI_OPTIONS`, botones por grupo (KPIs y secciones), actualizar defaults.

**Extra:** Asegurar uso de `isKpiVisible()` en `dashboard/page.tsx`.

---

# 🐛 Grupo 2: Fix error (Punto 3)

## Punto 3 — Error en `deleteAdminPlan`

**Problema:** Falla por foreign key constraint (suscripciones asociadas).

**Solución backend:**
- Verificar suscripciones activas antes de borrar
- Si existen → `ConflictException`
- Ideal: usar soft-delete (`is_active = false`)

**Archivo:** `backend/src/modules/plans/plans.service.ts`

**Frontend:** Agregar `try/catch`, mostrar error en toast.

---

# 🌐 Grupo 3: Landing Page (4, 7, 8, 9)

## Punto 4 — Especialidad en registro

**Backend:** Agregar `especialidad?: string`, auto logo: `__esp:${especialidad}`

**Frontend:** Select en Step 1, preview de icono.

## Punto 7 — Carousel de planes

**Mobile:** Scroll horizontal (scroll-snap), indicadores (dots).

**Desktop:** Grid (3–4 columnas).

## Punto 8 — Landing premium

Mejoras: Hero con mockup, sección "Cómo funciona", Testimonials, Integraciones, Animaciones (Intersection Observer), Footer completo, SVGs inline.

## Punto 9 — Botones de planes

- Trial → `/register`
- Pagos → "Contactanos"
- Formulario → genera lead
- Registro: eliminar selección de plan, solo trial automático.

---

# 🚀 Grupo 4: Plan Pro IA + Sucursales (5 y 6)

## Punto 5 — Nuevo plan

**Nombre:** Avax Clínica Pro IA

**Características:** `multi_sucursal`, `max_sucursales: 10`, Usuarios: 200, Pacientes: ilimitados.

## Punto 6 — Módulo Sucursales

**Backend:** Entity `Sucursal`, CRUD + stats, endpoints `/sucursales`, `/sucursales/:id/stats`, `/sucursales/resumen`, guard por plan.

**Frontend:** Nueva sección dashboard, KPIs agregados, cards por sucursal, crear sucursal, sidebar dinámico.

---

# 🧑‍💼 Grupo 5: Admin (11 y 12)

## Punto 11 — Estados de suscripción

Mantener: `trial`, `gracia`, `past_due`, `vencida`.

Mejorar labels: Trial (Prueba), En Gracia, Pago Pendiente, Vencida. Agregar tooltips.

## Punto 12 — Leads

**Backend:** Entity `Lead`, estados: `nuevo`, `contactado`, `en_negociacion`, `convertido`, `descartado`. Endpoints: `POST /leads`, admin CRUD + stats.

**Frontend:** Sección "Prospectos", KPIs, filtros, panel de detalle, sidebar.

---

# 🧭 Grupo 6: Onboarding (Punto 10)

## Wizard de primer login

**Steps:** Bienvenida, Config clínica, Primer profesional, Tour sistema, Finalización.

**Backend:** `onboarding_completado: boolean`

**Frontend:** Mostrar si es `false`.

---

# 🔒 Grupo 7: Enforcement (Punto 13)

**Backend:** Verificar guards existentes, extender `/mi-suscripcion` con usage.

**Frontend — Pacientes:** Mostrar "X de Y", bloquear botón si límite alcanzado.

**Frontend — Usuarios:** Mismo patrón.

**Hook `usePlanLimits`** retorna:
```ts
{
  maxPacientes,
  currentPacientes,
  canAddPaciente,
  maxUsuarios,
  currentUsuarios,
  canAddUsuario,
  planNombre
}
```

---

# 🗺️ Orden de Implementación

| Fase | Puntos | Descripción | Complejidad | Estado |
|------|--------|-------------|-------------|--------|
| 1 | 1, 2 | Dashboard KPIs | Baja | ✅ Completado 2026-04-05 |
| 2 | 3 | Fix delete plan | Baja | ✅ Completado 2026-04-05 |
| 3 | 11 | Estados suscripción | Baja | ✅ Completado 2026-04-05 |
| 4 | 13 | Enforcement | Media | ✅ Completado 2026-04-05 |
| 5 | 4, 9 | Registro + contacto | Media | ✅ Completado 2026-04-05 |
| 6 | 8 | Landing premium | Media-Alta | ✅ Completado 2026-04-05 |
| 7 | 7 | Carousel | Media | ✅ Completado 2026-04-05 |
| 8 | 12 | Leads | Media | ✅ Completado 2026-04-05 |
| 9 | 10 | Onboarding | Media | ✅ Completado 2026-04-05 |
| 10 | 5, 6 | Pro IA + sucursales | Alta | ✅ Completado 2026-04-05 |

---

# ✅ Verificación (actualizado 2026-04-05)

- [x] KPIs en 2 filas de 3 — grid `lg:grid-cols-3`, skeleton 6 cards
- [x] 7 KPIs configurables — agregados `completadosHoy` y `confirmadosRestantes` + botones "Seleccionar/Deseleccionar todos"
- [x] Delete plan con validación — `ConflictException` si hay suscripciones, toast en frontend
- [x] Registro con especialidad — select 14 especialidades, auto-logo `__esp:`, sin selección de plan (solo trial)
- [x] Carousel de planes — scroll-snap desktop+mobile, arrows, dots indicator
- [x] Botones planes — trial→`/register`, pagos→`mailto:ventas@avaxhealth.com`
- [x] Estados suscripción — labels español (Trial→Prueba), tooltips descriptivos
- [x] Módulo leads/prospectos — entidad Lead, CRUD + stats backend, página admin con KPIs/filtros/panel detalle, sidebar admin
- [x] Enforcement límites — endpoint `/subscriptions/usage`, hook `usePlanLimits`, indicador "X de Y", botón bloqueado
- [x] Landing premium — hero con mockup, para quién, como funciona, testimonials, integraciones, feature highlights, CTA premium, footer completo, animaciones Intersection Observer
- [x] Onboarding wizard primer login — 5 steps (bienvenida, datos clinica, horarios, tour, listo), flag `onboarding_completado`, PATCH via updateMe
- [x] Plan Pro IA — nuevo plan "Avax Clinica Pro IA" ($59990, 200 usuarios, ilimitados pacientes, 10 sucursales), feature `multi_sucursal`, módulo sucursales backend (entity, CRUD, guard por feature), frontend (página, sidebar condicionado, servicio)

---

# 🔧 Fix: Build backend (2026-04-05)

**Problema:** `nest build` / `tsc` CLI no emitía archivos con TS 5.9.3 + `module: nodenext` + `incremental: true`.

**Solución:**
- `tsconfig.json`: `module: commonjs`, `moduleResolution: node`, `incremental: false`, removido `resolvePackageJsonExports` e `isolatedModules`
- Creado `build.js` — compilación programática con API de TypeScript
- `package.json`: `"build": "rm -rf dist && node build.js"`
- Comando para correr: `npm run build && node dist/main.js` o `npm run start:dev`

---

# 🎨 Rediseño UI/UX — Design System (2026-04-06)

## Completado

### Fase 1: Design System Foundation
- [x] Tokens semánticos de estado en `globals.css` — 15 variables `--status-*` (success/warning/error/info/neutral × base/fg/bg) para light y dark mode, registradas en `@theme inline`
- [x] Constantes centralizadas `src/lib/constants.ts` — `STATUS_COLORS`, `ESTADO_TURNO_LABELS`, `CHART_COLORS`, `CHART_TOOLTIP_STYLE`, `MONTH_LABELS`
- [x] Normalización `rounded-2xl` → `rounded-xl` en todo el proyecto (0 ocurrencias restantes)

### Fase 2: Componentes Reutilizables
- [x] `StatusBadge` (`src/components/ui/status-badge.tsx`) — badge semántico con mapeo estado→colores, onClick, tamaños sm/default
- [x] `KpiCard` (`src/components/ui/kpi-card.tsx`) — card KPI unificada con icono gradient, hover lift, link opcional
- [x] `PageHeader` (`src/components/ui/page-header.tsx`) — header estándar `text-2xl font-bold tracking-tight` con acciones
- [x] `SearchInput` (`src/components/ui/search-input.tsx`) — input con icono búsqueda, debounce, botón clear

### Fase 3: Migración
- [x] Dashboard principal — eliminados `estadoColors`, `mesesCortos`, `CHART_TOOLTIP_STYLE` locales → imports centralizados + StatusBadge
- [x] Turnos — eliminados `estadoColors`/`estadoLabels` → `STATUS_COLORS`/`ESTADO_TURNO_LABELS` + StatusBadge
- [x] Pagos — eliminado `estadoColors` → StatusBadge, removido import Badge unused
- [x] Soporte — migrados colores prioridad/categoría/estado a tokens semánticos

### Fase 4: Polish Visual
- [x] Utility class `.card-hover` para hover lift uniforme
- [x] Animación CSS `dialog-in` para entrada suave de modales
- [x] Login rediseñado — split-screen premium (panel branding dark + formulario elegante)

### Archivos nuevos
- `frontend/src/lib/constants.ts`
- `frontend/src/components/ui/status-badge.tsx`
- `frontend/src/components/ui/kpi-card.tsx`
- `frontend/src/components/ui/page-header.tsx`
- `frontend/src/components/ui/search-input.tsx`

### Archivos modificados (principales)
- `frontend/src/app/globals.css` — tokens + polish CSS
- `frontend/src/app/(dashboard)/dashboard/page.tsx`
- `frontend/src/app/(dashboard)/dashboard/turnos/page.tsx`
- `frontend/src/app/(dashboard)/dashboard/pagos/page.tsx`
- `frontend/src/app/(dashboard)/dashboard/soporte/page.tsx`
- ~30 archivos más con normalización `rounded-2xl` → `rounded-xl`
