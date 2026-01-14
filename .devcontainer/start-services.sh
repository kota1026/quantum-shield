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
# Install Dependencies (if needed)
# ---------------------------------------------------------------------------
echo ""
echo "[2/3] Checking dependencies..."

# Install apps/web dependencies if missing
if [ -d "apps/web" ] && [ ! -d "apps/web/node_modules" ]; then
    echo "  Installing apps/web dependencies..."
    cd /workspace/apps/web
    pnpm install
    cd /workspace
fi

# ---------------------------------------------------------------------------
# Start Frontend Services (apps/web only - the correct implementation)
# ---------------------------------------------------------------------------
echo ""
echo "[3/3] Starting frontend services..."

# Create logs directory
mkdir -p /workspace/.devcontainer/logs

# Kill any existing processes on port 3000
fuser -k 3000/tcp 2>/dev/null || true

# Start apps/web (Next.js main - with i18n and shadcn/ui)
if [ -d "apps/web" ]; then
    echo "  Starting apps/web on port 3000..."
    cd /workspace/apps/web
    nohup pnpm dev > /workspace/.devcontainer/logs/web.log 2>&1 &
    echo "  ✓ apps/web started (PID: $!)"
    cd /workspace
fi

# Note: ui/apps/consumer is DEPRECATED - do not start
if [ -d "ui/apps/consumer" ]; then
    echo ""
    echo "  ⚠ Note: ui/apps/consumer is DEPRECATED"
    echo "    Use apps/web instead (with proper i18n support)"
fi

# Wait for servers to start
echo ""
echo "  Waiting for server to start..."
sleep 8

# ---------------------------------------------------------------------------
# Display Access Information
# ---------------------------------------------------------------------------
echo ""
echo "=============================================="
echo " Access URLs (in Codespaces)"
echo "=============================================="
echo ""
echo "  Main App:               Port 3000 → Click 'Open in Browser'"
echo ""
echo "  Consumer Pages:"
echo "    /ja/consumer/dashboard    - Dashboard"
echo "    /ja/consumer/lock         - Lock Assets"
echo "    /ja/consumer/unlock       - Unlock Assets"
echo "    /ja/consumer/history      - Transaction History"
echo "    /ja/consumer/key-management - Key Management"
echo "    /ja/consumer/settings     - Settings"
echo ""
echo "  RabbitMQ Management:    Port 15672 (quantum/quantum_dev)"
echo ""
echo "=============================================="
echo ""
echo "Commands:"
echo "  View logs:    tail -f .devcontainer/logs/web.log"
echo "  Stop:         pkill -f 'pnpm dev'"
echo "  Restart:      bash .devcontainer/start-services.sh"
echo ""
