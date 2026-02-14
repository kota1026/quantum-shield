#!/bin/bash
set -e

echo "=============================================="
echo " Quantum Shield - Starting Services"
echo "=============================================="

cd /workspace

# Load environment variables
if [ -f ".env.local" ]; then
    set -a
    source .env.local
    set +a
fi

# ---------------------------------------------------------------------------
# Verify Infrastructure (started by Docker Compose depends_on)
# ---------------------------------------------------------------------------
echo ""
echo "[1/3] Checking infrastructure services..."

# PostgreSQL
for i in $(seq 1 15); do
    if pg_isready -h postgres -p 5432 -U quantum -q 2>/dev/null; then
        echo "  OK  PostgreSQL"
        break
    fi
    [ "$i" -eq 15 ] && echo "  ERR PostgreSQL (not ready)"
    sleep 1
done

# Redis
redis-cli -h redis ping > /dev/null 2>&1 && echo "  OK  Redis" || echo "  ERR Redis"

# RabbitMQ
curl -sf http://rabbitmq:15672 > /dev/null 2>&1 && echo "  OK  RabbitMQ" || echo "  ...  RabbitMQ (still starting)"

# ---------------------------------------------------------------------------
# Start Rust API Server
# ---------------------------------------------------------------------------
echo ""
echo "[2/3] Starting Rust API server..."

mkdir -p /workspace/.devcontainer/logs

# Kill any existing API server
pkill -f 'api-server' 2>/dev/null || true
sleep 1

if [ -f "/workspace/target/debug/api-server" ]; then
    cd /workspace/services/api
    nohup ../../target/debug/api-server > /workspace/.devcontainer/logs/api.log 2>&1 &
    API_PID=$!
    echo "  Started api-server (PID: $API_PID)"
    cd /workspace

    # Wait for API to be ready
    for i in $(seq 1 15); do
        if curl -sf http://localhost:8080/v1/health > /dev/null 2>&1; then
            echo "  OK  API server is ready"
            break
        fi
        [ "$i" -eq 15 ] && echo "  WARN API not responding yet (check logs: .devcontainer/logs/api.log)"
        sleep 1
    done
else
    echo "  SKIP api-server binary not found"
    echo "        Run: cargo build -p quantum-shield-api"
fi

# ---------------------------------------------------------------------------
# Start Frontend (Next.js)
# ---------------------------------------------------------------------------
echo ""
echo "[3/3] Starting Next.js frontend..."

# Kill any existing frontend
fuser -k 3000/tcp 2>/dev/null || true
sleep 1

if [ -d "apps/web" ] && [ -d "apps/web/node_modules" ]; then
    cd /workspace/apps/web
    nohup npm run dev > /workspace/.devcontainer/logs/web.log 2>&1 &
    WEB_PID=$!
    echo "  Started Next.js (PID: $WEB_PID)"
    cd /workspace
else
    echo "  SKIP apps/web not ready (run: cd apps/web && npm install)"
fi

# Wait for frontend to start
sleep 5

# ---------------------------------------------------------------------------
# Status Summary
# ---------------------------------------------------------------------------
echo ""
echo "=============================================="
echo " Services Running"
echo "=============================================="
echo ""
echo "  Frontend:     http://localhost:3000"
echo "  API Server:   http://localhost:8080"
echo "  RabbitMQ UI:  http://localhost:15672  (quantum / quantum_dev)"
echo ""
echo "  App URLs:"
echo "    /ja/consumer/dashboard    Consumer Dashboard"
echo "    /ja/consumer/lock         Lock Assets"
echo "    /ja/prover/dashboard      Prover Dashboard"
echo "    /ja/observer/dashboard    Observer Dashboard"
echo "    /ja/explorer              Explorer"
echo "    /ja/qs-admin/login        QS Admin"
echo ""
echo "  Logs:"
echo "    API:      tail -f .devcontainer/logs/api.log"
echo "    Frontend: tail -f .devcontainer/logs/web.log"
echo ""
