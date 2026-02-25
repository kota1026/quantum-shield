#!/bin/bash
# Phase 0: Infrastructure Verification
# Layer Integration Framework v1.0

set -e

echo "=========================================="
echo "Phase 0: Infrastructure Verification"
echo "=========================================="
echo ""

PASS=true

# ===== Docker =====
echo "🔍 Checking Docker..."

if ! command -v docker &> /dev/null; then
  echo "  ❌ Docker command not found"
  PASS=false
else
  if docker ps 2>/dev/null | grep -q postgres; then
    echo "  ✅ PostgreSQL container running"
  else
    echo "  ❌ PostgreSQL container not running"
    echo "     Run: docker compose -f docker/docker-compose.dev.yml up -d"
    PASS=false
  fi

  if docker ps 2>/dev/null | grep -q redis; then
    echo "  ✅ Redis container running"
  else
    echo "  ⚠️ Redis container not running (optional)"
  fi
fi

echo ""

# ===== Backend =====
echo "🔍 Checking Backend..."

HEALTH=$(curl -s http://localhost:8080/v1/health 2>/dev/null || echo "")
if echo "$HEALTH" | grep -q "ok\|healthy"; then
  echo "  ✅ Backend healthy"
else
  echo "  ❌ Backend not responding"
  echo "     Run: cd services/api && cargo run"
  PASS=false
fi

echo ""

# ===== Frontend =====
echo "🔍 Checking Frontend..."

FRONTEND=$(curl -s http://localhost:3000 2>/dev/null | head -1 || echo "")
if echo "$FRONTEND" | grep -q "html\|DOCTYPE"; then
  echo "  ✅ Frontend running"
else
  echo "  ❌ Frontend not responding"
  echo "     Run: cd apps/web && pnpm dev"
  PASS=false
fi

echo ""

# ===== Database Connection =====
echo "🔍 Checking Database..."

if command -v psql &> /dev/null; then
  TABLE_COUNT=$(psql postgres://quantum:quantum_dev@localhost:5432/quantum_shield -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'" 2>/dev/null | tr -d ' ' || echo "0")
  if [ "$TABLE_COUNT" -gt 0 ]; then
    echo "  ✅ Database connected ($TABLE_COUNT tables)"
  else
    echo "  ⚠️ Database connected but no tables"
    echo "     Run: cd services/api && sqlx migrate run"
  fi
else
  echo "  ⚠️ psql not available, skipping direct DB check"
fi

echo ""

# ===== Summary =====
echo "=========================================="
if [ "$PASS" = true ]; then
  echo "✅ PHASE 0: INFRASTRUCTURE READY"
  echo ""
  echo "Next: レイヤー統合 Phase 1"
  exit 0
else
  echo "❌ PHASE 0: NOT READY"
  echo ""
  echo "Please fix the issues above and run again:"
  echo "  ./scripts/verify-infrastructure.sh"
  exit 1
fi
