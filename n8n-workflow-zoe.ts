import { workflow, node, trigger, sticky, placeholder, newCredential, ifElse, switchCase, merge, splitInBatches, nextBatch, languageModel, memory, tool, outputParser, embedding, embeddings, vectorStore, retriever, documentLoader, textSplitter, reranker, fromAi, expr } from '@n8n/workflow-sdk';

// ════════════════════════════════════════════════════════════════
//  ASISTENTE AVAX HEALTH IA VIRTUAL — AGENTE ZOE (Multi-Tenant)
//  Identifica clinica por instancia Evolution API, procesa
//  mensajes de texto/audio, aplica debounce, y usa la API
//  de Avax Health para gestionar turnos y pacientes.
// ════════════════════════════════════════════════════════════════

// ──────────────────────────────────────────────────
//  1. TRIGGER — Webhook de Evolution API
// ──────────────────────────────────────────────────
const webhookEvolution = trigger({
  type: 'n8n-nodes-base.webhook',
  version: 2.1,
  config: {
    name: 'Webhook Evolution API',
    parameters: {
      httpMethod: 'POST',
      path: '18af0a77-f363-4fbc-a680-4b03b7371a50',
      responseMode: 'onReceived',
      options: {}
    },
    position: [0, 0]
  },
  output: [{ body: { instance: 'clinica-demo', data: { key: { remoteJid: '5491112345678@s.whatsapp.net', id: 'msg123' }, messageType: 'conversation', message: { conversation: 'Hola quiero un turno' }, messageTimestamp: 1712534400, pushName: 'Juan' } } }]
});

// ──────────────────────────────────────────────────
//  2. EXTRAER DATOS del mensaje WhatsApp
// ──────────────────────────────────────────────────
const extraerDatos = node({
  type: 'n8n-nodes-base.set',
  version: 3.4,
  config: {
    name: 'Extraer Datos WhatsApp',
    parameters: {
      mode: 'manual',
      assignments: {
        assignments: [
          { id: 'a1', name: 'sender', value: expr('{{ $json.body.data.key.remoteJid }}'), type: 'string' },
          { id: 'a2', name: 'sender_phone', value: expr('{{ $json.body.data.key.remoteJid.split("@")[0] }}'), type: 'string' },
          { id: 'a3', name: 'message_type', value: expr('{{ $json.body.data.messageType }}'), type: 'string' },
          { id: 'a4', name: 'text_message', value: expr('{{ $json.body.data.message.conversation ?? "" }}'), type: 'string' },
          { id: 'a5', name: 'voice_base64', value: expr('{{ $json.body.data.message.base64 ?? "" }}'), type: 'string' },
          { id: 'a6', name: 'sessionId', value: expr('{{ $json.body.data.key.id }}'), type: 'string' },
          { id: 'a7', name: 'dataTime', value: expr('{{ $json.body.data.messageTimestamp }}'), type: 'string' },
          { id: 'a8', name: 'instance_name', value: expr('{{ $json.body.instance }}'), type: 'string' },
          { id: 'a9', name: 'push_name', value: expr('{{ $json.body.data.pushName }}'), type: 'string' }
        ]
      },
      options: {}
    },
    position: [240, 0]
  },
  output: [{ sender: '5491112345678@s.whatsapp.net', sender_phone: '5491112345678', message_type: 'conversation', text_message: 'Hola quiero un turno', voice_base64: '', sessionId: 'msg123', dataTime: '1712534400', instance_name: 'clinica-demo', push_name: 'Juan' }]
});

// ──────────────────────────────────────────────────
//  3. IDENTIFICAR CLINICA por instancia Evolution
// ──────────────────────────────────────────────────
const buscarClinica = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Buscar Clinica por Instancia',
    parameters: {
      method: 'GET',
      url: expr('{{ $json.instance_name }}'),
      authentication: 'genericCredentialType',
      genericAuthType: 'httpHeaderAuth',
      options: {}
    },
    credentials: { httpHeaderAuth: newCredential('Avax Health API Key') },
    position: [480, 0]
  },
  output: [{ clinicaId: 'uuid-clinica', nombre: 'Clinica Demo', especialidad: 'odontologia', evolution_instance: 'clinica-demo', evolution_api_key: 'evo-key-123', subscription: { estado: 'activa', plan: 'Premium' } }]
});

// ──────────────────────────────────────────────────
//  4. CONDICION: Texto vs Audio
// ──────────────────────────────────────────────────
const esTexto = ifElse({
  version: 2.2,
  config: {
    name: 'Es Texto o Audio',
    parameters: {
      conditions: {
        options: { caseSensitive: true, leftValue: '', typeValidation: 'strict', version: 2 },
        conditions: [
          { id: 'c1', leftValue: expr('{{ $("Extraer Datos WhatsApp").item.json.message_type }}'), rightValue: 'conversation', operator: { type: 'string', operation: 'equals' } }
        ],
        combinator: 'and'
      },
      options: {}
    },
    position: [720, 0]
  }
});

// ──────────────────────────────────────────────────
//  5a. RAMA TEXTO — Set mensaje final
// ──────────────────────────────────────────────────
const mensajeFinalTexto = node({
  type: 'n8n-nodes-base.set',
  version: 3.4,
  config: {
    name: 'Mensaje Final Texto',
    parameters: {
      mode: 'manual',
      assignments: {
        assignments: [
          { id: 't1', name: 'final_message', value: expr('{{ $("Extraer Datos WhatsApp").item.json.text_message }}'), type: 'string' }
        ]
      },
      options: {}
    },
    position: [960, -120]
  },
  output: [{ final_message: 'Hola quiero un turno' }]
});

// ──────────────────────────────────────────────────
//  5b. RAMA AUDIO — Convertir Base64 + Transcribir
// ──────────────────────────────────────────────────
const convertirAudio = node({
  type: 'n8n-nodes-base.convertToFile',
  version: 1.1,
  config: {
    name: 'Convertir Audio Base64',
    parameters: {
      operation: 'toBinary',
      sourceProperty: 'voice_base64',
      options: { mimeType: 'audio/ogg' }
    },
    position: [960, 160]
  },
  output: [{ binary: { data: {} } }]
});

const transcribirAudio = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Transcribir Audio Whisper',
    parameters: {
      method: 'POST',
      url: 'https://api.openai.com/v1/audio/transcriptions',
      authentication: 'genericCredentialType',
      genericAuthType: 'httpHeaderAuth',
      sendBody: true,
      contentType: 'multipart-form-data',
      bodyParameters: {
        parameters: [
          { parameterType: 'formData', name: 'model', value: 'whisper-1' },
          { parameterType: 'formBinaryData', name: 'file', inputDataFieldName: 'data' }
        ]
      },
      options: {}
    },
    credentials: { httpHeaderAuth: newCredential('OpenAI API Key') },
    position: [1200, 160]
  },
  output: [{ text: 'Hola quiero un turno para manana' }]
});

const mensajeFinalAudio = node({
  type: 'n8n-nodes-base.set',
  version: 3.4,
  config: {
    name: 'Mensaje Final Audio',
    parameters: {
      mode: 'manual',
      assignments: {
        assignments: [
          { id: 'v1', name: 'final_message', value: expr('{{ $json.text }}'), type: 'string' }
        ]
      },
      options: {}
    },
    position: [1440, 160]
  },
  output: [{ final_message: 'Hola quiero un turno para manana' }]
});

// ──────────────────────────────────────────────────
//  6. BUFFER DE MENSAJES (Redis) — Push
// ──────────────────────────────────────────────────
const bufferMensaje = node({
  type: 'n8n-nodes-base.redis',
  version: 1,
  config: {
    name: 'Buffer Mensaje Redis',
    parameters: {
      operation: 'push',
      list: expr('{{ $("Extraer Datos WhatsApp").item.json.sender }}'),
      messageData: expr('{{ JSON.stringify({ message: $json.final_message, sessionId: $("Extraer Datos WhatsApp").item.json.sessionId, dataTime: $("Extraer Datos WhatsApp").item.json.dataTime }) }}'),
      tail: true
    },
    credentials: { redis: newCredential('Redis') },
    position: [1680, 0]
  },
  output: [{}]
});

// ──────────────────────────────────────────────────
//  7. ESPERAR 5 segundos (debounce)
// ──────────────────────────────────────────────────
const esperarDebounce = node({
  type: 'n8n-nodes-base.wait',
  version: 1.1,
  config: {
    name: 'Esperar 5s Debounce',
    parameters: {
      amount: 5,
      unit: 'seconds'
    },
    position: [1920, 0]
  },
  output: [{}]
});

// ──────────────────────────────────────────────────
//  8. LEER BUFFER Redis
// ──────────────────────────────────────────────────
const leerBuffer = node({
  type: 'n8n-nodes-base.redis',
  version: 1,
  config: {
    name: 'Leer Buffer Redis',
    parameters: {
      operation: 'get',
      propertyName: 'buffer_messages',
      key: expr('{{ $("Extraer Datos WhatsApp").item.json.sender }}'),
      options: {}
    },
    credentials: { redis: newCredential('Redis') },
    position: [2160, 0]
  },
  output: [{ buffer_messages: ['{"message":"Hola","sessionId":"msg123","dataTime":"1712534400"}'] }]
});

// ──────────────────────────────────────────────────
//  9. VERIFICAR si soy el ultimo mensaje (debounce)
// ──────────────────────────────────────────────────
const esUltimoMensaje = ifElse({
  version: 2.2,
  config: {
    name: 'Soy Ultimo Mensaje',
    parameters: {
      conditions: {
        options: { caseSensitive: true, leftValue: '', typeValidation: 'strict', version: 2 },
        conditions: [
          { id: 'u1', leftValue: expr('{{ JSON.parse($json.buffer_messages.at(-1)).sessionId }}'), rightValue: expr('{{ $("Extraer Datos WhatsApp").item.json.sessionId }}'), operator: { type: 'string', operation: 'equals' } }
        ],
        combinator: 'and'
      },
      options: {}
    },
    position: [2400, 0]
  }
});

const nodoIgnorar = node({
  type: 'n8n-nodes-base.noOp',
  version: 1,
  config: { name: 'Ignorar Mensaje Viejo', parameters: {}, position: [2640, 200] },
  output: [{}]
});

// ──────────────────────────────────────────────────
// 10. ELIMINAR BUFFER + COMBINAR MENSAJES
// ──────────────────────────────────────────────────
const eliminarBuffer = node({
  type: 'n8n-nodes-base.redis',
  version: 1,
  config: {
    name: 'Eliminar Buffer Redis',
    parameters: {
      operation: 'delete',
      key: expr('{{ $("Extraer Datos WhatsApp").item.json.sender }}')
    },
    credentials: { redis: newCredential('Redis') },
    position: [2640, -120]
  },
  output: [{}]
});

const combinarMensajes = node({
  type: 'n8n-nodes-base.set',
  version: 3.4,
  config: {
    name: 'Combinar Mensajes Buffer',
    parameters: {
      mode: 'manual',
      assignments: {
        assignments: [
          { id: 'cm1', name: 'final_message', value: expr('{{ $("Leer Buffer Redis").item.json.buffer_messages.map(m => JSON.parse(m).message).join("\\n") }}'), type: 'string' },
          { id: 'cm2', name: 'sender_phone', value: expr('{{ $("Extraer Datos WhatsApp").item.json.sender_phone }}'), type: 'string' },
          { id: 'cm3', name: 'push_name', value: expr('{{ $("Extraer Datos WhatsApp").item.json.push_name }}'), type: 'string' },
          { id: 'cm4', name: 'clinicaId', value: expr('{{ $("Buscar Clinica por Instancia").item.json.clinicaId }}'), type: 'string' }
        ]
      },
      options: {}
    },
    position: [2880, -120]
  },
  output: [{ final_message: 'Hola quiero un turno', sender_phone: '5491112345678', push_name: 'Juan', clinicaId: 'uuid-clinica' }]
});

// ──────────────────────────────────────────────────
// 11. OBTENER INFO CLINICA (contexto para el agente)
// ──────────────────────────────────────────────────
const obtenerInfoClinica = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Obtener Info Clinica',
    parameters: {
      method: 'GET',
      url: expr('{{ $("Buscar Clinica por Instancia").item.json.clinicaId }}'),
      authentication: 'genericCredentialType',
      genericAuthType: 'httpHeaderAuth',
      options: {}
    },
    credentials: { httpHeaderAuth: newCredential('Avax Health API Key') },
    position: [3120, -120]
  },
  output: [{ clinicaId: 'uuid', nombre: 'Clinica Demo', direccion: 'Calle 123', especialidad: 'odontologia', cel: '1234567', email: 'info@clinica.com', horarios: {}, duracion_turno_default: 30, agent_nombre: 'Zoe', agent_instrucciones: '', profesionales: [{ id: 'p1', nombre: 'Dr. Lopez', role: 'professional' }], tratamientos: [{ id: 't1', nombre: 'Limpieza', precio: 5000, duracion_min: 30 }] }]
});

// ──────────────────────────────────────────────────
// 12. AGENTE ZOE IA — Modelo + Memoria + Tools
// ──────────────────────────────────────────────────

const modeloOpenAI = languageModel({
  type: '@n8n/n8n-nodes-langchain.lmChatOpenAi',
  version: 1.3,
  config: {
    name: 'GPT-4.1 Mini',
    parameters: {
      model: { __rl: true, value: 'gpt-4.1-mini', mode: 'list', cachedResultName: 'gpt-4.1-mini' },
      options: {}
    },
    credentials: { openAiApi: newCredential('OpenAI') },
    position: [3360, 180]
  }
});

const memoriaPostgres = memory({
  type: '@n8n/n8n-nodes-langchain.memoryPostgresChat',
  version: 1.3,
  config: {
    name: 'Memoria Conversacion',
    parameters: {
      sessionIdType: 'customKey',
      sessionKey: expr('{{ $("Extraer Datos WhatsApp").item.json.sender_phone }}'),
      contextWindowLength: 30
    },
    credentials: { postgres: newCredential('PostgreSQL') },
    position: [3520, 180]
  }
});

// --- TOOLS del Agente ---

const toolPensar = tool({
  type: '@n8n/n8n-nodes-langchain.toolThink',
  version: 1,
  config: {
    name: 'Pensar',
    parameters: {},
    position: [3680, 180]
  }
});

const toolBuscarPacienteTel = tool({
  type: 'n8n-nodes-base.httpRequestTool',
  version: 4.4,
  config: {
    name: 'Buscar Paciente por Telefono',
    parameters: {
      method: 'GET',
      url: expr('{{ $("Buscar Clinica por Instancia").item.json.clinicaId }}'),
      authentication: 'genericCredentialType',
      genericAuthType: 'httpHeaderAuth',
      sendQuery: true,
      specifyQuery: 'keypair',
      queryParameters: {
        parameters: [
          { name: 'clinicaId', value: expr('{{ $("Buscar Clinica por Instancia").item.json.clinicaId }}') }
        ]
      },
      options: {}
    },
    credentials: { httpHeaderAuth: newCredential('Avax Health API Key') },
    position: [3360, 400]
  }
});

const toolBuscarPacienteDni = tool({
  type: 'n8n-nodes-base.httpRequestTool',
  version: 4.4,
  config: {
    name: 'Buscar Paciente por DNI',
    parameters: {
      method: 'GET',
      url: expr('{{ $("Buscar Clinica por Instancia").item.json.clinicaId }}'),
      authentication: 'genericCredentialType',
      genericAuthType: 'httpHeaderAuth',
      sendQuery: true,
      specifyQuery: 'keypair',
      queryParameters: {
        parameters: [
          { name: 'clinicaId', value: expr('{{ $("Buscar Clinica por Instancia").item.json.clinicaId }}') }
        ]
      },
      options: {}
    },
    credentials: { httpHeaderAuth: newCredential('Avax Health API Key') },
    position: [3520, 400]
  }
});

const toolRegistrarPaciente = tool({
  type: 'n8n-nodes-base.httpRequestTool',
  version: 4.4,
  config: {
    name: 'Registrar Paciente',
    parameters: {
      method: 'POST',
      url: expr('{{ $("Buscar Clinica por Instancia").item.json.clinicaId }}'),
      authentication: 'genericCredentialType',
      genericAuthType: 'httpHeaderAuth',
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: expr('{{ JSON.stringify({ clinicaId: $("Buscar Clinica por Instancia").item.json.clinicaId, nombre: $fromAI("nombre", "Nombre del paciente", "string"), apellido: $fromAI("apellido", "Apellido del paciente", "string"), dni: $fromAI("dni", "DNI del paciente", "string"), cel: $("Extraer Datos WhatsApp").item.json.sender_phone, email: $fromAI("email", "Email del paciente (opcional, puede ser vacio)", "string") }) }}'),
      options: {}
    },
    credentials: { httpHeaderAuth: newCredential('Avax Health API Key') },
    position: [3680, 400]
  }
});

const toolTurnosDisponibles = tool({
  type: 'n8n-nodes-base.httpRequestTool',
  version: 4.4,
  config: {
    name: 'Consultar Turnos Disponibles',
    parameters: {
      method: 'GET',
      url: expr('{{ $("Buscar Clinica por Instancia").item.json.clinicaId }}'),
      authentication: 'genericCredentialType',
      genericAuthType: 'httpHeaderAuth',
      sendQuery: true,
      specifyQuery: 'keypair',
      queryParameters: {
        parameters: [
          { name: 'clinicaId', value: expr('{{ $("Buscar Clinica por Instancia").item.json.clinicaId }}') },
          { name: 'dias', value: '3' }
        ]
      },
      options: {}
    },
    credentials: { httpHeaderAuth: newCredential('Avax Health API Key') },
    position: [3360, 600]
  }
});

const toolVerificarTurno = tool({
  type: 'n8n-nodes-base.httpRequestTool',
  version: 4.4,
  config: {
    name: 'Verificar Turno Existente',
    parameters: {
      method: 'GET',
      url: expr('{{ $("Buscar Clinica por Instancia").item.json.clinicaId }}'),
      authentication: 'genericCredentialType',
      genericAuthType: 'httpHeaderAuth',
      sendQuery: true,
      specifyQuery: 'keypair',
      queryParameters: {
        parameters: [
          { name: 'clinicaId', value: expr('{{ $("Buscar Clinica por Instancia").item.json.clinicaId }}') }
        ]
      },
      options: {}
    },
    credentials: { httpHeaderAuth: newCredential('Avax Health API Key') },
    position: [3520, 600]
  }
});

const toolCrearTurno = tool({
  type: 'n8n-nodes-base.httpRequestTool',
  version: 4.4,
  config: {
    name: 'Crear Turno',
    parameters: {
      method: 'POST',
      url: expr('{{ $("Buscar Clinica por Instancia").item.json.clinicaId }}'),
      authentication: 'genericCredentialType',
      genericAuthType: 'httpHeaderAuth',
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: expr('{{ JSON.stringify({ clinicaId: $("Buscar Clinica por Instancia").item.json.clinicaId, paciente_id: $fromAI("paciente_id", "UUID del paciente registrado", "string"), user_id: $fromAI("user_id", "UUID del profesional seleccionado", "string"), start_time: $fromAI("start_time", "Fecha y hora de inicio en formato ISO 8601", "string"), end_time: $fromAI("end_time", "Fecha y hora de fin en formato ISO 8601", "string"), tipo_tratamiento: $fromAI("tipo_tratamiento", "Nombre del tratamiento", "string"), notas: $fromAI("notas", "Notas adicionales del turno", "string") }) }}'),
      options: {}
    },
    credentials: { httpHeaderAuth: newCredential('Avax Health API Key') },
    position: [3680, 600]
  }
});

const toolModificarEstado = tool({
  type: 'n8n-nodes-base.httpRequestTool',
  version: 4.4,
  config: {
    name: 'Modificar Estado Turno',
    parameters: {
      method: 'PATCH',
      url: expr('{{ $("Buscar Clinica por Instancia").item.json.clinicaId }}'),
      authentication: 'genericCredentialType',
      genericAuthType: 'httpHeaderAuth',
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: expr('{{ JSON.stringify({ clinicaId: $("Buscar Clinica por Instancia").item.json.clinicaId, estado: $fromAI("estado", "Nuevo estado del turno: confirmado o cancelado", "string") }) }}'),
      options: {}
    },
    credentials: { httpHeaderAuth: newCredential('Avax Health API Key') },
    position: [3840, 600]
  }
});

// --- AGENTE PRINCIPAL ---
const agenteZoe = node({
  type: '@n8n/n8n-nodes-langchain.agent',
  version: 3.1,
  config: {
    name: 'Agente Zoe IA',
    parameters: {
      promptType: 'define',
      text: expr('{{ $json.final_message }}'),
      options: {
        systemMessage: expr(
          'Sos {{ $("Obtener Info Clinica").item.json.agent_nombre ?? "Zoe" }}, asistente virtual profesional de {{ $("Obtener Info Clinica").item.json.nombre }}.' +
          '\\n\\nZona horaria: America/Argentina/Buenos_Aires (UTC-3)' +
          '\\nFecha y hora actuales: {{ $now }}' +
          '\\nEspecialidad: {{ $("Obtener Info Clinica").item.json.especialidad }}' +
          '\\nDireccion: {{ $("Obtener Info Clinica").item.json.direccion }}' +
          '\\nTelefono clinica: {{ $("Obtener Info Clinica").item.json.cel }}' +
          '\\nDuracion turno default: {{ $("Obtener Info Clinica").item.json.duracion_turno_default }} minutos' +
          '\\n\\nProfesionales disponibles:' +
          '\\n{{ $("Obtener Info Clinica").item.json.profesionales.map(p => "- " + p.nombre + " (" + p.role + ")").join("\\n") }}' +
          '\\n\\nTratamientos disponibles:' +
          '\\n{{ $("Obtener Info Clinica").item.json.tratamientos.map(t => "- " + t.nombre + (t.precio ? " ($" + t.precio + ")" : "") + (t.duracion_min ? " " + t.duracion_min + "min" : "")).join("\\n") }}' +
          '\\n\\nHorarios de la clinica:' +
          '\\n{{ JSON.stringify($("Obtener Info Clinica").item.json.horarios) }}' +
          '\\n\\n--- INSTRUCCIONES ---' +
          '\\n1. BIENVENIDA: Saluda segun la hora (Buenos dias/tardes/noches). Presentate con tu nombre y el de la clinica.' +
          '\\n2. DETECTAR INTENCION: Usa Pensar para interpretar si el paciente quiere: agendar turno, cancelar, consultar info, u otra cosa.' +
          '\\n3. IDENTIFICAR PACIENTE: Busca primero por telefono con el numero {{ $("Extraer Datos WhatsApp").item.json.sender_phone }}. Si no existe, pedi el DNI. Si no esta registrado, ofrece registrarlo.' +
          '\\n4. TURNOS: Usa Consultar Turnos Disponibles para mostrar horarios libres.' +
          '\\n5. VERIFICAR: Antes de agendar, verifica que no tenga un turno activo.' +
          '\\n6. CREAR: Cuando tengas todos los datos, crea el turno.' +
          '\\n7. CANCELAR/CONFIRMAR: Usa Modificar Estado Turno para cambiar estados.' +
          '\\n\\n--- REGLAS ---' +
          '\\n- Siempre usa Pensar antes de decisiones complejas' +
          '\\n- No agendes sin registro previo del paciente' +
          '\\n- No des info personal sin validar identidad' +
          '\\n- No respondas fuera del contexto de la clinica' +
          '\\n- Estilo: calido, profesional, WhatsApp. Emojis con criterio' +
          '\\n- Si algo falla, responde amablemente y ofrece reintentar' +
          '\\n\\nInstrucciones adicionales de la clinica:' +
          '\\n{{ $("Obtener Info Clinica").item.json.agent_instrucciones ?? "" }}'
        ),
        maxIterations: 15
      }
    },
    subnodes: {
      model: modeloOpenAI,
      memory: memoriaPostgres,
      tools: [toolPensar, toolBuscarPacienteTel, toolBuscarPacienteDni, toolRegistrarPaciente, toolTurnosDisponibles, toolVerificarTurno, toolCrearTurno, toolModificarEstado]
    },
    position: [3360, -120]
  },
  output: [{ output: 'Hola! Soy Zoe, asistente virtual de Clinica Demo. En que puedo ayudarte?' }]
});

// ──────────────────────────────────────────────────
// 13. CALCULAR DELAY + ENVIAR RESPUESTA WhatsApp
// ──────────────────────────────────────────────────
const calcularDelay = node({
  type: 'n8n-nodes-base.set',
  version: 3.4,
  config: {
    name: 'Calcular Delay Escritura',
    parameters: {
      mode: 'manual',
      assignments: {
        assignments: [
          { id: 'd1', name: 'delay', value: expr('{{ Math.min(Math.max($json.output.length * 40, 1000), 8000) }}'), type: 'number' },
          { id: 'd2', name: 'response_text', value: expr('{{ $json.output }}'), type: 'string' }
        ]
      },
      options: {}
    },
    position: [3600, -120]
  },
  output: [{ delay: 2000, response_text: 'Hola! Soy Zoe, asistente virtual de Clinica Demo.' }]
});

const enviarRespuesta = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Enviar Respuesta WhatsApp',
    parameters: {
      method: 'POST',
      url: expr('{{ $("Buscar Clinica por Instancia").item.json.evolution_instance }}'),
      sendHeaders: true,
      specifyHeaders: 'keypair',
      headerParameters: {
        parameters: [
          { name: 'Content-Type', value: 'application/json' },
          { name: 'apikey', value: expr('{{ $("Buscar Clinica por Instancia").item.json.evolution_api_key }}') }
        ]
      },
      sendBody: true,
      contentType: 'json',
      specifyBody: 'keypair',
      bodyParameters: {
        parameters: [
          { name: 'number', value: expr('{{ $("Extraer Datos WhatsApp").item.json.sender_phone }}') },
          { name: 'text', value: expr('{{ $json.response_text }}') },
          { name: 'delay', value: expr('{{ $json.delay }}') }
        ]
      },
      options: {}
    },
    position: [3840, -120]
  },
  output: [{ status: 'sent' }]
});

// ──────────────────────────────────────────────────
// STICKY NOTES
// ──────────────────────────────────────────────────
const stickyConfig = sticky('## CONFIGURAR URLs\nEdita el nodo "Buscar Clinica por Instancia" y "Obtener Info Clinica" con la URL base de tu API.\nEdita "Enviar Respuesta WhatsApp" con la URL de Evolution API.\nConfigura las credenciales: Avax Health API Key, OpenAI, Redis, PostgreSQL, Evolution API Key.', [webhookEvolution], { color: 6 });
const stickyEntrada = sticky('## Entrada WhatsApp\nRecibe mensajes de Evolution API y extrae datos.', [extraerDatos], { color: 4 });
const stickyClinica = sticky('## Multi-Tenant\nIdentifica la clinica por el nombre de instancia de Evolution API.', [buscarClinica], { color: 2 });
const stickyBuffer = sticky('## Debounce\nAgrupa mensajes rapidos (5s) del mismo usuario.\nSi llegan mas mensajes durante la espera, solo el ultimo los procesa.', [bufferMensaje, esperarDebounce, leerBuffer], { color: 3 });
const stickyAgente = sticky('## Cerebro Agente Zoe IA\nAgente multi-tenant con GPT-4.1-mini.\nUsa la API de Avax Health para gestionar turnos y pacientes.\nMemoria de conversacion persistente en PostgreSQL.', [agenteZoe], { color: 5 });
const stickyRespuesta = sticky('## Respuesta WhatsApp\nCalcula delay de escritura y envia respuesta via Evolution API.', [enviarRespuesta], { color: 4 });

// ──────────────────────────────────────────────────
// WORKFLOW COMPOSITION
// ──────────────────────────────────────────────────
export default workflow('Qcli5Ruwjk3pCTNA', 'Asistente Avax Health IA Virtual')
  .add(webhookEvolution)
  .to(extraerDatos)
  .to(buscarClinica)
  .to(esTexto
    .onTrue(mensajeFinalTexto)
    .onFalse(convertirAudio.to(transcribirAudio).to(mensajeFinalAudio))
  )
  .add(mensajeFinalTexto)
  .to(bufferMensaje)
  .to(esperarDebounce)
  .to(leerBuffer)
  .to(esUltimoMensaje
    .onTrue(eliminarBuffer.to(combinarMensajes).to(obtenerInfoClinica).to(agenteZoe).to(calcularDelay).to(enviarRespuesta))
    .onFalse(nodoIgnorar)
  )
  .add(mensajeFinalAudio)
  .to(bufferMensaje);
