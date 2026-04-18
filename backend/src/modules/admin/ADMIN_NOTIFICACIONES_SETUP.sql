-- Tabla para notificaciones del panel superadmin
CREATE TABLE IF NOT EXISTS admin_notificaciones (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo        TEXT NOT NULL,
  titulo      TEXT NOT NULL,
  mensaje     TEXT NOT NULL,
  leida       BOOLEAN NOT NULL DEFAULT FALSE,
  metadata    JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_notif_leida ON admin_notificaciones (leida);
CREATE INDEX IF NOT EXISTS idx_admin_notif_created_at ON admin_notificaciones (created_at DESC);

-- Agregar a publicación Supabase Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE admin_notificaciones;
