● Arquitectura del Agente Zoe IA                        
  
  El agente tiene 3 capas que ya tenes parcialmente       configuradas:                                         
                                                        
  Paciente (WhatsApp)                                   
      ↕                                                   Evolution API (1 instancia por clinica)               
      ↕                                                 
  n8n (1 workflow, router por clinica_id)               
      ↕                                                   Avax Health API (NestJS) + OpenAI                     
                                                        
  ---                                                   
  Flujo completo de un mensaje
                                                          1. Paciente escribe "Hola, quiero un turno para
  manana"                                                 2. Evolution API recibe el mensaje → dispara webhook a   n8n                                                  
  3. n8n identifica la clinica por el instance_name del 
  webhook                                                 4. n8n consulta la API de Avax Health:                
     - GET /agent/clinica → datos de la clinica,        
  horarios, tratamientos                                
     - GET /agent/disponibilidad?fecha=2026-04-08 →     
  slots libres                                          
     - GET /agent/paciente?telefono=+5491123456 → datos
  del paciente (o null si es nuevo)                     
  5. n8n arma el prompt con todo el contexto y lo envia
  a OpenAI                                              
  6. OpenAI responde: "Tenemos disponible manana a las  
  10:00 y 15:30. Cual preferis?"                        
  7. n8n envia la respuesta via Evolution API al        
  WhatsApp del paciente                                   8. El paciente responde "A las 10"                    
  9. n8n llama POST /agent/turnos → crea el turno       
  10. Responde: "Listo! Tu turno quedo agendado para    
  manana 08/04 a las 10:00 con Dr. Lopez"               
                                                        
  ---                                                   
  Lo que hay que construir
                                                        
  Bloque 1 — Backend: Endpoints del Agente (NestJS)    
                                                          Un nuevo modulo /modules/agent/ con endpoints           especificos para el bot, sin auth JWT (autenticados   
  por API key del agente):                              

  GET  /agent/clinica/:clinicaId          → info clinica   + horarios + tratamientos                            
  GET  /agent/disponibilidad/:clinicaId   → slots libres   para una fecha                                       
  GET  /agent/paciente                    → buscar
  paciente por telefono                                   POST /agent/paciente                    → registrar   
  paciente nuevo                                        
  POST /agent/turno                       → crear turno 
  GET  /agent/turnos-paciente             → turnos      
  proximos de un paciente                                 POST /agent/cancelar-turno              → cancelar    
  turno                                                 
  GET  /agent/resumen-admin/:clinicaId    → resumen
  diario para el admin                                  
                                                       
  Protegidos por un AgentGuard que valida un header       x-agent-key (secreto compartido con n8n).
                                                          Bloque 2 — n8n: Workflow multi-tenant                 
                                     
  Un solo workflow con esta estructura:                 

  Webhook (recibe de Evolution API)
    → Switch (por tipo: message / status / etc)         
    → HTTP Request: GET /agent/clinica/:id (cargar      
  contexto)                                             
    → HTTP Request: GET /agent/paciente?tel=X           
  (identificar paciente)                                    → Code Node: armar prompt con contexto              
    → OpenAI Chat: generar respuesta con function       
  calling                                               
    → Switch: segun la accion que OpenAI decidio
        → "consultar_disponibilidad" → HTTP Request GET 
  disponibilidad                                        
        → "agendar_turno" → HTTP Request POST turno     
        → "cancelar_turno" → HTTP Request POST cancelar         → "responder" → solo texto       
    → HTTP Request: enviar respuesta via Evolution API  
                                                          OpenAI con function calling es clave: le decis que      funciones tiene disponibles (agendar, cancelar,       
  consultar) y el modelo decide cual usar segun el      
  mensaje.
                                                        
  Bloque 3 — Frontend: Widget de configuracion          
                                     
  Ya existe parcialmente en la tab de configuracion.      Solo falta:                            
  - Toggle activar/desactivar agente (ya existe           agent_nombre)                                           - Personalizar el nombre y tono del agente
  - Preview del flujo de conversacion                   
                                                          ---                                
  Enfoque de implementacion sugerido                    
                                                        
  Paso 1: Backend — Modulo Agent con endpoints
  (~2h)                                                 
  Paso 2: n8n — Workflow basico (recibir + responder)
  (~1h)                                                   Paso 3: n8n — Integrar OpenAI con function calling    
  (~2h)                                                 
  Paso 4: n8n — Acciones: agendar, cancelar, consultar  
  (~2h)                                                 
  Paso 5: Testing end-to-end con una clinica real       
  (~1h)                                                 
  Paso 6: Frontend — Widget config del agente  
  (~1h)                                                 
                                                        
  ---                                                   
  Queres que arranquemos por el Paso 1 (modulo Agent en 
  el backend con todos los endpoints)?                  
                                                        
✻ Sautéed for 35s                                       
  
❯ conectate a n8n usando las skills mediante mcp        
                                                        
● Perfecto, tengo acceso a n8n. Primero veamos qué      
  workflows ya existen y leamos la referencia del SDK.


claude --resume "admin-bugs-trial-ui-redesign"