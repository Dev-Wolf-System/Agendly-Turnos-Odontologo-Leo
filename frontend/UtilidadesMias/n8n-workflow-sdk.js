import { workflow, node, trigger, sticky, placeholder, newCredential, ifElse, switchCase, merge, splitInBatches, nextBatch, languageModel, memory, tool, outputParser, embedding, embeddings, vectorStore, retriever, documentLoader, textSplitter, reranker, fromAi, expr } from '@n8n/workflow-sdk';

// ============================================================
// CREDENTIALS
// ============================================================
const openAiCred = newCredential('OpenAI');
const redisCred = newCredential('Redis');
const postgresCred = newCredential('Postgres Chat Memory');

// ============================================================
// PLACEHOLDERS
// ============================================================
const API_BASE = placeholder('URL de tu API Avax Health (ej: https://api.avaxhealth.com)');
const API_KEY = placeholder('API Key de Avax Health para autenticación x-api-key');
const EVOLUTION_API_URL = placeholder('URL base de Evolution API (ej: https://evo.tudominio.com)');

// ============================================================
// 1. WEBHOOK - Recibir mensaje de WhatsApp
// ============================================================
const webhookWhatsApp = trigger({
  type: 'n8n-nodes-base.webhook',
  version: 2.1,
  config: {
    name: 'Webhook WhatsApp',
    parameters: {
      httpMethod: 'POST',
      path: '18af0a77-f363-4fbc-a680-4b03b7371a50',
      responseMode: 'onReceived'
    },
    position: [240, 560]
  },
  output: [{
    body: {
      data: {
        key: { remoteJid: '5491112345678@s.whatsapp.net' },
        message: {
          conversation: 'Hola, quiero sacar un turno',
          audioMessage: { base64: '' }
        },
        messageTimestamp: 1712500000
      },
      instance: 'clinica-demo'
    }
  }]
});

// ============================================================
// 2. EXTRAER DATOS - Set node para extraer campos del webhook
// ============================================================
const extraerDatos = node({
  type: 'n8n-nodes-base.set',
  version: 3.4,
  config: {
    name: 'Extraer Datos',
    parameters: {
      mode: 'manual',
      assignments: {
        assignments: [
          {
            id: 'a1',
            name: 'sender',
            value: expr('{{ $json.body.data.key.remoteJid }}'),
            type: 'string'
          },
          {
            id: 'a2',
            name: 'message_type',
            value: expr('{{ $json.body.data.message.conversation ? "conversation" : "audio" }}'),
            type: 'string'
          },
          {
            id: 'a3',
            name: 'text_message',
            value: expr('{{ $json.body.data.message.conversation || "" }}'),
            type: 'string'
          },
          {
            id: 'a4',
            name: 'voice_message',
            value: expr('{{ $json.body.data.message.audioMessage?.base64 || "" }}'),
            type: 'string'
          },
          {
            id: 'a5',
            name: 'sessionId',
            value: expr('{{ $json.body.data.key.remoteJid + "_" + Date.now() }}'),
            type: 'string'
          },
          {
            id: 'a6',
            name: 'dataTime',
            value: expr('{{ new Date().toISOString() }}'),
            type: 'string'
          },
          {
            id: 'a7',
            name: 'instance_name',
            value: expr('{{ $json.body.instance }}'),
            type: 'string'
          }
        ]
      }
    },
    position: [480, 560]
  },
  output: [{
    sender: '5491112345678@s.whatsapp.net',
    message_type: 'conversation',
    text_message: 'Hola, quiero sacar un turno',
    voice_message: '',
    sessionId: '5491112345678@s.whatsapp.net_1712500000000',
    dataTime: '2026-04-07T10:00:00.000Z',
    instance_name: 'clinica-demo'
  }]
});

// ============================================================
// 3. IDENTIFICAR CLINICA - HTTP Request a la API
// ============================================================
const identificarClinica = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Identificar Clinica',
    parameters: {
      method: 'GET',
      url: expr('{{ $("Extraer Datos").item.json.instance_name }}'),
      sendHeaders: true,
      specifyHeaders: 'keypair',
      headerParameters: {
        parameters: [
          { name: 'x-api-key', value: API_KEY }
        ]
      }
    },
    position: [720, 560]
  },
  output: [{
    clinicaId: 'uuid-clinica-123',
    nombre: 'Clinica Dental Demo',
    evolution_api_key: 'evo-key-abc123',
    instance_name: 'clinica-demo'
  }]
});

// ============================================================
// STICKY: Explicar URL de identificar clinica
// ============================================================
const stickyIdentificar = sticky(
  '## Identificar Clinica\nLa URL debe ser:\n`{API_BASE}/agent/clinica/by-instance/{instanceName}`\n\nConfigura el placeholder API_BASE con la URL de tu servidor.',
  [identificarClinica],
  { color: 4 }
);

// ============================================================
// 4. IF - Verificar tipo de mensaje (conversation vs audio)
// ============================================================
const verificarTipoMensaje = ifElse({
  version: 2.3,
  config: {
    name: 'Es Texto?',
    parameters: {
      conditions: {
        conditions: [
          {
            leftValue: expr('{{ $("Extraer Datos").item.json.message_type }}'),
            operator: { type: 'string', operation: 'equals' },
            rightValue: 'conversation'
          }
        ]
      }
    },
    position: [960, 560]
  }
});

// ============================================================
// 5a. RUTA TEXTO - Setear mensaje final directamente
// ============================================================
const setMensajeTexto = node({
  type: 'n8n-nodes-base.set',
  version: 3.4,
  config: {
    name: 'Mensaje de Texto',
    parameters: {
      mode: 'manual',
      assignments: {
        assignments: [
          {
            id: 'ft1',
            name: 'final_message',
            value: expr('{{ $("Extraer Datos").item.json.text_message }}'),
            type: 'string'
          },
          {
            id: 'ft2',
            name: 'sender',
            value: expr('{{ $("Extraer Datos").item.json.sender }}'),
            type: 'string'
          },
          {
            id: 'ft3',
            name: 'sessionId',
            value: expr('{{ $("Extraer Datos").item.json.sessionId }}'),
            type: 'string'
          },
          {
            id: 'ft4',
            name: 'dataTime',
            value: expr('{{ $("Extraer Datos").item.json.dataTime }}'),
            type: 'string'
          },
          {
            id: 'ft5',
            name: 'instance_name',
            value: expr('{{ $("Extraer Datos").item.json.instance_name }}'),
            type: 'string'
          },
          {
            id: 'ft6',
            name: 'clinicaId',
            value: expr('{{ $("Identificar Clinica").item.json.clinicaId }}'),
            type: 'string'
          },
          {
            id: 'ft7',
            name: 'evolution_api_key',
            value: expr('{{ $("Identificar Clinica").item.json.evolution_api_key }}'),
            type: 'string'
          }
        ]
      }
    },
    position: [1200, 440]
  },
  output: [{
    final_message: 'Hola, quiero sacar un turno',
    sender: '5491112345678@s.whatsapp.net',
    sessionId: '5491112345678@s.whatsapp.net_1712500000000',
    dataTime: '2026-04-07T10:00:00.000Z',
    instance_name: 'clinica-demo',
    clinicaId: 'uuid-clinica-123',
    evolution_api_key: 'evo-key-abc123'
  }]
});

// ============================================================
// 5b. RUTA VOZ - Convertir base64 a binario
// ============================================================
const convertirBase64ABinario = node({
  type: 'n8n-nodes-base.convertToFile',
  version: 1.1,
  config: {
    name: 'Convertir Audio Base64',
    parameters: {
      operation: 'toBinary',
      sourceProperty: 'voice_message',
      options: {
        mimeType: 'audio/ogg',
        fileName: 'audio.ogg'
      }
    },
    position: [1200, 700]
  },
  output: [{ binary: { data: {} } }]
});

// ============================================================
// 5c. TRANSCRIBIR AUDIO - OpenAI Whisper
// ============================================================
const transcribirAudio = node({
  type: '@n8n/n8n-nodes-langchain.openAi',
  version: 2.1,
  config: {
    name: 'Transcribir Audio',
    parameters: {
      resource: 'audio',
      operation: 'transcribe',
      binaryPropertyName: 'data',
      options: {
        language: 'es'
      }
    },
    credentials: { openAiApi: openAiCred },
    position: [1440, 700]
  },
  output: [{ text: 'Hola, quiero sacar un turno para manana' }]
});

// ============================================================
// 5d. SETEAR MENSAJE VOZ
// ============================================================
const setMensajeVoz = node({
  type: 'n8n-nodes-base.set',
  version: 3.4,
  config: {
    name: 'Mensaje de Voz',
    parameters: {
      mode: 'manual',
      assignments: {
        assignments: [
          {
            id: 'fv1',
            name: 'final_message',
            value: expr('{{ $("Transcribir Audio").item.json.text }}'),
            type: 'string'
          },
          {
            id: 'fv2',
            name: 'sender',
            value: expr('{{ $("Extraer Datos").item.json.sender }}'),
            type: 'string'
          },
          {
            id: 'fv3',
            name: 'sessionId',
            value: expr('{{ $("Extraer Datos").item.json.sessionId }}'),
            type: 'string'
          },
          {
            id: 'fv4',
            name: 'dataTime',
            value: expr('{{ $("Extraer Datos").item.json.dataTime }}'),
            type: 'string'
          },
          {
            id: 'fv5',
            name: 'instance_name',
            value: expr('{{ $("Extraer Datos").item.json.instance_name }}'),
            type: 'string'
          },
          {
            id: 'fv6',
            name: 'clinicaId',
            value: expr('{{ $("Identificar Clinica").item.json.clinicaId }}'),
            type: 'string'
          },
          {
            id: 'fv7',
            name: 'evolution_api_key',
            value: expr('{{ $("Identificar Clinica").item.json.evolution_api_key }}'),
            type: 'string'
          }
        ]
      }
    },
    position: [1680, 700]
  },
  output: [{
    final_message: 'Hola, quiero sacar un turno para manana',
    sender: '5491112345678@s.whatsapp.net',
    sessionId: '5491112345678@s.whatsapp.net_1712500000000',
    dataTime: '2026-04-07T10:00:00.000Z',
    instance_name: 'clinica-demo',
    clinicaId: 'uuid-clinica-123',
    evolution_api_key: 'evo-key-abc123'
  }]
});

// ============================================================
// 6. MERGE - Combinar rutas de texto y voz
// ============================================================
const combinarRutas = merge({
  version: 3.2,
  config: {
    name: 'Combinar Rutas',
    parameters: { mode: 'append' },
    position: [1920, 560]
  }
});

// ============================================================
// 7. REDIS BUFFER - Push mensaje al buffer Redis
// ============================================================
const redisBufferPush = node({
  type: 'n8n-nodes-base.redis',
  version: 1,
  config: {
    name: 'Buffer Push Redis',
    parameters: {
      operation: 'push',
      list: expr('{{ "buffer:" + $json.sender }}'),
      value: expr('{{ JSON.stringify({ message: $json.final_message, sessionId: $json.sessionId, dataTime: $json.dataTime }) }}'),
      tail: true
    },
    credentials: { redis: redisCred },
    position: [2160, 560]
  },
  output: [{ success: true }]
});

// ============================================================
// 8. GET BUFFER - Leer buffer de Redis
// ============================================================
const redisBufferGet = node({
  type: 'n8n-nodes-base.redis',
  version: 1,
  config: {
    name: 'Leer Buffer Redis',
    parameters: {
      operation: 'get',
      propertyName: 'bufferData',
      key: expr('{{ "buffer:" + $("Combinar Rutas").item.json.sender }}'),
      keyType: 'list'
    },
    credentials: { redis: redisCred },
    position: [2400, 560]
  },
  output: [{
    bufferData: ['{"message":"Hola","sessionId":"sess1","dataTime":"2026-04-07T10:00:00.000Z"}']
  }]
});

// ============================================================
// 9. WAIT - Esperar 5 segundos (debounce)
// ============================================================
const esperarDebounce = node({
  type: 'n8n-nodes-base.wait',
  version: 1.1,
  config: {
    name: 'Esperar 5s Debounce',
    parameters: {
      resume: 'timeInterval',
      amount: 5,
      unit: 'seconds'
    },
    position: [2640, 560]
  },
  output: [{}]
});

// ============================================================
// 10. GET BUFFER AGAIN - Re-leer buffer tras esperar
// ============================================================
const redisBufferGetAgain = node({
  type: 'n8n-nodes-base.redis',
  version: 1,
  config: {
    name: 'Re-leer Buffer Redis',
    parameters: {
      operation: 'get',
      propertyName: 'bufferData',
      key: expr('{{ "buffer:" + $("Combinar Rutas").item.json.sender }}'),
      keyType: 'list'
    },
    credentials: { redis: redisCred },
    position: [2880, 560]
  },
  output: [{
    bufferData: ['{"message":"Hola","sessionId":"sess1","dataTime":"2026-04-07T10:00:00.000Z"}', '{"message":"quiero turno","sessionId":"sess2","dataTime":"2026-04-07T10:00:04.000Z"}']
  }]
});

// ============================================================
// 11. SWITCH - Verificar si es el ultimo mensaje (debounce)
// ============================================================
const switchDebounce = switchCase({
  version: 3.4,
  config: {
    name: 'Verificar Debounce',
    parameters: {
      mode: 'rules',
      rules: {
        values: [
          {
            conditions: {
              conditions: [
                {
                  leftValue: expr('{{ $("Combinar Rutas").item.json.sessionId }}'),
                  operator: { type: 'string', operation: 'equals' },
                  rightValue: expr('{{ JSON.parse($json.bufferData[$json.bufferData.length - 1]).sessionId }}')
                }
              ]
            },
            renameOutput: true,
            outputKey: 'Es ultimo mensaje'
          }
        ]
      },
      options: {
        fallbackOutput: 'extra',
        renameFallbackOutput: 'No es ultimo - Ignorar'
      }
    },
    position: [3120, 560]
  }
});

// ============================================================
// 12. NO-OP - Ignorar (no es el ultimo mensaje)
// ============================================================
const ignorarMensaje = node({
  type: 'n8n-nodes-base.noOp',
  version: 1,
  config: {
    name: 'Ignorar (No es ultimo)',
    parameters: {},
    position: [3360, 760]
  },
  output: [{}]
});

// ============================================================
// 13. DELETE BUFFER - Borrar buffer de Redis
// ============================================================
const deleteBuffer = node({
  type: 'n8n-nodes-base.redis',
  version: 1,
  config: {
    name: 'Borrar Buffer Redis',
    parameters: {
      operation: 'delete',
      key: expr('{{ "buffer:" + $("Combinar Rutas").item.json.sender }}')
    },
    credentials: { redis: redisCred },
    position: [3360, 440]
  },
  output: [{ success: true }]
});

// ============================================================
// 14. EDIT FIELDS - Combinar mensajes del buffer
// ============================================================
const combinarMensajes = node({
  type: 'n8n-nodes-base.set',
  version: 3.4,
  config: {
    name: 'Combinar Mensajes Buffer',
    parameters: {
      mode: 'manual',
      assignments: {
        assignments: [
          {
            id: 'cm1',
            name: 'final_message',
            value: expr('{{ $("Re-leer Buffer Redis").item.json.bufferData.map(item => JSON.parse(item).message).join(" ") }}'),
            type: 'string'
          },
          {
            id: 'cm2',
            name: 'sender',
            value: expr('{{ $("Combinar Rutas").item.json.sender }}'),
            type: 'string'
          },
          {
            id: 'cm3',
            name: 'instance_name',
            value: expr('{{ $("Combinar Rutas").item.json.instance_name }}'),
            type: 'string'
          },
          {
            id: 'cm4',
            name: 'clinicaId',
            value: expr('{{ $("Combinar Rutas").item.json.clinicaId }}'),
            type: 'string'
          },
          {
            id: 'cm5',
            name: 'evolution_api_key',
            value: expr('{{ $("Combinar Rutas").item.json.evolution_api_key }}'),
            type: 'string'
          }
        ]
      }
    },
    position: [3600, 440]
  },
  output: [{
    final_message: 'Hola quiero turno',
    sender: '5491112345678@s.whatsapp.net',
    instance_name: 'clinica-demo',
    clinicaId: 'uuid-clinica-123',
    evolution_api_key: 'evo-key-abc123'
  }]
});

// ============================================================
// 15. LIMIT - Tomar solo el primer item
// ============================================================
const limitPrimerItem = node({
  type: 'n8n-nodes-base.limit',
  version: 1,
  config: {
    name: 'Limitar a 1 Item',
    parameters: {
      maxItems: 1,
      keep: 'firstItems'
    },
    position: [3840, 440]
  },
  output: [{
    final_message: 'Hola quiero turno',
    sender: '5491112345678@s.whatsapp.net',
    instance_name: 'clinica-demo',
    clinicaId: 'uuid-clinica-123',
    evolution_api_key: 'evo-key-abc123'
  }]
});

// ============================================================
// 16. OBTENER INFO CLINICA - HTTP Request
// ============================================================
const obtenerInfoClinica = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Obtener Info Clinica',
    parameters: {
      method: 'GET',
      url: expr('{{ $json.clinicaId }}'),
      sendHeaders: true,
      specifyHeaders: 'keypair',
      headerParameters: {
        parameters: [
          { name: 'x-api-key', value: API_KEY }
        ]
      }
    },
    position: [4080, 440]
  },
  output: [{
    clinicaId: 'uuid-clinica-123',
    nombre: 'Clinica Dental Demo',
    direccion: 'Av. Corrientes 1234, CABA',
    especialidad: 'Odontologia',
    agent_nombre: 'Zoe',
    profesionales: [{ nombre: 'Dr. Lopez', especialidad: 'Ortodoncia' }],
    tratamientos: [{ nombre: 'Limpieza dental', duracion: 30 }],
    horarios: [{ dia: 'Lunes', desde: '09:00', hasta: '18:00' }]
  }]
});

// ============================================================
// STICKY: URL Info Clinica
// ============================================================
const stickyInfoClinica = sticky(
  '## Obtener Info Clinica\nURL: `{API_BASE}/agent/clinica/{clinicaId}/info`\n\nDevuelve toda la info de la clinica para el system prompt del agente.',
  [obtenerInfoClinica],
  { color: 4 }
);

// ============================================================
// AI AGENT - Sub-nodos
// ============================================================

// Modelo OpenAI GPT-4.1-mini
const modeloOpenAI = languageModel({
  type: '@n8n/n8n-nodes-langchain.lmChatOpenAi',
  version: 1.3,
  config: {
    name: 'GPT-4.1-mini',
    parameters: {
      model: { __rl: true, mode: 'id', value: 'gpt-4.1-mini' },
      options: {
        temperature: 0.7,
        maxTokens: 2048
      }
    },
    credentials: { openAiApi: openAiCred },
    position: [4320, 700]
  }
});

// Memoria Postgres Chat
const memoriaPostgres = memory({
  type: '@n8n/n8n-nodes-langchain.memoryPostgresChat',
  version: 1.3,
  config: {
    name: 'Memoria Postgres',
    parameters: {
      sessionIdType: 'customKey',
      sessionKey: expr('{{ $("Combinar Mensajes Buffer").item.json.sender }}'),
      tableName: 'n8n_chat_histories',
      contextWindowLength: 10
    },
    credentials: { postgres: postgresCred },
    position: [4480, 700]
  }
});

// Tool: Think
const toolPensar = tool({
  type: '@n8n/n8n-nodes-langchain.toolThink',
  version: 1.1,
  config: {
    name: 'Pensar',
    parameters: {
      description: 'Usa esta herramienta para pensar y razonar sobre la conversacion antes de responder. No obtiene informacion nueva ni modifica datos, solo agrega el pensamiento al log. Usala cuando necesites razonar sobre que herramienta usar o como responder.'
    },
    position: [4640, 700]
  }
});

// Tool: Buscar Paciente por Telefono
const toolBuscarPaciente = tool({
  type: 'n8n-nodes-base.httpRequestTool',
  version: 4.4,
  config: {
    name: 'Buscar Paciente',
    parameters: {
      method: 'GET',
      url: expr('{{ $("Obtener Info Clinica").item.json.clinicaId }}'),
      sendHeaders: true,
      specifyHeaders: 'keypair',
      headerParameters: {
        parameters: [
          { name: 'x-api-key', value: expr('{{ $("Combinar Mensajes Buffer").item.json.evolution_api_key }}') }
        ]
      },
      sendQuery: true,
      specifyQuery: 'keypair',
      queryParameters: {
        parameters: [
          { name: 'clinicaId', value: expr('{{ $("Combinar Mensajes Buffer").item.json.clinicaId }}') }
        ]
      },
      optimizeResponse: true,
      responseType: 'json'
    },
    description: 'Busca un paciente por su numero de telefono. El parametro phone es el numero del paciente sin el @s.whatsapp.net. URL: {API_BASE}/agent/pacientes/by-phone/{phone}?clinicaId={clinicaId}',
    position: [4800, 700]
  }
});

// Tool: Buscar Paciente por DNI
const toolBuscarPacienteDNI = tool({
  type: 'n8n-nodes-base.httpRequestTool',
  version: 4.4,
  config: {
    name: 'Buscar Paciente DNI',
    parameters: {
      method: 'GET',
      url: expr('{{ $("Obtener Info Clinica").item.json.clinicaId }}'),
      sendHeaders: true,
      specifyHeaders: 'keypair',
      headerParameters: {
        parameters: [
          { name: 'x-api-key', value: expr('{{ $("Combinar Mensajes Buffer").item.json.evolution_api_key }}') }
        ]
      },
      sendQuery: true,
      specifyQuery: 'keypair',
      queryParameters: {
        parameters: [
          { name: 'clinicaId', value: expr('{{ $("Combinar Mensajes Buffer").item.json.clinicaId }}') }
        ]
      },
      optimizeResponse: true,
      responseType: 'json'
    },
    description: 'Busca un paciente por su DNI (documento de identidad). URL: {API_BASE}/agent/pacientes/by-dni/{dni}?clinicaId={clinicaId}',
    position: [4960, 700]
  }
});

// Tool: Registrar Paciente
const toolRegistrarPaciente = tool({
  type: 'n8n-nodes-base.httpRequestTool',
  version: 4.4,
  config: {
    name: 'Registrar Paciente',
    parameters: {
      method: 'POST',
      url: expr('{{ $("Obtener Info Clinica").item.json.clinicaId }}'),
      sendHeaders: true,
      specifyHeaders: 'keypair',
      headerParameters: {
        parameters: [
          { name: 'x-api-key', value: expr('{{ $("Combinar Mensajes Buffer").item.json.evolution_api_key }}') }
        ]
      },
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: fromAi('body', 'JSON con los datos del paciente: { "nombre": string, "apellido": string, "telefono": string, "dni": string, "email": string (opcional), "clinicaId": string }'),
      optimizeResponse: true,
      responseType: 'json'
    },
    description: 'Registra un nuevo paciente en el sistema. URL: {API_BASE}/agent/pacientes. Enviar body JSON con nombre, apellido, telefono, dni, clinicaId.',
    position: [5120, 700]
  }
});

// Tool: Turnos Disponibles
const toolTurnosDisponibles = tool({
  type: 'n8n-nodes-base.httpRequestTool',
  version: 4.4,
  config: {
    name: 'Turnos Disponibles',
    parameters: {
      method: 'GET',
      url: expr('{{ $("Obtener Info Clinica").item.json.clinicaId }}'),
      sendHeaders: true,
      specifyHeaders: 'keypair',
      headerParameters: {
        parameters: [
          { name: 'x-api-key', value: expr('{{ $("Combinar Mensajes Buffer").item.json.evolution_api_key }}') }
        ]
      },
      sendQuery: true,
      specifyQuery: 'keypair',
      queryParameters: {
        parameters: [
          { name: 'clinicaId', value: expr('{{ $("Combinar Mensajes Buffer").item.json.clinicaId }}') },
          { name: 'dias', value: '3' }
        ]
      },
      optimizeResponse: true,
      responseType: 'json'
    },
    description: 'Obtiene los turnos disponibles para los proximos 3 dias. URL: {API_BASE}/agent/turnos/disponibles?clinicaId={clinicaId}&dias=3',
    position: [5280, 700]
  }
});

// Tool: Verificar Turno
const toolVerificarTurno = tool({
  type: 'n8n-nodes-base.httpRequestTool',
  version: 4.4,
  config: {
    name: 'Verificar Turno',
    parameters: {
      method: 'GET',
      url: expr('{{ $("Obtener Info Clinica").item.json.clinicaId }}'),
      sendHeaders: true,
      specifyHeaders: 'keypair',
      headerParameters: {
        parameters: [
          { name: 'x-api-key', value: expr('{{ $("Combinar Mensajes Buffer").item.json.evolution_api_key }}') }
        ]
      },
      sendQuery: true,
      specifyQuery: 'keypair',
      queryParameters: {
        parameters: [
          { name: 'clinicaId', value: expr('{{ $("Combinar Mensajes Buffer").item.json.clinicaId }}') }
        ]
      },
      optimizeResponse: true,
      responseType: 'json'
    },
    description: 'Verifica si un paciente ya tiene turnos agendados. URL: {API_BASE}/agent/turnos/verificar/{pacienteId}?clinicaId={clinicaId}',
    position: [5440, 700]
  }
});

// Tool: Crear Turno
const toolCrearTurno = tool({
  type: 'n8n-nodes-base.httpRequestTool',
  version: 4.4,
  config: {
    name: 'Crear Turno',
    parameters: {
      method: 'POST',
      url: expr('{{ $("Obtener Info Clinica").item.json.clinicaId }}'),
      sendHeaders: true,
      specifyHeaders: 'keypair',
      headerParameters: {
        parameters: [
          { name: 'x-api-key', value: expr('{{ $("Combinar Mensajes Buffer").item.json.evolution_api_key }}') }
        ]
      },
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: fromAi('body', 'JSON con los datos del turno: { "pacienteId": string, "profesionalId": string, "tratamientoId": string, "fecha": string (ISO), "hora": string (HH:mm), "clinicaId": string }'),
      optimizeResponse: true,
      responseType: 'json'
    },
    description: 'Crea un nuevo turno para un paciente. URL: {API_BASE}/agent/turnos. Enviar body JSON con pacienteId, profesionalId, tratamientoId, fecha, hora, clinicaId.',
    position: [5600, 700]
  }
});

// Tool: Modificar Estado Turno
const toolModificarEstadoTurno = tool({
  type: 'n8n-nodes-base.httpRequestTool',
  version: 4.4,
  config: {
    name: 'Modificar Estado Turno',
    parameters: {
      method: 'PATCH',
      url: expr('{{ $("Obtener Info Clinica").item.json.clinicaId }}'),
      sendHeaders: true,
      specifyHeaders: 'keypair',
      headerParameters: {
        parameters: [
          { name: 'x-api-key', value: expr('{{ $("Combinar Mensajes Buffer").item.json.evolution_api_key }}') }
        ]
      },
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: fromAi('body', 'JSON con el nuevo estado: { "estado": "cancelado" | "confirmado" | "completado" }'),
      optimizeResponse: true,
      responseType: 'json'
    },
    description: 'Modifica el estado de un turno existente (cancelar, confirmar, etc). URL: {API_BASE}/agent/turnos/{turnoId}/estado. Enviar body JSON con el nuevo estado.',
    position: [5760, 700]
  }
});

// ============================================================
// 17. AI AGENT - Agente Zoe
// ============================================================
const systemPrompt = expr(
  'Eres {{ $("Obtener Info Clinica").item.json.agent_nombre || "Zoe" }}, la asistente virtual de {{ $("Obtener Info Clinica").item.json.nombre }}.\n\n' +
  '## INFORMACION DE LA CLINICA\n' +
  '- Nombre: {{ $("Obtener Info Clinica").item.json.nombre }}\n' +
  '- Direccion: {{ $("Obtener Info Clinica").item.json.direccion }}\n' +
  '- Especialidad: {{ $("Obtener Info Clinica").item.json.especialidad }}\n\n' +
  '## PROFESIONALES DISPONIBLES\n' +
  '{{ JSON.stringify($("Obtener Info Clinica").item.json.profesionales) }}\n\n' +
  '## TRATAMIENTOS DISPONIBLES\n' +
  '{{ JSON.stringify($("Obtener Info Clinica").item.json.tratamientos) }}\n\n' +
  '## HORARIOS DE ATENCION\n' +
  '{{ JSON.stringify($("Obtener Info Clinica").item.json.horarios) }}\n\n' +
  '## FECHA Y HORA ACTUAL\n' +
  '{{ $now.setZone("America/Argentina/Buenos_Aires").toFormat("cccc dd/MM/yyyy HH:mm") }}\n\n' +
  '## INSTRUCCIONES\n' +
  '1. Saluda al paciente segun la hora del dia (buenos dias/tardes/noches).\n' +
  '2. Detecta la intencion del paciente: agendar turno, cancelar turno, consultar informacion.\n' +
  '3. Para identificar al paciente, pide su numero de telefono o DNI.\n' +
  '4. Usa la herramienta "Buscar Paciente" o "Buscar Paciente DNI" para buscarlo en el sistema.\n' +
  '5. Si el paciente no esta registrado, pide sus datos y usa "Registrar Paciente" para crearlo.\n' +
  '6. Para agendar turnos:\n' +
  '   - Usa "Turnos Disponibles" para mostrar opciones.\n' +
  '   - Usa "Verificar Turno" para chequear si ya tiene turnos.\n' +
  '   - Usa "Crear Turno" para confirmar la reserva.\n' +
  '7. Para cancelar turnos:\n' +
  '   - Usa "Verificar Turno" para encontrar el turno.\n' +
  '   - Usa "Modificar Estado Turno" para cancelarlo.\n' +
  '8. Usa "Pensar" cuando necesites razonar sobre que hacer.\n\n' +
  '## HERRAMIENTAS DISPONIBLES\n' +
  '- Pensar: para razonar internamente\n' +
  '- Buscar Paciente: buscar por telefono\n' +
  '- Buscar Paciente DNI: buscar por DNI\n' +
  '- Registrar Paciente: crear nuevo paciente\n' +
  '- Turnos Disponibles: ver turnos libres\n' +
  '- Verificar Turno: ver turnos del paciente\n' +
  '- Crear Turno: agendar turno\n' +
  '- Modificar Estado Turno: cancelar/confirmar turno\n\n' +
  '## ESTILO DE COMUNICACION\n' +
  '- Tono calido y profesional, como en WhatsApp.\n' +
  '- Usa emojis con moderacion (1-2 por mensaje maximo).\n' +
  '- Respuestas concisas y claras.\n' +
  '- Siempre en espanol.\n' +
  '- No uses markdown, solo texto plano con emojis.\n' +
  '- Nunca reveles que eres una IA, actua como asistente humana.'
);

const agenteZoe = node({
  type: '@n8n/n8n-nodes-langchain.agent',
  version: 3.1,
  config: {
    name: 'Agente Zoe',
    parameters: {
      promptType: 'define',
      text: expr('{{ $("Combinar Mensajes Buffer").item.json.final_message }}'),
      options: {
        systemMessage: systemPrompt,
        maxIterations: 15
      }
    },
    subnodes: {
      model: modeloOpenAI,
      memory: memoriaPostgres,
      tools: [
        toolPensar,
        toolBuscarPaciente,
        toolBuscarPacienteDNI,
        toolRegistrarPaciente,
        toolTurnosDisponibles,
        toolVerificarTurno,
        toolCrearTurno,
        toolModificarEstadoTurno
      ]
    },
    position: [4320, 440]
  },
  output: [{ output: 'Buenos dias! Soy Zoe, asistente de Clinica Dental Demo. En que puedo ayudarte hoy?' }]
});

// ============================================================
// 18. CALCULAR DELAY - Set node para calcular delay de tipeo
// ============================================================
const calcularDelay = node({
  type: 'n8n-nodes-base.set',
  version: 3.4,
  config: {
    name: 'Calcular Delay Tipeo',
    parameters: {
      mode: 'manual',
      includeOtherFields: true,
      assignments: {
        assignments: [
          {
            id: 'cd1',
            name: 'delay',
            value: expr('{{ Math.min($json.output.length * 40, 20000) }}'),
            type: 'number'
          }
        ]
      }
    },
    position: [4560, 440]
  },
  output: [{
    output: 'Buenos dias! Soy Zoe, asistente de Clinica Dental Demo.',
    delay: 2200
  }]
});

// ============================================================
// 19. ENVIAR RESPUESTA - HTTP Request a Evolution API
// ============================================================
const enviarRespuesta = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.4,
  config: {
    name: 'Enviar Respuesta WhatsApp',
    parameters: {
      method: 'POST',
      url: expr('{{ $("Combinar Mensajes Buffer").item.json.instance_name }}'),
      sendHeaders: true,
      specifyHeaders: 'keypair',
      headerParameters: {
        parameters: [
          { name: 'apikey', value: expr('{{ $("Combinar Mensajes Buffer").item.json.evolution_api_key }}') },
          { name: 'Content-Type', value: 'application/json' }
        ]
      },
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: expr('{{ JSON.stringify({ number: $("Combinar Mensajes Buffer").item.json.sender.replace("@s.whatsapp.net", ""), text: $json.output, delay: $json.delay }) }}')
    },
    position: [4800, 440]
  },
  output: [{ status: 'sent' }]
});

// ============================================================
// STICKY: URLs de la API
// ============================================================
const stickyURLs = sticky(
  '## URLs de la API Avax Health\n\n' +
  '- Identificar Clinica: `GET {API_BASE}/agent/clinica/by-instance/{instanceName}`\n' +
  '- Info Clinica: `GET {API_BASE}/agent/clinica/{clinicaId}/info`\n' +
  '- Buscar Paciente: `GET {API_BASE}/agent/pacientes/by-phone/{phone}?clinicaId={clinicaId}`\n' +
  '- Buscar Paciente DNI: `GET {API_BASE}/agent/pacientes/by-dni/{dni}?clinicaId={clinicaId}`\n' +
  '- Registrar Paciente: `POST {API_BASE}/agent/pacientes`\n' +
  '- Turnos Disponibles: `GET {API_BASE}/agent/turnos/disponibles?clinicaId={clinicaId}&dias=3`\n' +
  '- Verificar Turno: `GET {API_BASE}/agent/turnos/verificar/{pacienteId}?clinicaId={clinicaId}`\n' +
  '- Crear Turno: `POST {API_BASE}/agent/turnos`\n' +
  '- Modificar Estado: `PATCH {API_BASE}/agent/turnos/{turnoId}/estado`\n\n' +
  '## Evolution API\n' +
  '- Enviar Texto: `POST {EVOLUTION_API_URL}/message/sendText/{instanceName}`\n\n' +
  '**IMPORTANTE:** Configura los placeholders API_BASE, API_KEY y EVOLUTION_API_URL en cada nodo HTTP correspondiente.',
  [],
  { color: 6, position: [240, 900], width: 600, height: 400 }
);

// ============================================================
// STICKY: Instrucciones de configuracion
// ============================================================
const stickyConfig = sticky(
  '## Configuracion del Workflow\n\n' +
  '1. Configura las credenciales: OpenAI, Redis, Postgres\n' +
  '2. Reemplaza los placeholders en cada nodo HTTP con las URLs correctas\n' +
  '3. La URL del webhook ya esta configurada: `18af0a77-f363-4fbc-a680-4b03b7371a50`\n' +
  '4. Timezone: America/Argentina/Buenos_Aires\n' +
  '5. Los nodos de herramientas del agente necesitan las URLs dinamicas basadas en el clinicaId',
  [],
  { color: 3, position: [240, 140], width: 500, height: 250 }
);

// ============================================================
// COMPOSICION DEL WORKFLOW
// ============================================================
export default workflow('Qcli5Ruwjk3pCTNA', 'Asistente Avax Health IA Virtual')
  // Flujo principal: Webhook -> Extraer Datos -> Identificar Clinica -> Verificar tipo
  .add(webhookWhatsApp)
  .to(extraerDatos)
  .to(identificarClinica)
  .to(verificarTipoMensaje
    // Ruta TEXTO (true)
    .onTrue(setMensajeTexto.to(combinarRutas.input(0)))
    // Ruta VOZ (false)
    .onFalse(convertirBase64ABinario.to(transcribirAudio).to(setMensajeVoz).to(combinarRutas.input(1)))
  )
  // Despues del merge: Buffer Redis -> Esperar -> Re-leer -> Switch debounce
  .add(combinarRutas)
  .to(redisBufferPush)
  .to(redisBufferGet)
  .to(esperarDebounce)
  .to(redisBufferGetAgain)
  .to(switchDebounce
    // Caso 0: Es el ultimo mensaje -> procesar
    .onCase(0, deleteBuffer.to(combinarMensajes).to(limitPrimerItem).to(obtenerInfoClinica).to(agenteZoe).to(calcularDelay).to(enviarRespuesta))
    // Fallback: No es el ultimo -> ignorar
    .onCase(1, ignorarMensaje)
  );
