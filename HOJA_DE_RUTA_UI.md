# Hoja de Ruta — Reestilizado y Mejoras UI/UX

> Última actualización: 2026-03-24

## Fixes aplicados
- [x] Select de Paciente y Odontólogo en Nuevo Turno mostraba UUID en vez del nombre — corregido con display manual

---

## Fase A: Ficha del Paciente (Vista Unificada)

### Backend
- [x] Endpoint GET `/pacientes/:id/ficha` — devuelve datos del paciente + turnos + historial médico + pagos en una sola llamada

### Frontend
- [x] Nueva página `/dashboard/pacientes/[id]` — vista completa del paciente
- [x] Sección: Datos personales (nombre, DNI, edad, contacto)
- [x] Sección: Próximos turnos (tabla con estado, fecha, odontólogo)
- [x] Sección: Historial de turnos pasados
- [x] Sección: Historial médico (diagnóstico, tratamiento, observaciones por fecha)
- [x] Sección: Pagos del paciente (total pagado, pendientes, detalle)
- [x] KPI cards en la ficha: Total turnos, Último turno, Total pagado, Saldo pendiente
- [x] Botón "Ver" en la tabla de pacientes que lleva a esta ficha

---

## Fase B: Navegación Cruzada entre Secciones

### Pacientes
- [ ] Botón "Ver ficha" en tabla de pacientes → `/dashboard/pacientes/[id]`
- [ ] Desde ficha del paciente: botón "Nuevo turno" pre-cargado con el paciente
- [ ] Desde ficha del paciente: botón "Agregar historial" pre-cargado

### Turnos
- [ ] Nombre del paciente clickeable → lleva a ficha del paciente
- [ ] Nombre del odontólogo clickeable → filtra turnos por ese odontólogo
- [ ] Botón "Ver historial" que lleva al historial del paciente del turno

### Pagos
- [ ] Nombre del paciente clickeable → lleva a ficha del paciente
- [ ] Fecha del turno clickeable → lleva a la vista de turnos de ese día

### Historial Médico
- [ ] Mostrar turno asociado con fecha y link al turno
- [ ] Desde la ficha del paciente poder agregar historial directamente

---

## Fase C: Dashboard Principal Interactivo

### KPIs clickeables
- [ ] "Turnos Hoy" → redirige a `/dashboard/turnos` con fecha de hoy
- [ ] "Pacientes" → redirige a `/dashboard/pacientes`
- [ ] "Ingresos del Mes" → redirige a `/dashboard/pagos` con filtro del mes
- [ ] "Stock Bajo" → redirige a `/dashboard/inventario` filtrado por stock bajo

### Turnos de hoy clickeables
- [ ] Click en un turno → abre detalle rápido o redirige a turnos

### Mejoras visuales
- [ ] Indicador de tendencia en KPIs (↑ ↓ vs mes anterior)
- [ ] Gráficos con tooltips mejorados

---

## Fase D: Mejoras en Tablas (Todas las secciones)

### Paginación
- [ ] Backend: agregar parámetros `page` y `limit` a todos los endpoints GET de listado
- [ ] Frontend: componente de paginación reutilizable
- [ ] Aplicar en: Pacientes, Turnos, Pagos, Inventario, Proveedores, Historial Médico

### Ordenamiento por columnas
- [ ] Backend: agregar parámetros `sortBy` y `sortOrder` a los endpoints
- [ ] Frontend: headers de tabla clickeables con indicador de orden (▲ ▼)
- [ ] Aplicar en todas las tablas

### Búsqueda y filtros avanzados
- [ ] Pacientes: filtro por rango de edad, fecha de registro
- [ ] Turnos: filtro por odontólogo
- [ ] Inventario: filtro por proveedor, solo stock bajo
- [ ] Pagos: ya tiene filtros (mantener)

---

## Fase E: Configuración de la Clínica

- [ ] Nueva página `/dashboard/configuracion`
- [ ] Datos de la clínica (nombre, dirección, teléfono, logo)
- [ ] Horarios de atención (lunes a sábado, hora inicio/fin)
- [ ] Gestión de usuarios/equipo (lista de odontólogos y asistentes)
- [ ] Agregar al sidebar como última opción con ícono de engranaje

---

## Fase F: Sistema de Notificaciones

### Backend
- [ ] Endpoint GET `/notificaciones` — notificaciones recientes
- [ ] Generar notificaciones automáticas: turno próximo (30 min), stock bajo, pagos pendientes

### Frontend
- [ ] Ícono de campana en el header con badge de cantidad
- [ ] Dropdown con lista de notificaciones
- [ ] Marcar como leída
- [ ] Tipos: info (turno próximo), warning (stock bajo), alert (pago vencido)

---

## Estado General

| Fase | Descripción | Estado |
|------|-------------|--------|
| **A** | Ficha del Paciente | ✅ Completada |
| **B** | Navegación Cruzada | ❌ Pendiente |
| **C** | Dashboard Interactivo | ❌ Pendiente |
| **D** | Mejoras en Tablas | ❌ Pendiente |
| **E** | Configuración Clínica | ❌ Pendiente |
| **F** | Notificaciones | ❌ Pendiente |
