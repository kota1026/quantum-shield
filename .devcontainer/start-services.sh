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
# Check Infrastructure Services
# ---------------------------------------------------------------------------
echo ""
echo "[1/3] Checking infrastructure services..."

# Check PostgreSQL
if pg_isready -h localhost -p 5432 -U quantum > /dev/null 2>&1; then
    echo "  ✓ PostgreSQL is running"
else
    echo "  ✗ PostgreSQL is not running"
    echo "    Run: docker compose -f docker/docker-compose.dev.yml up -d postgres"
fi

# Check Redis
if redis-cli -h localhost ping > /dev/null 2>&1; then
    echo "  ✓ Redis is running"
else
    echo "  ✗ Redis is not running"
    echo "    Run: docker compose -f docker/docker-compose.dev.yml up -d redis"
fi

# Check RabbitMQ
if curl -s http://localhost:15672 > /dev/null 2>&1; then
    echo "  ✓ RabbitMQ is running"
else
    echo "  ✗ RabbitMQ is not running"
    echo "    Run: docker compose -f docker/docker-compose.dev.yml up -d rabbitmq"
fi

# ---------------------------------------------------------------------------
# Start Frontend Services
# ---------------------------------------------------------------------------
echo ""
echo "[2/3] Starting frontend services..."

# Create a tmux session for services
if command -v tmux &> /dev/null; then
    # Kill existing session if exists
    tmux kill-session -t qs-dev 2>/dev/null || true

    # Create new session
    tmux new-session -d -s qs-dev -n main

    # Start Next.js (apps/web)
    if [ -d "apps/web" ]; then
        tmux send-keys -t qs-dev:main "cd /workspace/apps/web && pnpm dev" Enter
        echo "  ✓ Started apps/web (Next.js) on port 3000"
    fi

    # Create new window for consumer app
    if [ -d "ui/apps/consumer" ]; then
        tmux new-window -t qs-dev -n consumer
        tmux send-keys -t qs-dev:consumer "cd /workspace/ui/apps/consumer && pnpm dev --port 3001" Enter
        echo "  ✓ Started ui/apps/consumer on port 3001"
    fi

    echo ""
    echo "  Tip: Use 'tmux attach -t qs-dev' to see logs"
else
    echo "  Starting in foreground mode (tmux not available)..."
    echo "  Run manually:"
    echo "    cd apps/web && pnpm dev"
    echo "    cd ui/apps/consumer && pnpm dev --port 3001"
fi

# ---------------------------------------------------------------------------
# Display Access Information
# ---------------------------------------------------------------------------
echo ""
echo "[3/3] Services started!"
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
echo "  View logs:        tmux attach -t qs-dev"
echo "  Stop services:    tmux kill-session -t qs-dev"
echo "  Restart:          bash .devcontainer/start-services.sh"
echo ""
