# Plan de Features SaaS Premium — Avax Health

> Documento de referencia para llevar a Avax Health a nivel enterprise SaaS.
> Cada feature se marca con ✅ al completarse.

---

## 1. Ciclo de Vida de Pagos (Dunning Management)

- [ ] **Reintentos inteligentes de pago**: Cuando falla un pago (Mercado Pago), reintentar en día 1, 3, 5, 7
- [ ] **Secuencia de emails de dunning**:
  - Día 0: "El pago falló, reintentaremos automáticamente"
  - Día 3: "Segundo intento fallido, actualizá tu método de pago"
  - Día 7: "Último intento — tu cuenta será restringida en 3 días"
  - Día 10: Entra en período de gracia
- [ ] **Recordatorio pre-renovación**: 3 días antes del vencimiento vía email + notificación in-app
- [ ] **Generación de facturas PDF**: Auto-generadas en cada pago exitoso con datos fiscales (CUIT, plan, período, monto)
- [ ] **Historial de billing**: Tabla `billing_events` para trackear todo el ciclo de vida de pagos
- [ ] **Webhooks de Mercado Pago**: Listeners para `payment.failed`, `payment.approved`, `subscription.updated`

---

## 2. Enforcement de Licencia (Degradación Gradual)

| Estado | Qué funciona | Qué se restringe |
|---|---|---|
| **Activa** | Todo | Nada |
| **Past Due** (días 1-7) | Acceso completo + banner de aviso | Nada restringido |
| **Gracia** (días 8-21) | Solo lectura, puede gestionar turnos existentes | No puede crear turnos ni pacientes |
| **Suspendida** (día 22+) | Login + exportar datos + dashboard read-only | Todas las escrituras bloqueadas |
| **Cancelada** (día 60+) | Exportar datos por 30 días más | Sin login, datos en cola de eliminación |

- [x] **SubscriptionGuard mejorado**: Degradación gradual según tabla anterior (no hard lockout) ✅
- [ ] **Pantalla de bloqueo en login**: Si la licencia está suspendida/cancelada, mostrar mensaje claro con la situación y opciones
- [x] **Banners de aviso**: Banner global amarillo (past due), naranja (gracia), rojo (suspendida) en el frontend ✅
- [x] **Grace period automático**: Campo `grace_period_ends_at` en Subscription entity ✅
- [x] **Enum actualizado**: Nuevos estados `past_due` y `gracia` en EstadoSubscription ✅
- [x] **Endpoint subscription-status**: `GET /clinicas/me/subscription-status` con nivel, severidad y mensaje ✅
- [ ] **Export de datos en suspensión**: Permitir descargar datos aunque la cuenta esté suspendida (genera confianza)

---

## 3. Sistema de Notificaciones Multi-Canal

### In-App
- [ ] **Tabla `notifications`**: clinica_id, user_id, type, title, body, read_at, created_at
- [ ] **SSE (Server-Sent Events)**: Tiempo real vía Redis Pub/Sub desde NestJS
- [ ] **UI campana**: Ícono en sidebar/header con badge de no leídas, dropdown con lista

### Email Transaccional (SendGrid/Resend)
- [ ] **Templates de email**:
  - Bienvenida / cuenta creada
  - Verificación de email
  - Reseteo de contraseña
  - Pago exitoso / fallido
  - Suscripción venciendo / vencida
  - Invitación de usuario a clínica
  - Digest semanal de uso (opcional)
- [ ] **Webhook de envío**: n8n workflows que envían emails basados en eventos del sistema

### WhatsApp (Evolution API via n8n)
- [ ] **Recordatorios de pago**: Al dueño de la clínica cuando el pago falla o se acerca el vencimiento
- [ ] **Avisos de mantenimiento**: Notificación masiva a clínicas antes de un mantenimiento programado

### Webhooks Configurables
- [ ] **Registro de URLs por clínica**: UI donde la clínica registra endpoints para recibir eventos
- [ ] **Firma HMAC-SHA256**: Payloads firmados para seguridad
- [ ] **Eventos disponibles**: turno_creado, pago_recibido, paciente_creado, etc.

---

## 4. Comunicación del Sistema

- [ ] **Avisos de mantenimiento**: Tabla `system_announcements` (tipo, severidad, título, mensaje, fecha_inicio, fecha_fin)
- [ ] **Banner global**: Componente frontend que consulta `/api/system/announcements` al cargar. Amarillo para mantenimiento, rojo para incidentes
- [ ] **Status page**: Endpoint `/api/health` chequeando DB, Redis, Evolution API, Mercado Pago
- [ ] **Changelog / Novedades**: Modal "Qué hay de nuevo" post-deploy. Badge "Nuevo" en sidebar. Tabla `changelog_entries`
- [ ] **Ventana de mantenimiento recomendada**: Domingos 2-6 AM Argentina

---

## 5. Onboarding Automatizado

### Checklist Guiado
- [ ] **Checklist en dashboard** (hasta completarse):
  - Completar perfil de clínica (nombre, dirección, logo)
  - Agregar primer profesional/dentista
  - Configurar horarios de atención
  - Agregar primer paciente
  - Crear primer turno
  - Configurar integración WhatsApp (opcional)
  - Invitar miembros del equipo
- [ ] **Tabla `onboarding_progress`**: clinica_id, step_key, completed_at
- [ ] **Componente UI**: Card con barra de progreso, dismiss al completar todo

### Secuencia de Emails (n8n)
- [ ] **Día 0**: Bienvenida + guía rápida
- [ ] **Día 1**: "Importá tus pacientes" (CSV import)
- [ ] **Día 3**: "Configurá recordatorios WhatsApp"
- [ ] **Día 7**: "¿Cómo va todo?" + features no usadas
- [ ] **Día 12**: "Tu trial termina pronto"
- [ ] **Día 14**: Conversión a pago o extensión de trial

### Trial-to-Paid
- [ ] **14 días trial** con todas las features (sin tarjeta)
- [ ] **Día 10**: Banner in-app de upgrade
- [ ] **Día 13**: Email + modal "Trial termina mañana"
- [ ] **Día 14**: Período de gracia (no lockout inmediato)
- [ ] **Incentivo**: "Upgrade en las próximas 48hs por 20% off los primeros 3 meses"

---

## 6. Seguridad & Compliance

### Audit Logs
- [ ] **Tabla `audit_logs`**: clinica_id, user_id, action, entity_type, entity_id, old_values (JSON), new_values (JSON), ip_address, user_agent, created_at
- [ ] **Interceptor global NestJS**: Captura automática de todo Create/Update/Delete
- [ ] **UI de audit log**: Buscable/filtrable en configuración de clínica (feature Pro)
- [ ] **Retención**: 1 año free, 3 años paid. Tabla particionada por mes

### Gestión de Sesiones
- [ ] **Sesiones activas por usuario**: Dispositivo, ubicación, última actividad
- [ ] **"Cerrar todas las sesiones"**: Botón en perfil de usuario
- [ ] **Límite de sesiones concurrentes**: Free = 2, Pro = 5, Enterprise = ilimitado
- [ ] **JWT corto (15min) + refresh token (7 días)**: Revocar refresh tokens al cambiar contraseña

### 2FA / MFA
- [ ] **TOTP** (Google Authenticator): Usando `otplib` en NestJS
- [ ] **Códigos de recuperación**: 10 códigos one-time al activar 2FA
- [ ] **Enforcement**: Opcional por clínica, obligatorio para admin en plan Enterprise

### Alertas de Seguridad
- [ ] **Login desde IP/dispositivo nuevo**: Email de alerta (como GitHub)
- [ ] **IP whitelist** (Enterprise): Restricción de rangos IP por clínica

---

## 7. Monitoreo de Salud por Tenant

### Métricas por Clínica
- [ ] **Tabla `clinic_metrics`** (agregada diariamente por cron):
  - Turnos creados este mes
  - Pacientes activos
  - Frecuencia de login (DAU/MAU)
  - Mensajes WhatsApp enviados
  - Storage usado
  - Usuarios activos
- [ ] **Sparklines en admin**: Gráficos mini de uso per-clínica

### Señales de Churn
- [ ] **Indicadores de riesgo** (query semanal vía n8n/cron):
  - Sin login en 7+ días
  - Turnos cayeron >50% mes a mes
  - Pago fallido + sin actualizar en 5 días
  - Solo 1 usuario logueado (baja adopción)
- [ ] **Flags en admin panel**: Marcar clínicas en riesgo
- [ ] **Email automatizado**: "Te extrañamos" cuando se detecta inactividad

### Detección de Anomalías
- [ ] **Comparación semanal**: Métricas actuales vs promedio de 4 semanas. Alerta si desvío >2 SD
- [ ] **Implementación simple**: Window functions en PostgreSQL, sin ML para V1

---

## 8. Patrones SaaS Modernos

### Feature Flags por Plan
- [x] **Features en Plan entity**: `features: Record<string, boolean>` (JSONB) — ya existente ✅
- [x] **FeatureFlagService**: `isEnabled(clinicaId, featureKey)` + `getFeaturesForClinica()` — cache en memoria 5min TTL ✅
- [x] **FeatureFlagGuard global**: `@RequireFeature('whatsapp_agent')` decorator para proteger endpoints ✅
- [x] **Endpoint**: `GET /clinicas/me/features` retorna features del plan activo ✅
- [x] **Hook frontend**: `useFeatureFlag(key)` + `useFeatureFlags()` con Context Provider ✅
- [x] **UpgradePrompt + FeatureGate**: Componentes para mostrar CTA de upgrade o gate de contenido ✅
- [x] **Feature keys**: whatsapp_agent, whatsapp_reminders, multi_consultorio, advanced_reports, csv_export, custom_branding, api_access, audit_logs, priority_support, inventario, pagos, proveedores ✅
- [x] **PLAN_TEMPLATES**: 4 planes predefinidos (Avax Consultorio Std/Plus IA, Avax Clinica Std/Plus IA) ✅
- [x] **Seed endpoint**: `POST /admin/plans/seed-defaults` para crear planes predeterminados ✅

### Billing Híbrido
- [ ] **Base fija + consumo**: Plan mensual + extras por uso
- [ ] **Tabla `usage_records`**: clinica_id, metric, quantity, period_start, period_end
- [ ] **Ejemplos**: 200 WhatsApp/mes incluidos, después $0.05/msg; SMS a $0.10/msg
- [ ] **Cálculo de overage**: Al facturar, calcular excedente y agregar como línea a la factura

### Portal Self-Service
- [ ] **Upgrade/downgrade de plan**: Desde configuración de la clínica
- [ ] **Historial de facturación**: Con descarga de facturas PDF
- [ ] **Actualización de método de pago**: Integración con Mercado Pago
- [ ] **Gestión de usuarios**: Invitar, asignar roles, desactivar
- [ ] **API keys** (si el plan lo incluye): Generación y revocación
- [ ] **Preferencias de notificación**: Por canal y por tipo
- [ ] **Export de datos**: Descarga completa como ZIP
- [ ] **Solicitud de eliminación de cuenta**: Con período de retención de 30 días

### Multi-Sucursal
- [ ] **Modelo**: clinica (tenant) → sucursales (locations) → consultorios (rooms)
- [ ] **Cada sucursal**: Dirección propia, horarios, profesionales, slots de turnos
- [ ] **Base de pacientes compartida**: Across sucursales de la misma clínica

---

## Tablas de Base de Datos Necesarias

```sql
-- Billing & Subscriptions
billing_events (id, clinica_id, type, payload jsonb, created_at)
invoices (id, clinica_id, period_start, period_end, amount, status, pdf_url, created_at)
usage_records (id, clinica_id, metric, quantity, period_start, period_end)

-- Plans & Features
plan_features (id, plan_id, feature_key, enabled, limit_value)

-- Campos nuevos en clinica
-- clinica.subscription_status, clinica.grace_period_ends_at, clinica.next_billing_date

-- Notifications
notifications (id, clinica_id, user_id, type, title, body, read_at, created_at)
notification_preferences (id, clinica_id, notification_type, channels jsonb)

-- Security & Audit
audit_logs (id, clinica_id, user_id, action, entity_type, entity_id, old_values jsonb, new_values jsonb, ip_address, created_at)
user_sessions (id, user_id, token_hash, device_info, ip_address, last_active_at, created_at)
mfa_settings (id, user_id, totp_secret_encrypted, recovery_codes_hashed, enabled, created_at)

-- System
system_announcements (id, type, severity, title, message, starts_at, ends_at, created_at)
changelog_entries (id, version, title, body, published_at)

-- Onboarding
onboarding_progress (id, clinica_id, step_key, completed_at)
```

---

## Prioridades de Implementación

| Prioridad | Feature | Esfuerzo | Impacto |
|---|---|---|---|
| **P0** | Enforcement de suscripción (degradación gradual) | Medio | Crítico para monetizar |
| **P0** | ~~Feature gate service + límites por plan~~ | ✅ | Necesario pre-launch |
| **P1** | Dunning management (n8n + Mercado Pago webhooks) | Medio | Protección de revenue |
| **P1** | Onboarding checklist + emails de bienvenida | Bajo-Medio | Activación + retención |
| **P1** | Audit logs (interceptor global) | Bajo | Confianza + compliance |
| **P2** | Notificaciones in-app (SSE + Redis) | Medio | Engagement |
| **P2** | Health dashboard por tenant en admin | Medio | Visibilidad operativa |
| **P2** | Portal self-service de billing | Alto | Reduce soporte |
| **P3** | 2FA/MFA | Medio | Seguridad |
| **P3** | Metering de uso (WhatsApp/SMS) | Medio | Optimización de revenue |
| **P3** | Changelog / novedades | Bajo | Comunicación |
| **P4** | Predicción de churn | Medio | Retención long-term |
| **P4** | Multi-sucursal | Alto | Expansión de mercado |

---

*Última actualización: 2026-03-30*
