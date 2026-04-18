-- Configuración de Mercado Pago por clínica
CREATE TABLE IF NOT EXISTS clinica_mp_configs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinica_id      UUID NOT NULL UNIQUE REFERENCES clinicas(id) ON DELETE CASCADE,
  access_token    TEXT NOT NULL,
  public_key      TEXT,
  webhook_url     TEXT,
  webhook_activo  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clinica_mp_clinica_id ON clinica_mp_configs (clinica_id);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_clinica_mp_updated_at
  BEFORE UPDATE ON clinica_mp_configs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
