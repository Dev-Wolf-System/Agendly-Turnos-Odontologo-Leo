# Plan: Agente Zoe — Secretario Virtual IA (SaaS Multi-Tenant)

> Evolución del flujo original de Zoe a una arquitectura multi-tenant integrada con Avax Health SaaS.

---

## Análisis del Flujo Actual

### Arquitectura Existente
```
WhatsApp (Evolution API)
  → Webhook receptor
    → Extracción de datos (sender, tipo, texto/audio, timestamp)
      → Auth (verifica si el cel existe en users)
        → Validación (existe / no existe / inactivo)
          → Buffer Redis (acumula mensajes del mismo sender por 5s)
            → Agente IA "Zoe" (GPT-4.1-mini)
              → Tools: think, consultar_turnos, existencia_usuario,
                        tiene_turno, nuevo_paciente, mod_estado_turno,
                        Agente_Registro_Turnos (sub-agente → Google Calendar + DB)
              → Base de Conocimiento (Google Docs)
              → Memoria (PostgreSQL Chat Memory, 30 mensajes)
            → Delay de "escribiendo" (length * 40ms)
              → Respuesta vía Evolution API
```

### Lo que funciona bien (mantener)
- Buffer Redis para acumular mensajes rápidos del mismo usuario
- Transcripción de audio con OpenAI Whisper
- Tool `think` para razonamiento antes de acciones
- Delay de escritura para simular comportamiento humano
- Memoria conversacional en PostgreSQL
- Flujo de registro de paciente + agendamiento en 2 pasos

### Limitaciones del flujo actual
1. **Single-tenant**: Hardcoded para una sola clínica (Leo Villacorta)
2. **Queries directas a DB**: En vez de usar la API de Avax Health
3. **Google Calendar directo**: Cada clínica necesitaría su propio OAuth
4. **Base de conocimiento estática**: Un solo Google Doc para todos
5. **Sin webhook de eventos**: No notifica al panel cuando algo pasa
6. **Sin recordatorios automáticos**: No hay cron para avisar turnos próximos
7. **Sin gestión de pagos/inventario**: El agente no puede informar sobre finanzas

---

## Propuesta: Zoe SaaS Multi-Tenant

### Arquitectura Nueva
```
WhatsApp (Evolution API) ──→ Webhook receptor n8n
                                    │
                                    ▼
                           Identificar Clínica
                           (por instancia Evolution o número)
                                    │
                                    ▼
                           Obtener Config Clínica
                           (API Avax Health: /api/clinicas/:id/config)
                                    │
                                    ▼
                           Auth + Validación
                           (API Avax Health: verificar número)
                                    │
                                    ▼
                           Buffer Redis
                           (key: clinicaId:senderPhone)
                                    │
                                    ▼
                           ┌─── Agente Zoe ───┐
                           │  System prompt    │
                           │  dinámico por     │
                           │  clínica          │
                           │                   │
                           │  Tools vía API:   │
                           │  - turnos         │
                           │  - pacientes      │
                           │  - recordatorios  │
                           │  - pagos (info)   │
                           │  - inventario     │
                           │  - config clínica │
                           └───────────────────┘
                                    │
                                    ▼
                           Webhook a Avax Health
                           (evento: mensaje_procesado)
                                    │
                                    ▼
                           Respuesta vía Evolution API
                           (instancia dinámica por clínica)
```

---

## Flujos n8n a Crear

### Flujo 1: Agente Principal Zoe (Core)
> El cerebro. Recibe mensajes, los procesa y responde.

#### Entrada
```
Webhook ← Evolution API (mensaje entrante)
  Datos: instance, remoteJid, messageType, message, pushName, timestamp
```

#### Paso 1: Identificar Clínica
```
HTTP Request → GET /api/clinicas/by-instance/{instanceName}
  Respuesta: { clinicaId, nombre, config, planFeatures }
```
- Cada clínica tiene su instancia de Evolution API registrada en Avax Health
- Si no se encuentra clínica → ignorar mensaje

#### Paso 2: Verificar Suscripción
```
HTTP Request → GET /api/admin/subscriptions/by-clinica/{clinicaId}
  Si estado ≠ 'activa' y estado ≠ 'trial':
    → Enviar mensaje: "El servicio de atención está temporalmente suspendido"
    → Fin del flujo
```

#### Paso 3: Extracción + Tipado de Mensaje
```
Set Node:
  - sender: remoteJid.split('@')[0]
  - clinicaId: del paso 1
  - messageType: conversation | audioMessage | imageMessage
  - textMessage: message.conversation || message.extendedTextMessage?.text
  - audioBase64: message.base64 (si es audio)
  - pushName: nombre de WhatsApp del usuario
  - timestamp: messageTimestamp
```

#### Paso 4: Procesamiento de Audio (si aplica)
```
Si messageType == audioMessage:
  Convert base64 → binario (OGG)
  → OpenAI Whisper (transcribir)
  → Texto resultante
```

#### Paso 5: Buffer Redis Multi-Tenant
```
Key: "zoe:{clinicaId}:{senderPhone}"
Push mensaje al buffer
Wait 5 segundos
Verificar si el último mensaje del buffer es el actual
  → Si NO es el último: ignorar (llegó otro mensaje después)
  → Si ES el último: continuar con todos los mensajes acumulados
Delete buffer
```

#### Paso 6: Agente IA
```
Agent Node (GPT-4.1-mini o GPT-4.1)
  System Prompt: DINÁMICO por clínica (ver sección de prompts)
  Input: mensajes acumulados del buffer
  Memory: PostgreSQL Chat Memory (key: clinicaId:senderPhone)

  Tools disponibles:
    1. think (razonamiento)
    2. consultar_turnos_disponibles (vía API Avax Health)
    3. buscar_paciente (vía API Avax Health)
    4. registrar_paciente (vía API Avax Health)
    5. verificar_turno_existente (vía API Avax Health)
    6. agendar_turno (vía API Avax Health → que internamente crea en Calendar)
    7. cancelar_turno (vía API Avax Health)
    8. confirmar_turno (vía API Avax Health)
    9. consultar_servicios (vía API Avax Health - tratamientos disponibles)
    10. base_conocimiento (Google Docs dinámico por clínica)
```

#### Paso 7: Respuesta
```
Calcular delay: output.length * 40ms
HTTP Request → POST /message/sendText/{instanceName}
  Headers: apikey del Evolution de la clínica
  Body: { number: senderPhone, text: agentOutput, delay }
```

#### Paso 8: Webhook a Avax Health
```
HTTP Request → POST /api/webhooks/agent-event
  Body: {
    clinicaId,
    event: "message_processed",
    sender: senderPhone,
    intent: detectada por el agente,
    action: acción tomada,
    timestamp
  }
```

---

### Flujo 2: Recordatorios de Turnos (Cron)
> Se ejecuta cada hora. Envía recordatorios de turnos próximos.

```
Cron: Cada hora (8:00-20:00 Argentina)
  │
  ▼
GET /api/turnos/proximos?horas=24&recordatorio_enviado=false
  │
  ▼
Para cada turno:
  │
  ├─ Obtener config de clínica (instancia Evolution, apikey)
  │
  ├─ Formatear mensaje:
  │   "Hola {nombre}! 👋 Te recordamos tu turno mañana
  │    {fecha} a las {hora} en {clinica_nombre}.
  │    Motivo: {motivo}
  │
  │    ¿Confirmas tu asistencia?
  │    ✅ Confirmar
  │    ❌ Cancelar"
  │
  ├─ Enviar vía Evolution API (instancia de la clínica)
  │
  └─ PATCH /api/turnos/{id} → { recordatorio_enviado: true }
```

---

### Flujo 3: Confirmación/Cancelación Post-Recordatorio
> Escucha respuestas rápidas a recordatorios.

```
Webhook ← Evolution API
  │
  ▼
Detectar si es respuesta a recordatorio:
  - "confirmo", "si", "confirmar", "✅" → confirmar turno
  - "cancelo", "no", "cancelar", "❌" → cancelar turno
  │
  ▼
Si es confirmación:
  PATCH /api/turnos/{id} → { estado: "confirmado" }
  Responder: "✅ Turno confirmado para {fecha} a las {hora}"

Si es cancelación:
  PATCH /api/turnos/{id} → { estado: "cancelado" }
  Responder: "❌ Turno cancelado. ¿Querés reagendar?"
```

---

### Flujo 4: Notificaciones al Profesional (Cron)
> Resumen diario para el médico/profesional.

```
Cron: Todos los días a las 7:30 AM Argentina
  │
  ▼
Para cada clínica activa:
  │
  ├─ GET /api/turnos?fecha=hoy&clinicaId={id}
  │
  ├─ GET /api/dashboard/kpis?clinicaId={id}  (resumen rápido)
  │
  ├─ Formatear mensaje:
  │   "Buenos días Dr. {nombre}! 🏥
  │
  │    📋 Resumen del día:
  │    • {n} turnos programados
  │    • Próximo: {paciente} a las {hora} ({motivo})
  │
  │    📊 Estado de la clínica:
  │    • Pacientes activos: {n}
  │    • Turnos esta semana: {n}
  │    • Pagos pendientes: {n}
  │
  │    ¡Que tengas un excelente día! 💪"
  │
  └─ Enviar al número del profesional vía Evolution API
```

---

### Flujo 5: Avisos de Pago y Suscripción
> Notifica a los dueños de clínica sobre pagos y vencimientos.

```
Cron: Diario a las 9:00 AM
  │
  ▼
GET /api/admin/subscriptions?estado=trial,activa
  │
  ▼
Para cada suscripción:
  │
  ├─ Si trial_ends_at está a 3 días:
  │   "⚠️ Tu período de prueba vence en 3 días.
  │    Actualizá tu plan para no perder acceso."
  │
  ├─ Si trial_ends_at está a 1 día:
  │   "🔴 Tu trial vence MAÑANA.
  │    Elegí un plan ahora: {link}"
  │
  ├─ Si fecha_fin está a 7 días:
  │   "📋 Tu suscripción se renueva en 7 días.
  │    Plan: {plan}, Monto: ${precio}/mes"
  │
  ├─ Si fecha_fin está a 1 día y auto_renew = false:
  │   "⚠️ Tu suscripción vence MAÑANA y no tenés
  │    auto-renovación activa. Renovar: {link}"
  │
  └─ Enviar al email/WhatsApp del propietario
```

---

### Flujo 6: Post-Turno (Follow-up)
> Después de cada turno, envía seguimiento.

```
Webhook ← Avax Health (evento: turno_completado)
  │
  ▼
Wait 2 horas después del turno
  │
  ▼
Enviar mensaje al paciente:
  "Hola {nombre}! 😊
   Esperamos que tu visita haya sido buena.

   ¿Cómo te sentís después del tratamiento?
   ¿Necesitás agendar un turno de seguimiento?

   Recordá: ante cualquier molestia, no dudes en escribirnos."
```

---

## System Prompt Dinámico por Clínica

El system prompt de Zoe se genera dinámicamente usando datos de la clínica:

```javascript
// Datos que se inyectan desde la API de Avax Health
const clinicaConfig = {
  nombre: "Consultorio Dr. López",
  nombre_profesional: "Dr. Martín López",
  especialidad: "Odontología General",
  direccion: "Av. Corrientes 1234, CABA",
  telefono: "+5491112345678",
  horarios: "Lun-Vie 9:00-20:00, Sáb 9:00-13:00",
  duracion_turno: 30, // minutos
  servicios: ["Limpieza", "Extracción", "Ortodoncia", "Blanqueamiento"],
  zona_horaria: "America/Argentina/Buenos_Aires",
  personalidad: "profesional y cálida", // configurable por clínica
  nombre_asistente: "Zoe", // personalizable
  instrucciones_extra: "", // texto libre del dueño de la clínica
};
```

```
🤖 ${config.nombre_asistente} — Asistente Virtual de ${config.nombre}
📍 Zona: ${config.zona_horaria}
📅 Fecha actual: ${now}

Sos ${config.nombre_asistente}, la asistente virtual profesional de
${config.nombre} (${config.especialidad}).
El profesional a cargo es ${config.nombre_profesional}.
Dirección: ${config.direccion}
Horarios: ${config.horarios}
Duración estándar de turno: ${config.duracion_turno} minutos

Servicios disponibles:
${config.servicios.map(s => `- ${s}`).join('\n')}

${config.instrucciones_extra}

[... resto del prompt con el flujo de interacción ...]
```

---

## Tools del Agente — Migración a API

### Antes (queries directas) → Después (vía API Avax Health)

| Tool Anterior | Tool Nueva | Endpoint API |
|---|---|---|
| `existencia_usuario` (SQL directo) | `buscar_paciente` | `GET /api/pacientes/by-phone/{phone}?clinicaId={id}` |
| `nuevo_paciente` (INSERT directo) | `registrar_paciente` | `POST /api/pacientes` con body JSON |
| `tiene_turno` (SQL directo) | `verificar_turno` | `GET /api/turnos/by-paciente/{pacienteId}?estado=pendiente,confirmado` |
| `consultar_turnos_disponibles` (workflow) | `turnos_disponibles` | `GET /api/turnos/disponibles?clinicaId={id}&dias=3` |
| `agendar_turno` (Google Calendar) | `crear_turno` | `POST /api/turnos` (Avax Health crea internamente en Calendar) |
| `mod_estado_turno` (workflow) | `actualizar_turno` | `PATCH /api/turnos/{id}` con `{ estado }` |
| `guardar_turno_DB` (SQL directo) | *eliminado* | Ya incluido en `crear_turno` |
| `base_conocimiento` (Google Docs) | `info_clinica` | `GET /api/clinicas/{id}/info` (config + servicios + precios) |

### Tools nuevas a agregar

| Tool | Endpoint | Descripción |
|---|---|---|
| `consultar_tratamientos` | `GET /api/tratamientos?clinicaId={id}` | Lista tratamientos con precios |
| `consultar_historial` | `GET /api/pacientes/{id}/historial` | Historial del paciente (con validación DNI) |
| `consultar_pagos_pendientes` | `GET /api/pagos?pacienteId={id}&estado=pendiente` | Pagos pendientes del paciente |
| `enviar_webhook_evento` | `POST /api/webhooks/emit` | Notifica eventos al panel de Avax Health |

---

## Endpoints API a Crear en Backend (NestJS)

Para que Zoe funcione vía API en vez de queries directas:

### 1. Búsqueda de paciente por teléfono
```
GET /api/pacientes/by-phone/:phone
Query: clinicaId (required)
Response: { existe: boolean, paciente?: { id, nombre, apellido, dni, edad, email } }
```

### 2. Turnos disponibles
```
GET /api/turnos/disponibles
Query: clinicaId, dias (default 3), profesionalId (optional)
Response: [{ fecha, horarios: ["09:00", "09:30", ...] }]
```
Lógica: Consulta la config de horarios de la clínica, resta los turnos ya agendados.

### 3. Config de clínica por instancia Evolution
```
GET /api/clinicas/by-instance/:instanceName
Response: { clinicaId, nombre, config, evolutionApiKey, planFeatures }
```

### 4. Info pública de clínica (para el agente)
```
GET /api/clinicas/:id/info
Response: { nombre, profesional, direccion, horarios, servicios, duracion_turno }
```

### 5. Emisión de eventos webhook
```
POST /api/webhooks/emit
Body: { clinicaId, event, data }
```
Dispara webhook a URLs registradas por la clínica + actualiza el panel en tiempo real.

---

## Configuración por Clínica (Tab "WhatsApp / IA" en Configuración)

En el panel de la clínica, agregar una pestaña de configuración del agente:

### Campos configurables
- **Nombre del asistente**: "Zoe" por defecto, personalizable
- **Personalidad**: Selector (profesional, amigable, formal, casual)
- **Instancia Evolution API**: Nombre de la instancia conectada
- **API Key Evolution**: Clave de la instancia
- **Mensaje de bienvenida**: Texto personalizado
- **Mensaje fuera de horario**: "Estamos fuera de horario, te responderemos mañana"
- **Instrucciones extra**: Texto libre (ej: "No agendar los sábados después de las 12")
- **Recordatorios activos**: Toggle on/off
- **Horas antes del recordatorio**: 24 (default), 48, 12, 6
- **Follow-up post-turno**: Toggle on/off
- **Resumen diario al profesional**: Toggle on/off + hora de envío

---

## Variables de Entorno n8n

```env
# Avax Health API
AGENDLY_API_URL=https://api.agendly.com
AGENDLY_API_KEY=sa_key_xxxxx  # Service account key para n8n

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# OpenAI
OPENAI_API_KEY=sk-xxxxx

# Evolution API Base
EVOLUTION_API_URL=http://31.97.64.7:7020
```

---

## Fases de Implementación

### Fase 1: Infraestructura API (Backend NestJS)
- [ ] Endpoint `GET /api/pacientes/by-phone/:phone`
- [ ] Endpoint `GET /api/turnos/disponibles`
- [ ] Endpoint `GET /api/clinicas/by-instance/:instanceName`
- [ ] Endpoint `GET /api/clinicas/:id/info`
- [ ] Endpoint `POST /api/webhooks/emit`
- [ ] Service account auth para n8n (API key en header)

### Fase 2: Flujo Core de Zoe (n8n)
- [ ] Webhook receptor con identificación de clínica
- [ ] Verificación de suscripción activa
- [ ] Extracción de datos + procesamiento audio
- [ ] Buffer Redis multi-tenant (key: `zoe:{clinicaId}:{phone}`)
- [ ] Agente IA con system prompt dinámico
- [ ] Tools conectadas a API de Avax Health (no queries directas)
- [ ] Respuesta vía Evolution API (instancia dinámica)
- [ ] Webhook de evento procesado a Avax Health

### Fase 3: Recordatorios y Notificaciones
- [ ] Cron de recordatorios de turnos (24h, 2h antes)
- [ ] Flujo de confirmación/cancelación por respuesta
- [ ] Resumen diario al profesional
- [ ] Follow-up post-turno

### Fase 4: Configuración en Panel
- [ ] Tab "WhatsApp / IA" en configuración de clínica
- [ ] Campos editables (nombre asistente, personalidad, mensajes, etc.)
- [ ] Test de conexión con Evolution API
- [ ] Preview del system prompt generado

### Fase 5: Avisos de Pago y Lifecycle
- [ ] Notificaciones de trial venciendo
- [ ] Notificaciones de suscripción por renovar
- [ ] Avisos de pago fallido al dueño de clínica
- [ ] Mensaje de servicio suspendido si suscripción inactiva

### Fase 6: Mejoras Avanzadas
- [ ] Agente informa sobre tratamientos y precios
- [ ] Agente consulta historial del paciente (con validación)
- [ ] Agente informa pagos pendientes al paciente
- [ ] Métricas de uso del agente por clínica (mensajes procesados, turnos agendados vía IA)
- [ ] Dashboard de conversaciones en el panel (lectura, no intervención)

---

## Acceso Necesario

Para implementar los flujos en n8n necesito:

1. **URL de n8n**: La dirección donde está corriendo tu instancia
2. **Credenciales de n8n**: Para importar/crear flujos (o acceso a la UI)
3. **API Key de Evolution API**: Para configurar las instancias
4. **Conexión a PostgreSQL de Avax Health**: Para la memoria del chat y consultas

### Opciones de acceso:
- **Opción A**: Me pasás la URL de n8n + usuario/contraseña y trabajo directo en la UI
- **Opción B**: Yo genero los JSONs de los flujos completos y vos los importás en n8n
- **Opción C**: Si n8n tiene API habilitada, puedo crear flujos programáticamente

La **Opción B** es la más segura — yo genero los JSONs y vos los importás.

---

*Última actualización: 2026-03-27*
