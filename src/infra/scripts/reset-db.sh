#!/usr/bin/env bash
# reset-db.sh — Destroy and rebuild the Quantum Shield database from scratch
# Usage: ./src/infra/scripts/reset-db.sh
#
# This script:
# 1. Stops and removes the postgres container + volume
# 2. Starts fresh postgres
# 3. Waits for it to be ready
# 4. Runs all sqlx migrations (001-013)
#
# Prerequisites:
# - Docker + docker-compose installed
# - sqlx-cli installed (cargo install sqlx-cli --features postgres)

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
API_DIR="$PROJECT_ROOT/src/api/api"
COMPOSE_FILE="$PROJECT_ROOT/docker-compose.yml"

# Database connection
export DATABASE_URL="postgresql://quantum:quantum_dev@localhost:5432/quantum_shield"

echo "=== Quantum Shield DB Reset ==="
echo "Project root: $PROJECT_ROOT"
echo ""

# Step 1: Tear down postgres
echo "[1/4] Stopping postgres and removing data..."
docker-compose -f "$COMPOSE_FILE" stop postgres 2>/dev/null || true
docker-compose -f "$COMPOSE_FILE" rm -f -v postgres 2>/dev/null || true
docker volume rm quantum-shield_postgres_data 2>/dev/null || true
echo "  Done."

# Step 2: Start fresh postgres
echo "[2/4] Starting fresh postgres..."
docker-compose -f "$COMPOSE_FILE" up -d postgres
echo "  Container started."

# Step 3: Wait for postgres to be ready
echo "[3/4] Waiting for postgres to be ready..."
RETRIES=30
until docker-compose -f "$COMPOSE_FILE" exec -T postgres pg_isready -U quantum -d quantum_shield > /dev/null 2>&1; do
    RETRIES=$((RETRIES - 1))
    if [ $RETRIES -le 0 ]; then
        echo "  ERROR: postgres did not become ready in time"
        exit 1
    fi
    echo "  Waiting... ($RETRIES retries left)"
    sleep 2
done
echo "  Postgres is ready."

# Step 4: Run all migrations
echo "[4/4] Running sqlx migrations..."
cd "$API_DIR"

if command -v sqlx &> /dev/null; then
    sqlx migrate run
    echo ""
    echo "=== Migration Status ==="
    sqlx migrate info
else
    echo "  WARNING: sqlx-cli not installed. Applying migrations manually with psql..."
    for migration in migrations/*.sql; do
        echo "  Applying: $(basename "$migration")"
        docker-compose -f "$COMPOSE_FILE" exec -T postgres \
            psql -U quantum -d quantum_shield -f - < "$migration"
    done
    echo "  Done (manual mode — migrations not tracked in _sqlx_migrations)."
fi

echo ""
echo "=== DB Reset Complete ==="
echo "Connection: $DATABASE_URL"
echo ""

# Quick verification
echo "=== Table Count ==="
docker-compose -f "$COMPOSE_FILE" exec -T postgres \
    psql -U quantum -d quantum_shield -t -c \
    "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';"
echo "tables in public schema"
