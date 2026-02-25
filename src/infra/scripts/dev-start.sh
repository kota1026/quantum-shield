#!/usr/bin/env bash
# dev-start.sh — Start the full Quantum Shield development stack
# Usage: ./src/infra/scripts/dev-start.sh [--full]
#
# Starts:
# 1. Docker services (Postgres, Redis, RabbitMQ, L3 Anvil)
# 2. Runs DB migrations
# 3. Starts the Rust API server
# 4. Starts the Next.js frontend
#
# Options:
#   --full    Also start L1 Anvil node (Sepolia simulation)

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
API_DIR="$PROJECT_ROOT/src/api/api"
WEB_DIR="$PROJECT_ROOT/src/frontend/web"
COMPOSE_FILE="$PROJECT_ROOT/docker-compose.yml"
SCRIPTS_DIR="$PROJECT_ROOT/src/infra/scripts"

export DATABASE_URL="postgresql://quantum:quantum_dev@localhost:5432/quantum_shield"

PROFILE_FLAG=""
if [[ "${1:-}" == "--full" ]]; then
    PROFILE_FLAG="--profile full"
    echo "=== Full Stack Mode (including L1 Anvil) ==="
fi

echo "=== Quantum Shield Dev Start ==="
echo ""

# Step 1: Start Docker services
echo "[1/5] Starting Docker services..."
docker-compose -f "$COMPOSE_FILE" $PROFILE_FLAG up -d
echo "  Docker services started."

# Step 2: Wait for Postgres
echo "[2/5] Waiting for Postgres..."
RETRIES=30
until docker-compose -f "$COMPOSE_FILE" exec -T postgres pg_isready -U quantum -d quantum_shield > /dev/null 2>&1; do
    RETRIES=$((RETRIES - 1))
    if [ $RETRIES -le 0 ]; then
        echo "  ERROR: Postgres did not become ready"
        exit 1
    fi
    sleep 2
done
echo "  Postgres is ready."

# Step 3: Run migrations
echo "[3/5] Running DB migrations..."
cd "$API_DIR"
if command -v sqlx &> /dev/null; then
    sqlx migrate run 2>&1 | tail -5
else
    echo "  WARNING: sqlx-cli not installed. Applying migrations with psql..."
    for migration in migrations/*.sql; do
        echo "  Applying: $(basename "$migration")"
        docker-compose -f "$COMPOSE_FILE" exec -T postgres \
            psql -U quantum -d quantum_shield -f - < "$migration" 2>&1 | tail -1
    done
fi
echo "  Migrations complete."

# Step 4: Start Rust API
echo "[4/5] Starting Rust API (port 8080)..."
cd "$API_DIR"
if [ -f "target/debug/api-server" ]; then
    RUST_LOG=info target/debug/api-server &
    API_PID=$!
    echo "  API started (PID: $API_PID)"
else
    echo "  Building API first..."
    cargo build --release -p quantum-shield-api 2>&1 | tail -3
    RUST_LOG=info target/release/api-server &
    API_PID=$!
    echo "  API started (PID: $API_PID)"
fi

# Wait for API
sleep 3
if curl -s http://localhost:8080/v1/health > /dev/null 2>&1; then
    echo "  API is responding."
else
    echo "  WARNING: API not yet responding (may still be starting)."
fi

# Step 5: Start frontend
echo "[5/5] Starting Next.js frontend (port 3000)..."
cd "$WEB_DIR"
if [ ! -d "node_modules" ]; then
    echo "  Installing dependencies..."
    pnpm install 2>&1 | tail -3
fi
pnpm dev &
FE_PID=$!
echo "  Frontend started (PID: $FE_PID)"

echo ""
echo "=== Dev Stack Running ==="
echo "  Frontend:  http://localhost:3000"
echo "  API:       http://localhost:8080"
echo "  Postgres:  localhost:5432"
echo "  Redis:     localhost:6379"
echo "  RabbitMQ:  localhost:15672 (admin: quantum/quantum_dev)"
echo "  L3 Anvil:  http://localhost:8545"
if [[ "${1:-}" == "--full" ]]; then
    echo "  L1 Anvil:  http://localhost:8546"
fi
echo ""
echo "  To stop: docker-compose -f $COMPOSE_FILE down && kill $API_PID $FE_PID"
echo ""

# Wait for child processes
wait
