#!/bin/bash
# =============================================================================
# Step 7.2: L3-Aegis Docker Verification
# Layer Integration Framework - True Integration Phase
# =============================================================================

set -e

echo "=========================================="
echo "Step 7.2: L3-Aegis Docker Verification"
echo "=========================================="
echo ""

PASS=true
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# ===== Check Docker =====
echo "🔍 Checking Docker availability..."

if ! command -v docker &> /dev/null; then
  echo "  ❌ Docker command not found"
  echo "     Please install Docker Desktop"
  PASS=false
else
  echo "  ✅ Docker available"
fi

echo ""

# ===== Check L3-Aegis Docker Compose =====
echo "🔍 Checking L3-Aegis docker-compose.yml..."

COMPOSE_FILE="$REPO_ROOT/l3-aegis/docker/docker-compose.yml"
if [ -f "$COMPOSE_FILE" ]; then
  echo "  ✅ docker-compose.yml found"
else
  echo "  ❌ docker-compose.yml not found at $COMPOSE_FILE"
  PASS=false
fi

echo ""

# ===== Check Node Configs =====
echo "🔍 Checking node configurations..."

CONFIG_DIR="$REPO_ROOT/l3-aegis/docker/config"
for i in 0 1 2 3; do
  if [ -f "$CONFIG_DIR/node$i.toml" ]; then
    echo "  ✅ node$i.toml exists"
  else
    echo "  ❌ node$i.toml missing"
    PASS=false
  fi
done

echo ""

# ===== Check Dilithium Keys =====
echo "🔍 Checking Dilithium keys..."

KEYS_DIR="$REPO_ROOT/l3-aegis/docker/keys"
for i in 0 1 2 3; do
  if [ -f "$KEYS_DIR/node$i/dilithium.key" ] && [ -f "$KEYS_DIR/node$i/dilithium.pub" ]; then
    echo "  ✅ node$i keys exist"
  else
    echo "  ⚠️ node$i keys missing (may need to generate)"
  fi
done

echo ""

# ===== Check if L3 containers running =====
echo "🔍 Checking L3-Aegis containers..."

if docker ps 2>/dev/null | grep -q "aegis-node"; then
  NODE_COUNT=$(docker ps 2>/dev/null | grep -c "aegis-node" || echo "0")
  echo "  ✅ L3-Aegis running ($NODE_COUNT nodes)"

  # Check Node 0 RPC
  echo ""
  echo "🔍 Checking L3 Node 0 RPC (port 8545)..."

  L3_RESPONSE=$(curl -s -X POST http://localhost:8545 \
    -H "Content-Type: application/json" \
    -d '{"jsonrpc":"2.0","method":"aegis_status","params":[],"id":1}' 2>/dev/null || echo "")

  if echo "$L3_RESPONSE" | grep -q "result"; then
    echo "  ✅ L3 RPC responding"
    echo "     Response: $L3_RESPONSE"
  else
    echo "  ⚠️ L3 RPC not responding yet (may be starting)"
  fi
else
  echo "  ⚠️ L3-Aegis containers not running"
  echo ""
  echo "  To start L3-Aegis:"
  echo "    cd l3-aegis/docker"
  echo "    docker compose up -d"
  echo ""
  echo "  Or build and start:"
  echo "    docker compose up -d --build"
fi

echo ""

# ===== Check API L3 Configuration =====
echo "🔍 Checking API L3 configuration..."

if [ -f "$REPO_ROOT/services/api/src/config.rs" ]; then
  if grep -q "l3_endpoint" "$REPO_ROOT/services/api/src/config.rs"; then
    echo "  ✅ l3_endpoint config field exists"
  else
    echo "  ❌ l3_endpoint config field missing"
    PASS=false
  fi
fi

# Check environment variable
if [ -n "$L3_RPC_URL" ]; then
  echo "  ✅ L3_RPC_URL set: $L3_RPC_URL"
else
  echo "  ⚠️ L3_RPC_URL not set"
  echo "     Set: export L3_RPC_URL=http://localhost:8545"
fi

echo ""

# ===== Summary =====
echo "=========================================="
if [ "$PASS" = true ]; then
  echo "✅ L3-AEGIS: CONFIGURATION READY"
  echo ""
  echo "To start L3-Aegis 4-node BFT testnet:"
  echo "  cd l3-aegis/docker"
  echo "  docker compose up -d"
  echo ""
  echo "To verify L3 is running:"
  echo "  curl -X POST http://localhost:8545 \\"
  echo "    -H 'Content-Type: application/json' \\"
  echo "    -d '{\"jsonrpc\":\"2.0\",\"method\":\"aegis_status\",\"params\":[],\"id\":1}'"
  echo ""
  echo "Environment variables for API:"
  echo "  export L3_RPC_URL=http://localhost:8545"
  echo "  export L3_CHAIN_ID=31337"
  exit 0
else
  echo "❌ L3-AEGIS: NOT READY"
  echo ""
  echo "Please fix the issues above and run again:"
  echo "  ./scripts/verify-l3-aegis.sh"
  exit 1
fi
