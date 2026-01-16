#!/bin/bash
set -e

echo "=============================================="
echo " Quantum Shield - Development Setup"
echo "=============================================="

cd /workspace

# ---------------------------------------------------------------------------
# Node.js Setup
# ---------------------------------------------------------------------------
echo ""
echo "[1/4] Setting up Node.js dependencies..."

# Install pnpm
npm install -g pnpm

# Install frontend dependencies
if [ -f "package.json" ]; then
    pnpm install
fi

# Install apps/web dependencies
if [ -f "apps/web/package.json" ]; then
    cd apps/web && pnpm install && cd /workspace
fi

# Install ui/apps/consumer dependencies
if [ -f "ui/apps/consumer/package.json" ]; then
    cd ui/apps/consumer && pnpm install && cd /workspace
fi

# ---------------------------------------------------------------------------
# Rust Setup
# ---------------------------------------------------------------------------
echo ""
echo "[2/4] Setting up Rust toolchain..."

# Update Rust
rustup update stable
rustup default stable

# Add components
rustup component add clippy rustfmt

# ---------------------------------------------------------------------------
# Environment Setup
# ---------------------------------------------------------------------------
echo ""
echo "[3/4] Setting up environment variables..."

# Create .env.local if not exists
if [ ! -f ".env.local" ]; then
    cat > .env.local << 'EOF'
# Quantum Shield Development Environment
# Configure these values for your setup

# Database (pre-configured for Codespaces)
DATABASE_URL=postgres://quantum:quantum_dev@localhost:5432/quantum_shield

# Redis (pre-configured for Codespaces)
REDIS_URL=redis://localhost:6379

# RabbitMQ (pre-configured for Codespaces)
RABBITMQ_URL=amqp://quantum:quantum_dev@localhost:5672

# Blockchain - Configure your Sepolia RPC
L1_RPC_URL=https://rpc.sepolia.org
L3_RPC_URL=http://localhost:8545

# JWT Secret (development only)
JWT_SECRET=dev-secret-change-in-production

# Logging
RUST_LOG=debug
NODE_ENV=development
EOF
    echo "Created .env.local with default values"
fi

# ---------------------------------------------------------------------------
# Verification
# ---------------------------------------------------------------------------
echo ""
echo "[4/4] Verifying installations..."

echo "Node.js: $(node --version)"
echo "pnpm: $(pnpm --version)"
echo "Rust: $(rustc --version)"
echo "Cargo: $(cargo --version)"

echo ""
echo "=============================================="
echo " Setup Complete!"
echo "=============================================="
echo ""
echo "Next steps:"
echo "  1. Run 'bash .devcontainer/start-services.sh' to start the frontend"
echo "  2. Click on the port 3000 link in VS Code to open the UI"
echo "  3. For Sepolia, update L1_RPC_URL in .env.local with your RPC endpoint"
echo ""
