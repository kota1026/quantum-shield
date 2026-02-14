#!/bin/bash
set -e

echo "=============================================="
echo " Quantum Shield - Development Setup"
echo "=============================================="

cd /workspace

# ---------------------------------------------------------------------------
# System Dependencies
# ---------------------------------------------------------------------------
echo ""
echo "[1/6] Installing system dependencies..."

sudo apt-get update -qq
sudo apt-get install -y -qq pkg-config libssl-dev postgresql-client > /dev/null 2>&1
echo "  Done"

# ---------------------------------------------------------------------------
# Node.js Setup
# ---------------------------------------------------------------------------
echo ""
echo "[2/6] Setting up Node.js dependencies..."

# Install root dependencies
if [ -f "package.json" ]; then
    npm install --silent 2>/dev/null || npm install
fi

# Install apps/web dependencies
if [ -f "apps/web/package.json" ]; then
    cd apps/web && npm install --silent 2>/dev/null || npm install
    cd /workspace
fi

# ---------------------------------------------------------------------------
# Rust Setup
# ---------------------------------------------------------------------------
echo ""
echo "[3/6] Setting up Rust toolchain..."

rustup update stable --no-self-update 2>/dev/null
rustup default stable
rustup component add clippy rustfmt

# Install sqlx-cli for database migrations
echo "  Installing sqlx-cli..."
cargo install sqlx-cli --no-default-features --features rustls,postgres 2>/dev/null || {
    echo "  sqlx-cli already installed or install failed, continuing..."
}

# ---------------------------------------------------------------------------
# Environment Setup
# ---------------------------------------------------------------------------
echo ""
echo "[4/6] Setting up environment variables..."

# Root .env.local (for scripts that source it)
if [ ! -f ".env.local" ]; then
    cat > .env.local << 'EOF'
# Quantum Shield Development Environment (Codespaces)
# Service hostnames resolve via Docker Compose network

DATABASE_URL=postgres://quantum:quantum_dev@postgres:5432/quantum_shield
REDIS_URL=redis://redis:6379
RABBITMQ_URL=amqp://quantum:quantum_dev@rabbitmq:5672

L1_RPC_URL=https://rpc.sepolia.org
L3_RPC_URL=http://localhost:8545

JWT_SECRET=dev-secret-change-in-production
RUST_LOG=info,quantum_shield_api=debug
NODE_ENV=development
EOF
    echo "  Created .env.local"
fi

# services/api/.env (Rust API reads this via dotenvy)
if [ ! -f "services/api/.env" ]; then
    cat > services/api/.env << 'EOF'
DATABASE_URL=postgres://quantum:quantum_dev@postgres:5432/quantum_shield
REDIS_URL=redis://redis:6379
RABBITMQ_URL=amqp://quantum:quantum_dev@rabbitmq:5672
JWT_SECRET=dev-secret-change-in-production
RUST_LOG=info,quantum_shield_api=debug
EOF
    echo "  Created services/api/.env"
fi

# apps/web/.env.local (Next.js reads this)
if [ ! -f "apps/web/.env.local" ]; then
    cat > apps/web/.env.local << 'EOF'
# Quantum Shield Web - Codespaces Configuration
NEXT_PUBLIC_ENABLE_MOCK=false
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=placeholder-dev-id
EOF
    echo "  Created apps/web/.env.local"
fi

# ---------------------------------------------------------------------------
# Database Migrations
# ---------------------------------------------------------------------------
echo ""
echo "[5/6] Running database migrations..."

# Wait for PostgreSQL to be ready
echo "  Waiting for PostgreSQL..."
for i in $(seq 1 30); do
    if pg_isready -h postgres -p 5432 -U quantum -q 2>/dev/null; then
        echo "  PostgreSQL is ready"
        break
    fi
    if [ "$i" -eq 30 ]; then
        echo "  WARNING: PostgreSQL not ready after 30s, skipping migrations"
        echo "  Run manually: cd services/api && sqlx migrate run"
    fi
    sleep 1
done

# Run migrations
if pg_isready -h postgres -p 5432 -U quantum -q 2>/dev/null; then
    cd /workspace/services/api
    DATABASE_URL="postgres://quantum:quantum_dev@postgres:5432/quantum_shield" sqlx migrate run
    echo "  Migrations applied successfully"
    cd /workspace
fi

# ---------------------------------------------------------------------------
# Rust API Build
# ---------------------------------------------------------------------------
echo ""
echo "[6/6] Building Rust API server (this may take 10-15 minutes on first run)..."

cargo build -p quantum-shield-api 2>&1 | tail -5
echo "  Build complete"

# ---------------------------------------------------------------------------
# Verification
# ---------------------------------------------------------------------------
echo ""
echo "=============================================="
echo " Setup Complete!"
echo "=============================================="
echo ""
echo "  Node.js: $(node --version)"
echo "  Rust:    $(rustc --version)"
echo "  Cargo:   $(cargo --version)"
echo "  sqlx:    $(sqlx --version 2>/dev/null || echo 'not found')"
echo ""
echo "Services will start automatically via postStartCommand."
echo "Or run manually: bash .devcontainer/start-services.sh"
echo ""
