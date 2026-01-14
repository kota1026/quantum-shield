#!/bin/bash
set -e

echo "=============================================="
echo " Quantum Shield - Starting Services"
echo "=============================================="

cd /workspace

# Load environment variables
if [ -f ".env.local" ]; then
    export $(grep -v '^#' .env.local | xargs)
fi

# ---------------------------------------------------------------------------
# Start Infrastructure Services (Auto-start if not running)
# ---------------------------------------------------------------------------
echo ""
echo "[1/3] Starting infrastructure services..."

# Check if docker compose file exists
if [ -f "docker/docker-compose.dev.yml" ]; then
    echo "  Starting PostgreSQL, Redis, RabbitMQ..."
    docker compose -f docker/docker-compose.dev.yml up -d postgres redis rabbitmq 2>/dev/null || {
        echo "  ⚠ Docker Compose failed. Trying alternative..."
        docker-compose -f docker/docker-compose.dev.yml up -d postgres redis rabbitmq 2>/dev/null || {
            echo "  ✗ Could not start infrastructure services"
            echo "    Please run manually: docker compose -f docker/docker-compose.dev.yml up -d"
        }
    }

    # Wait for services to be ready
    echo "  Waiting for services to be ready..."
    sleep 5
fi

# Verify services
echo ""
echo "  Service Status:"
pg_isready -h localhost -p 5432 -U quantum > /dev/null 2>&1 && echo "  ✓ PostgreSQL" || echo "  ✗ PostgreSQL"
redis-cli -h localhost ping > /dev/null 2>&1 && echo "  ✓ Redis" || echo "  ✗ Redis"
curl -s http://localhost:15672 > /dev/null 2>&1 && echo "  ✓ RabbitMQ" || echo "  ○ RabbitMQ (starting...)"

# ---------------------------------------------------------------------------
# Start Frontend Services
# ---------------------------------------------------------------------------
echo ""
echo "[2/3] Starting frontend services..."

# Create logs directory
mkdir -p /workspace/.devcontainer/logs

# Kill any existing processes on ports 3000 and 3001
fuser -k 3000/tcp 2>/dev/null || true
fuser -k 3001/tcp 2>/dev/null || true

# Start apps/web (Next.js main)
if [ -d "apps/web" ]; then
    echo "  Starting apps/web on port 3000..."
    cd /workspace/apps/web
    nohup pnpm dev > /workspace/.devcontainer/logs/web.log 2>&1 &
    echo "  ✓ apps/web started (PID: $!)"
    cd /workspace
fi

# Start ui/apps/consumer
if [ -d "ui/apps/consumer" ]; then
    echo "  Starting consumer app on port 3001..."
    cd /workspace/ui/apps/consumer
    nohup pnpm dev --port 3001 > /workspace/.devcontainer/logs/consumer.log 2>&1 &
    echo "  ✓ consumer app started (PID: $!)"
    cd /workspace
fi

# Wait for servers to start
echo ""
echo "  Waiting for servers to start..."
sleep 8

# ---------------------------------------------------------------------------
# Display Access Information
# ---------------------------------------------------------------------------
echo ""
echo "[3/3] Services ready!"
echo ""
echo "=============================================="
echo " Access URLs (in Codespaces)"
echo "=============================================="
echo ""
echo "  Frontend (Next.js):     Port 3000 → Click 'Open in Browser'"
echo "  Consumer App:           Port 3001 → Click 'Open in Browser'"
echo "  RabbitMQ Management:    Port 15672 (quantum/quantum_dev)"
echo ""
echo "=============================================="
echo ""
echo "Commands:"
echo "  View web logs:      tail -f .devcontainer/logs/web.log"
echo "  View consumer logs: tail -f .devcontainer/logs/consumer.log"
echo "  Stop all:           pkill -f 'pnpm dev'"
echo "  Restart:            bash .devcontainer/start-services.sh"
echo ""
