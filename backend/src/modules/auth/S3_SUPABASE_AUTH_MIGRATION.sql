-- ============================================================
-- S3 Supabase Auth — SQL a ejecutar en Supabase SQL Editor
-- https://supabase.avaxhealth.com → SQL Editor
-- ============================================================

-- 1. Agregar columna supabase_uid a la tabla users
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS supabase_uid uuid;

CREATE UNIQUE INDEX IF NOT EXISTS users_supabase_uid_idx
  ON users (supabase_uid)
  WHERE supabase_uid IS NOT NULL;

-- ============================================================
-- DESPUÉS del despliegue, migrar usuarios existentes:
--
-- 1. Iniciar sesión como SUPERADMIN en el panel admin
-- 2. Hacer POST a /api/auth/admin/migrate-users con el token
--    Esto crea cuentas Supabase para cada usuario sin supabase_uid
--    y devuelve links de reset de contraseña para cada uno
-- ============================================================
