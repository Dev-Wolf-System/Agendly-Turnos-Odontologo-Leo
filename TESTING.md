# Plan de Pruebas — Avax Health
> Actualizado: 2026-04-25

Checklist manual de verificación post-deploy. Marcar cada ítem con ✅ al confirmar o ❌ si falla (anotar el error).

---

## 🔴 P0 — Crítico (bloquea uso en producción)

### Autenticación
- [ ] Login con usuario válido → redirige al dashboard
- [ ] Login con credenciales incorrectas → muestra error, no redirige
- [ ] Cerrar sesión → redirige a /login, no permite volver con botón atrás

### Turnos — operaciones básicas
- [ ] Crear turno nuevo desde el dashboard → aparece en la lista
- [ ] Editar turno existente → los cambios se guardan
- [ ] Cancelar turno → estado cambia a "cancelado", no permite editar
- [ ] Cambiar estado de turno (pendiente → confirmado → completado) → refleja en UI inmediatamente
- [ ] Eliminar turno → desaparece de la lista

### Pacientes — operaciones básicas
- [ ] Crear paciente nuevo → aparece en la lista
- [ ] Editar datos del paciente (nombre, DNI, teléfono, obra social) → cambios persisten
- [ ] Buscar paciente por nombre/DNI → filtro funciona correctamente

---

## 🟡 P1 — Funcional (impacta flujo principal)

### fix: Eliminar pago
- [ ] Ir a Pagos → seleccionar cualquier pago → clic en eliminar → confirmar
- [ ] ✅ El pago desaparece de la lista al instante
- [ ] ✅ Recargar la página → el pago no vuelve a aparecer
- [ ] ❌ Bug anterior: el pago cambiaba de estado pero no se borraba — verificar que ya no ocurre

### Pagos — flujo completo
- [ ] Registrar pago manual en un turno → aparece en lista de pagos
- [ ] Cambiar estado de pago (pendiente → aprobado) → refleja correctamente
- [ ] Filtrar pagos por fecha / estado / profesional → resultados correctos

### Link de pago MercadoPago
- [ ] Abrir turno → clic en ícono $ → dialog se abre sin cerrar sesión
- [ ] Clic en "Generar link de pago" → link aparece en el campo de texto
- [ ] Copiar link → abrir en nueva pestaña → lleva a checkout de MercadoPago
- [ ] ❌ Bug anterior: generar el link cerraba la sesión — verificar que ya no ocurre

### R7-D: Reportes — Obras Sociales
- [ ] Ir a Reportes → scrollear al final → sección "Obras Sociales" visible
- [ ] Cambiar rango de fechas → los datos de OS se actualizan
- [ ] Si hay pacientes con OS asignada → aparecen en barras de turnos
- [ ] Si hay pagos aprobados → aparece sección "Facturación por obra social"
- [ ] Tabla detallada muestra columnas: cobertura, turnos, pacientes, facturado
- [ ] Si todos los pacientes son particulares → solo aparece "Particular"

---

## 🟢 P2 — Features nuevas

### R5: Consentimientos informados — Generación PDF
- [ ] Ir a Turnos → buscar turno con paciente que tenga DNI cargado
- [ ] Clic en ícono FileText (morado) → dialog se abre
- [ ] Clic en "Generar consentimiento" → spinner aparece mientras procesa
- [ ] ✅ Link al PDF aparece en el campo de texto copiable
- [ ] Clic en copiar → abrir link en navegador → PDF descargable con datos del paciente
- [ ] Verificar que el PDF contiene: nombre clínica, nombre/DNI paciente, fecha, tratamiento, texto legal, instrucción "responder ACEPTO"
- [ ] Cerrar y reabrir el dialog del mismo turno → muestra el link ya generado (no vuelve al estado inicial)
- [ ] Turno sin DNI de paciente → PDF se genera igual con "No registrado"

### R5: Consentimientos informados — Aceptación (requiere n8n)
> ⚠️ Requiere workflow n8n "consentimiento → ACEPTO" configurado y activo

- [ ] Generar PDF → copiar link → enviar manualmente por WhatsApp al paciente
- [ ] Paciente responde exactamente: **ACEPTO**
- [ ] Recargar turnos → ícono cambia de FileText (morado) a ShieldCheck (verde)
- [ ] Abrir dialog → muestra "Consentimiento firmado" con fecha y hora de aceptación

### R4: NPS post-turno (requiere n8n + Evolution API)
> ⚠️ Requiere workflow "R4 - NPS Post-Turno" activo y Evolution API configurada

- [ ] Marcar un turno como completado
- [ ] Esperar 2 horas (o forzar el cron) → paciente recibe WhatsApp con la encuesta
- [ ] Responder con un número del 1 al 10
- [ ] Ir a Reportes → sección NPS → score aparece registrado
- [ ] Verificar KPIs: total respuestas, promedio, promotores, detractores actualizados
- [ ] Tabla "Últimas respuestas" muestra el nuevo registro

### R3: Lista de espera
- [ ] Ir a Lista de Espera → agregar paciente con profesional y fecha preferida
- [ ] El registro aparece con estado "activa"
- [ ] Cancelar un turno del mismo profesional/fecha → paciente de la lista recibe WhatsApp
- [ ] Estado del registro cambia a "notificada" automáticamente
- [ ] Marcar manualmente como "convertida" → estado actualiza en la tabla

---

## 🔵 P3 — Integración y configuración

### Configuración de la clínica
- [ ] Ir a Configuración → cambiar nombre/logo → guardar → cambios visibles en el header
- [ ] Tab Webhooks → cargar URLs de webhook → guardar sin error
- [ ] Tab MercadoPago → ingresar credenciales de clínica → guardar → probar con link de pago

### Obras Sociales
- [ ] Ir a Obras Sociales → crear nueva OS con nombre y código
- [ ] OS aparece en el catálogo y en el selector al crear/editar paciente
- [ ] Registrar prestación en cuenta corriente → aparece en la tabla de prestaciones

### Reportes — secciones existentes
- [ ] KPIs de turnos muestran valores coherentes con los turnos del período
- [ ] Gráfico de turnos por mes renderiza sin errores
- [ ] Gráfico de nuevos pacientes por mes renderiza sin errores
- [ ] Sección NPS visible si hay respuestas en el período
- [ ] Botón "Exportar Excel" → descarga archivo .xlsx con datos correctos
- [ ] Botón "Generar informe IA" → genera texto narrativo en ~5-10s
- [ ] Botón "Descargar PDF" del informe → descarga PDF con el análisis

### Calendario
- [ ] Vista semanal muestra turnos del período correcto
- [ ] Vista diaria muestra los turnos del día seleccionado
- [ ] Clic en un turno del calendario → abre el detalle/edición

---

## 🧪 Casos borde

| Caso | Resultado esperado |
|------|--------------------|
| Crear turno sin paciente seleccionado | Error de validación, no guarda |
| Crear turno con horario superpuesto para el mismo profesional | Advertencia de superposición |
| Generar link de pago en turno sin tratamiento/precio asignado | Error: "El turno no tiene un precio asociado" |
| Sección OS en Reportes sin ningún turno en el período | La sección no aparece |
| Paciente sin obra social → aparece en reporte OS | Figura como "Particular" |
| Turno cancelado → intentar editar | Botón editar deshabilitado |
| Eliminar paciente con turnos activos | Verificar comportamiento (cascade o error) |

---

## 📋 Notas de entorno

- **URL producción:** https://avaxhealth.com
- **API producción:** https://api.avaxhealth.com
- **n8n:** https://n8n.srv878399.hstgr.cloud
- **SQL ejecutado en Supabase (sesión actual):**
  - `encuesta_enviada`, `nps_score` en `turnos` ✅
  - `consentimiento_enviado`, `consentimiento_url`, `consentimiento_aceptado`, `consentimiento_aceptado_at` en `turnos` ✅
  - Tabla `lista_espera` — **verificar si fue creada**
  - Bucket `consentimientos` en Supabase Storage — **verificar si fue creado**

---

## 🐛 Registro de bugs encontrados

| Fecha | Feature | Descripción | Estado |
|-------|---------|-------------|--------|
| 2026-04-25 | Pagos | `remove()` cambiaba estado en lugar de borrar | ✅ Corregido |
| 2026-04-25 | Link pago | Llamada a `/agent/` con ApiKeyAuth cerraba sesión | ✅ Corregido |
| 2026-04-24 | Lista espera | `ClinicaRepository` no registrado en módulo | ✅ Corregido |
