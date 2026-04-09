# Plan: Agente Zoe — Secretario Virtual IA (SaaS Multi-Tenant)

> Evolución del flujo original de Zoe a una arquitectura multi-tenant integrada con Avax Health SaaS.
> Última actualización: 2026-04-09

---

## Estado Actual

### Completado
- [x] **Endpoints API dedicados** (`/api/agent/*`) con autenticación x-api-key
- [x] **Workflow n8n core** publicado (ID: `d68rLn6WSlnfkvZo`)
- [x] **Identificación multi-tenant** por instancia Evolution API
- [x] **Procesamiento texto + audio** (Whisper transcripción)
- [x] **Buffer Redis** con debounce 5s
- [x] **Agente IA** GPT-4.1-mini con system prompt dinámico por clínica
- [x] **8 tools** conectadas a la API de Avax Health
- [x] **Memoria conversacional** PostgreSQL (30 mensajes por sesión)
- [x] **Respuesta vía Evolution API** con delay de escritura natural
- [x] **Widget frontend** demo en dashboard
- [x] **Config WhatsApp** en dashboard (nombre agente, instrucciones, credenciales Evolution)
- [x] **Sticky notes** de configuración en el workflow

### Pendiente
- [ ] Configurar credenciales HTTP en n8n (Avax Health API Key)
- [ ] Flujo 2: Recordatorios de turnos (cron)
- [ ] Flujo 3: Confirmación/cancelación post-recordatorio
- [ ] Flujo 4: Resumen diario al profesional
- [ ] Flujo 5: Avisos de pago y suscripción
- [ ] Flujo 6: Follow-up post-turno
- [ ] Mover config WhatsApp (Evolution creds) de clínica a admin panel

---

## Arquitectura Implementada

```
WhatsApp (paciente)
  → Evolution API (webhook)
    → n8n Webhook receptor
      → Extraer datos (sender, tipo, texto/audio, timestamp, instance)
        → Buscar Clínica por Instancia (GET /api/agent/clinica/by-instance/:name)
          → Texto o Audio?
            → Texto: extraer mensaje directo
            → Audio: base64 → OGG → Whisper → texto
              → Buffer Redis (push mensaje)
                → Esperar 5s (debounce)
                  → Leer Buffer Redis
                    → ¿Soy el último mensaje?
                      → NO: Ignorar (llegó otro después)
                      → SI: Eliminar buffer → Combinar mensajes
                        → Obtener Info Clínica (GET /api/agent/clinica/:id/info)
                          → Agente Zoe IA (GPT-4.1-mini)
                            → Calcular delay de escritura
                              → Enviar respuesta WhatsApp (POST /message/sendText/:instance)
```

---

## Endpoints API Implementados

### Autenticación: Header `x-api-key`

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/agent/clinica/by-instance/:instanceName` | Identificar clínica por instancia Evolution |
| GET | `/api/agent/clinica/:clinicaId/info` | Info completa para system prompt (horarios, profesionales, tratamientos) |
| GET | `/api/agent/pacientes/by-phone/:phone?clinicaId=xxx` | Buscar paciente por teléfono |
| GET | `/api/agent/pacientes/by-dni/:dni?clinicaId=xxx` | Buscar paciente por DNI |
| POST | `/api/agent/pacientes` | Registrar nuevo paciente |
| GET | `/api/agent/turnos/disponibles?clinicaId=xxx&dias=3` | Consultar turnos disponibles |
| GET | `/api/agent/turnos/verificar/:pacienteId?clinicaId=xxx` | Verificar si paciente tiene turno activo |
| POST | `/api/agent/turnos` | Crear turno (estado PENDIENTE, source WHATSAPP) |
| PATCH | `/api/agent/turnos/:turnoId/estado` | Modificar estado (CONFIRMADO, CANCELADO) |
| GET | `/api/agent/turnos/proximos?horas=24` | Turnos próximos para recordatorios |
| POST | `/api/agent/webhooks/emit` | Emitir evento webhook |

---

## Tools del Agente

| Tool | Tipo | Endpoint |
|------|------|----------|
| Pensar | Think | Razonamiento interno |
| Buscar Paciente por Teléfono | HTTP GET | `/agent/pacientes/by-phone/:phone` |
| Buscar Paciente por DNI | HTTP GET | `/agent/pacientes/by-dni/:dni` |
| Registrar Paciente | HTTP POST | `/agent/pacientes` |
| Consultar Turnos Disponibles | HTTP GET | `/agent/turnos/disponibles` |
| Verificar Turno Existente | HTTP GET | `/agent/turnos/verificar/:pacienteId` |
| Crear Turno | HTTP POST | `/agent/turnos` |
| Modificar Estado Turno | HTTP PATCH | `/agent/turnos/:turnoId/estado` |

---

## System Prompt Dinámico

Se genera con datos de `GET /api/agent/clinica/:id/info`:

- Nombre del agente (configurable, default "Zoe")
- Nombre de la clínica
- Especialidad, dirección, teléfono
- Duración de turno default
- Lista de profesionales (nombre + ID)
- Lista de tratamientos (nombre + precio + duración)
- Horarios de la clínica (JSON por día)
- Instrucciones adicionales de la clínica (texto libre)
- Zona horaria: America/Argentina/Buenos_Aires

---

## Credenciales n8n

### Auto-asignadas
- Redis Wsp (General) → Buffer Redis, Leer Buffer, Eliminar Buffer
- API Key Test Zoe (Personal) → GPT-4.1 Mini (OpenAI)
- Historial de Chat (PostgreSQL) → Memoria Conversación

### Por configurar manualmente
- **Avax Health API Key** (Header Auth: `x-api-key`) → Todos los nodos HTTP Request a la API
- **OpenAI API Key** (Header Auth: `Authorization: Bearer`) → Transcribir Audio Whisper

---

## Flujos n8n Pendientes

### Flujo 2: Recordatorios de Turnos (Cron)
```
Cron cada hora (8:00-20:00 Argentina)
  → GET /api/agent/turnos/proximos?horas=24
    → Para cada turno: enviar recordatorio vía Evolution API
      → Marcar recordatorio_enviado = true
```

### Flujo 3: Confirmación/Cancelación Post-Recordatorio
```
Webhook Evolution API
  → Detectar respuesta a recordatorio ("confirmo"/"cancelo")
    → PATCH /api/agent/turnos/:id/estado
      → Responder confirmación/cancelación
```

### Flujo 4: Resumen Diario al Profesional
```
Cron 7:30 AM Argentina
  → Para cada clínica activa:
    → GET turnos del día + KPIs
      → Formatear mensaje resumen
        → Enviar al profesional vía Evolution API
```

### Flujo 5: Avisos de Pago y Suscripción
```
Cron 9:00 AM
  → Consultar suscripciones trial/activas próximas a vencer
    → Enviar avisos al dueño de la clínica
```

### Flujo 6: Follow-up Post-Turno
```
Webhook: turno_completado
  → Wait 2 horas
    → Enviar mensaje de seguimiento al paciente
```

---

## Configuración por Clínica

### Campos en entidad Clinica
- `agent_nombre`: Nombre del asistente (default: "Zoe")
- `agent_instrucciones`: Instrucciones adicionales (texto libre)
- `evolution_instance`: Nombre de instancia Evolution API
- `evolution_api_key`: API key de Evolution

### UI en Dashboard → Configuración → Tab WhatsApp
- Toggle activar/desactivar agente
- Campo nombre del agente
- Campo instrucciones personalizadas
- Campos credenciales Evolution (instancia + API key)
- Botón test de conexión

---

## Variables de Configuración del Workflow

```typescript
// En n8n-workflow-zoe.ts (líneas 11-14)
const API = 'https://api.avaxhealth.com/api';  // URL base API Avax Health
const EVO = 'https://evo.avaxhealth.com';       // URL base Evolution API
```

---

*Archivo fuente del workflow: `n8n-workflow-zoe.ts`*
*Workflow ID en n8n: `d68rLn6WSlnfkvZo`*
