# Roadmap de Features — Avax Health
> Actualizado: 2026-04-19

---

## Estado actual (completado)

| Feature | Estado |
|---------|--------|
| Supabase DB / Storage / Auth / Realtime | ✅ en producción |
| Notificaciones admin Realtime | ✅ en producción |
| Billing MP — suscripciones SaaS | ✅ en producción |
| MP por clínica (credenciales propias + webhook) | ✅ code-complete |
| Rol `turnos_only` + Plan "Avax Health Turnos" | ✅ code-complete |
| Planes: show_in_landing + default_role + slide-over configurador | ✅ code-complete |
| Soporte técnico al lado de suscripción (2 columnas) | ✅ code-complete |
| Overlays sin backdrop-blur (fix visual) | ✅ code-complete |

---

## R2 — Obra social / Prepaga ⭐ PRÓXIMA

**Objetivo:** registrar la cobertura médica del paciente y mostrarla en el turno.

### Backend
- Migration SQL: `ALTER TABLE pacientes ADD COLUMN obra_social TEXT, ADD COLUMN nro_afiliado TEXT, ADD COLUMN plan_os TEXT`
- Actualizar `CreatePacienteDto` y `UpdatePacienteDto`
- Devolver los campos en el endpoint de ficha de paciente

### Frontend
- Nuevo grupo "Cobertura Médica" en la ficha del paciente: Obra Social, Nro. Afiliado, Plan
- Mostrar la cobertura también en la vista del turno (datos del paciente)
- Filtro por obra social en la lista de pacientes

---

## R1 — Reportes y exportaciones

### R1-A — Reporte de turnos
**Backend:** `GET /reports/turnos` con query params `desde`, `hasta`, `profesional_id`
- Respuesta: `{ total, por_estado, por_profesional[], por_mes[], cancelaciones_pct }`
- `GET /reports/turnos/csv` → descarga CSV

**Frontend:** nueva página `/dashboard/reportes`
- Selector de rango de fechas (este mes / mes anterior / 3 meses / personalizado)
- 4 KPI cards: total, completados, cancelados, tasa de asistencia
- Gráfico de barras por mes
- Tabla detallada con paginación
- Botón "Exportar CSV"

### R1-B — Reporte de pacientes
- `GET /reports/pacientes` → `{ total, nuevos_este_mes, por_obra_social[] }`
- Frontend: KPIs + gráfico nuevos pacientes por mes + exportación CSV

### R1-C — Reporte de pagos
- `GET /reports/pagos` → `{ total_facturado, por_estado[], por_mes[] }`
- Frontend: tabla con filtros por fecha + exportación CSV

### R1-D — Informe narrativo generado por IA ⭐
**Objetivo:** botón "Generar informe" → GPT-4 analiza los datos del mes y produce un resumen ejecutivo en español con observaciones y recomendaciones.

**Backend:**
- `POST /reports/informe-ia` — llama a OpenAI con el contexto de datos del mes
- Caché en Redis con TTL de 24h (mismo informe del día no se regenera)
- OpenAI SDK ya integrado en `agent.service.ts` — reutilizar configuración

**Frontend:**
- Card en la página de reportes: "Informe Ejecutivo IA"
- Spinner mientras genera (~5s)
- Resultado renderizado con Markdown
- Botones: "Regenerar" y "Copiar al portapapeles"

---

## R3 — Lista de espera

**Objetivo:** cuando un horario está completo, el paciente queda en lista de espera y recibe WhatsApp si se libera un turno.

**Backend:**
- Nueva entidad `ListaEspera`: `paciente_id`, `clinica_id`, `profesional_id`, `fecha_preferida`, `estado` (activa / notificada / vencida)
- `POST /lista-espera` — el agente puede agregar pacientes
- Trigger al cancelar un turno: buscar lista de espera del mismo profesional/fecha y notificar al primero

**Frontend:**
- Sección "Lista de Espera" en `/dashboard/turnos`
- Tabla: paciente, fecha preferida, estado, acciones

---

## R4 — Encuesta NPS post-turno

**Objetivo:** 2 horas después de un turno completado, enviar WhatsApp: "¿Del 1 al 10 cómo calificás tu visita?"

**Backend:**
- Campo en `Turno`: `encuesta_enviada: boolean`, `nps_score: number | null`
- Cron job o n8n workflow: busca turnos completados hace >2h con `encuesta_enviada = false`
- `POST /turnos/:id/nps` — el agente recibe la respuesta y la guarda

**Frontend:**
- KPI "NPS promedio" en dashboard y reportes
- Tabla de respuestas con historial en la página de reportes

---

## R5 — Consentimientos informados

**Objetivo:** generar PDF de consentimiento con datos del paciente, enviarlo por WhatsApp, registrar aceptación.

**Backend:**
- `GET /turnos/:id/consentimiento/pdf` — genera PDF con `pdfkit` o similar
- Guardar en Supabase Storage bajo `consentimientos/`
- `PATCH /turnos/:id/consentimiento/aceptar` — marca como aceptado

**Frontend:**
- Botón "Enviar consentimiento" en la vista del turno
- Badge "Consentimiento firmado" en la ficha del paciente

---

## R6 — Recordatorios configurables

**Objetivo:** el admin elige cuántas horas antes del turno se envía el recordatorio WhatsApp.

**Backend:**
- Campo en `Clinica`: `recordatorio_horas_antes: number` (default: 24)
- Exponer en `PATCH /clinicas/me`

**Frontend:**
- Input numérico en tab "WhatsApp / IA" de Configuración: "Enviar recordatorio X horas antes"

---

## Orden recomendado de implementación

| # | Fase | Complejidad | Impacto |
|---|------|-------------|---------|
| 1 | R2 — Obra social/prepaga | Baja | Alto — solicitado por clínicas |
| 2 | R1-A/B — Reportes básicos | Media | Alto — muy solicitado |
| 3 | R6 — Recordatorios configurables | Muy baja | Medio — quick win |
| 4 | R1-D — Informe IA | Media | Alto — diferenciador |
| 5 | R3 — Lista de espera | Media-alta | Medio |
| 6 | R4 — NPS post-turno | Media | Medio |
| 7 | R5 — Consentimientos | Alta | Medio-alto |
