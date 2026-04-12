-- Migración: Simplificar estados de suscripción de 7 a 4
-- Ejecutar en producción ANTES de desplegar el nuevo código
-- Fecha: 2026-04-12

-- trial → activa (el trial se detecta por trial_ends_at, no por estado)
UPDATE subscriptions SET estado = 'activa' WHERE estado = 'trial';

-- past_due → activa (pago pendiente pero con acceso completo)
UPDATE subscriptions SET estado = 'activa' WHERE estado = 'past_due';

-- gracia → vencida (acceso read-only, debe renovar)
UPDATE subscriptions SET estado = 'vencida' WHERE estado = 'gracia';

-- suspendida → inactiva (suspendida por admin)
UPDATE subscriptions SET estado = 'inactiva' WHERE estado = 'suspendida';

-- activa, cancelada, vencida → se mantienen igual
