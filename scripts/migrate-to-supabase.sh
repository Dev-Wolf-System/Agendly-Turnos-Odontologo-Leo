#!/bin/bash
# =============================================================================
# Script de migración: PostgreSQL self-hosted → Supabase PostgreSQL
# =============================================================================
# Uso: bash scripts/migrate-to-supabase.sh
#
# Prerequisitos:
#   - Ambos contenedores corriendo: postgreSQL (origen) y supabase-db (destino)
#   - Ambos en la misma red Docker o accesibles
# =============================================================================

set -euo pipefail

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}=== Migración PostgreSQL → Supabase ===${NC}"

# --- Config origen (PostgreSQL self-hosted) ---
SRC_CONTAINER="postgreSQL"
SRC_USER="avax_health"
SRC_DB="Avax_Health_BDs"

# --- Config destino (Supabase) ---
DST_CONTAINER="supabase-db"
DST_USER="postgres"
DST_DB="postgres"

DUMP_FILE="/tmp/avax_health_dump.sql"

# --- Paso 1: Verificar contenedores ---
echo -e "\n${YELLOW}[1/5] Verificando contenedores...${NC}"
if ! docker ps --format '{{.Names}}' | grep -q "^${SRC_CONTAINER}$"; then
    echo -e "${RED}ERROR: Contenedor '${SRC_CONTAINER}' no está corriendo${NC}"
    exit 1
fi
if ! docker ps --format '{{.Names}}' | grep -q "^${DST_CONTAINER}$"; then
    echo -e "${RED}ERROR: Contenedor '${DST_CONTAINER}' no está corriendo${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Ambos contenedores corriendo${NC}"

# --- Paso 2: Export desde origen ---
echo -e "\n${YELLOW}[2/5] Exportando base de datos desde ${SRC_CONTAINER}...${NC}"
docker exec "${SRC_CONTAINER}" pg_dump \
    -U "${SRC_USER}" \
    -d "${SRC_DB}" \
    --no-owner \
    --no-acl \
    --clean \
    --if-exists \
    --format=plain \
    > "${DUMP_FILE}"

DUMP_SIZE=$(du -h "${DUMP_FILE}" | cut -f1)
echo -e "${GREEN}✓ Dump creado: ${DUMP_FILE} (${DUMP_SIZE})${NC}"

# --- Paso 3: Verificar enums y tipos custom ---
echo -e "\n${YELLOW}[3/5] Verificando contenido del dump...${NC}"
ENUM_COUNT=$(grep -c "CREATE TYPE" "${DUMP_FILE}" || true)
TABLE_COUNT=$(grep -c "CREATE TABLE" "${DUMP_FILE}" || true)
echo "  - Enums/tipos: ${ENUM_COUNT}"
echo "  - Tablas: ${TABLE_COUNT}"

# --- Paso 4: Importar en Supabase ---
echo -e "\n${YELLOW}[4/5] Importando en Supabase (${DST_CONTAINER})...${NC}"
docker exec -i "${DST_CONTAINER}" psql \
    -U "${DST_USER}" \
    -d "${DST_DB}" \
    < "${DUMP_FILE}"

echo -e "${GREEN}✓ Importación completada${NC}"

# --- Paso 5: Verificar ---
echo -e "\n${YELLOW}[5/5] Verificando migración...${NC}"

echo "  Tablas en origen:"
docker exec "${SRC_CONTAINER}" psql -U "${SRC_USER}" -d "${SRC_DB}" -t -c \
    "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';"

echo "  Tablas en destino:"
docker exec "${DST_CONTAINER}" psql -U "${DST_USER}" -d "${DST_DB}" -t -c \
    "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';"

echo ""
echo "  Registros por tabla (destino):"
docker exec "${DST_CONTAINER}" psql -U "${DST_USER}" -d "${DST_DB}" -t -c \
    "SELECT schemaname || '.' || relname AS tabla, n_live_tup AS registros FROM pg_stat_user_tables ORDER BY n_live_tup DESC;"

# --- Limpiar ---
rm -f "${DUMP_FILE}"

echo -e "\n${GREEN}=== Migración completada ===${NC}"
echo -e "${YELLOW}Próximos pasos:${NC}"
echo "  1. Actualizar .env.production con las nuevas credenciales"
echo "  2. Reiniciar avax-backend: docker compose -f docker-compose.prod.yml up -d --build avax-backend"
echo "  3. Verificar que la app funcione correctamente"
echo "  4. (Opcional) Detener el contenedor PostgreSQL viejo: docker stop postgreSQL"
