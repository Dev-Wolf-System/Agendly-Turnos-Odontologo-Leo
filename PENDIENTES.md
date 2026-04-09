# Pendientes Planificados — Avax Health

> Actualizado: 2026-04-09

---

## 1. Agente Zoe IA (Multi-tenant)

**Prioridad:** Alta — diferenciador de producto
**Estado:** Flujo core implementado y publicado en n8n

- [x] 1 flujo n8n para todas las clinicas, router por `clinica_id` (instancia Evolution)
- [x] Endpoints API dedicados para el agente (`/api/agent/*`)
- [x] Paciente via WhatsApp: registrarse, agendar turno, cancelar, consultar info clinica
- [x] System prompt dinamico por clinica (nombre, horarios, profesionales, tratamientos)
- [x] Procesamiento de audio (Whisper) + texto
- [x] Buffer Redis con debounce 5s para mensajes rapidos
- [x] Memoria conversacional en PostgreSQL (30 mensajes)
- [x] Widget frontend demo con gradiente `from-primary to-accent` y `glow-pulse`
- [x] Config WhatsApp en dashboard: credenciales Evolution + instrucciones del agente
- [ ] Admin via WhatsApp: resumen turnos, finanzas, alertas (Flujo 4 del plan)
- [ ] Recordatorios automaticos de turnos via WhatsApp (Flujo 2 — cron)
- [ ] Confirmacion/cancelacion post-recordatorio (Flujo 3)
- [ ] Follow-up post-turno (Flujo 6)
- [ ] Configurar credenciales HTTP en n8n (Avax Health API Key para nodos HTTP Request)
- [ ] Mover config WhatsApp (Evolution instance/key) de clinica a admin panel

**Workflow n8n:** `d68rLn6WSlnfkvZo` — "Asistente Avax Health IA Virtual - Zoé"
**Dependencias:** Evolution API configurada por clinica, OpenAI API key, Redis

---

## 2. Mejoras Admin Panel

**Prioridad:** Alta — UX del panel de gestion

- [ ] Simplificar estados de suscripciones a 4: Activa, Inactiva, Cancelada, Vencida
- [ ] Mover configuracion WhatsApp (Evolution instance/API key) de clinica a admin
- [ ] Mejorar UX de acciones masivas en suscripciones

---

## 3. Reportes Avanzados

**Prioridad:** Media — valor para clinicas grandes

- [ ] Reporte de productividad (turnos completados por profesional, ratio cancelacion)
- [ ] Reporte de pacientes (nuevos vs recurrentes, frecuencia de visita)
- [ ] Reporte financiero (ingresos por periodo, metodo de pago, tratamiento)
- [ ] Reporte de ocupacion (horas disponibles vs ocupadas, horas pico)
- [ ] Reporte de tratamientos (mas realizados, ingresos por tratamiento)
- [ ] Export PDF con branding de la clinica (logo, colores, nombre)
- [ ] Export Excel (.xlsx) con hojas por seccion

**Dependencias:** Ninguna (datos ya disponibles en BD)

---

## 4. Archivos Medicos

**Prioridad:** Media — solicitado por clinicas

- [ ] Entidad `ArchivoMedico` (id, paciente_id, clinica_id, nombre, tipo, url, uploaded_by, created_at)
- [ ] Storage: S3 o disco local configurable
- [ ] Endpoints: POST upload, GET listar, DELETE eliminar
- [ ] Tab "Documentos" en ficha del paciente (`/dashboard/pacientes/[id]`)
- [ ] Upload drag-and-drop con preview de imagenes
- [ ] Soporte: imagenes (JPG, PNG), PDFs, documentos
- [ ] Limite de tamanio por plan (configurable en feature flags)

**Dependencias:** Configuracion de storage (S3 bucket o path local)

---

## 5. Infraestructura

**Prioridad:** Alta — necesario para colaboracion

- [ ] Subir a GitHub remoto (`git remote add origin` + `git push`)
- [ ] Configurar CI/CD basico (GitHub Actions: lint + build)
- [ ] Variables de entorno documentadas en `.env.example`
- [ ] Docker Compose para desarrollo local (PostgreSQL + Redis + backend + frontend)

---

## 6. Mejoras Menores Pendientes

**Prioridad:** Baja — polish

- [ ] Pagina publica `/planes` y landing `/` — revisar con nuevos colores HEALTH_TRUST en produccion
- [ ] Onboarding wizard — migrar colores restantes a tokens CSS
- [ ] Upgrade prompt component — verificar gradientes con nueva paleta
- [ ] Testing: agregar tests unitarios para guards y servicios criticos
- [ ] Accesibilidad: revisar contraste de colores en dark mode, aria labels

---

## Orden sugerido de implementacion

```
1. Infraestructura (GitHub + CI)     → desbloquea colaboracion
2. Mejoras Admin Panel               → UX critica (suscripciones + WhatsApp config)
3. Agente Zoe IA (flujos faltantes)  → recordatorios, follow-up, notif admin
4. Reportes Avanzados                → valor para clinicas grandes
5. Archivos Medicos                  → feature solicitada
6. Mejoras Menores                   → polish continuo
```

---

## Fases completadas (referencia)

| Fase | Descripcion | Fecha |
|------|------------|-------|
| A | Ficha del Paciente | 2026-03 |
| B | Mejoras Visuales y Funcionales | 2026-03-25 |
| C | Tratamientos Dinamicos | 2026-03-26 |
| D | Logo de Clinica y Branding | 2026-03-26 |
| E | Configuracion de la Clinica (5 tabs) | 2026-03-26 |
| F | Webhooks y Recordatorios | 2026-03-26 |
| G | Notificaciones | 2026-03 |
| H | Navegacion Cruzada | 2026-03 |
| I | Panel Admin SaaS Premium | 2026-04 |
| J | Rebranding Avax Health | 2026-04 |
| K | Feature Flags + Panel Profesional | 2026-04 |
| L | Chat Interno + Dashboard Configurable | 2026-04 |
| M | Rename professional + Suscripcion + Soporte | 2026-04 |
| N | Fixes de Produccion | 2026-04 |
| O | Planes Dinamicos + Registro Premium | 2026-04 |
| P | Bugs Admin + Flujo Trial + Rediseno HEALTH_TRUST | 2026-04-07 |
| Q | Workflow n8n Zoé + Fixes Admin + Widget Zoé + Config WhatsApp | 2026-04-09 |
