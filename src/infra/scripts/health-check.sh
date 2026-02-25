#!/usr/bin/env bash
# health-check.sh — Check health of all Quantum Shield services
# Usage: ./src/infra/scripts/health-check.sh
#
# Checks: Postgres, Redis, RabbitMQ, L3 Anvil, Rust API, Frontend

set -uo pipefail

PASS=0
FAIL=0
WARN=0

check() {
    local name="$1"
    local cmd="$2"
    local required="${3:-true}"

    if eval "$cmd" > /dev/null 2>&1; then
        echo "  [OK]   $name"
        PASS=$((PASS + 1))
    elif [ "$required" = "true" ]; then
        echo "  [FAIL] $name"
        FAIL=$((FAIL + 1))
    else
        echo "  [WARN] $name (optional)"
        WARN=$((WARN + 1))
    fi
}

echo "=== Quantum Shield Health Check ==="
echo ""

# Infrastructure
echo "Infrastructure:"
check "PostgreSQL" "pg_isready -h localhost -p 5432 -U quantum 2>/dev/null || docker exec qs-postgres pg_isready -U quantum"
check "Redis" "redis-cli -h localhost -p 6379 ping 2>/dev/null | grep -q PONG || docker exec qs-redis redis-cli ping 2>/dev/null | grep -q PONG"
check "RabbitMQ" "curl -sf http://quantum:quantum_dev@localhost:15672/api/overview > /dev/null" "false"
check "L3 Anvil" "curl -sf -X POST -H 'Content-Type: application/json' -d '{\"jsonrpc\":\"2.0\",\"method\":\"eth_chainId\",\"params\":[],\"id\":1}' http://localhost:8545 > /dev/null" "false"
echo ""

# Backend
echo "Backend:"
check "API /v1/health" "curl -sf http://localhost:8080/v1/health > /dev/null"
check "API /v1/status" "curl -sf http://localhost:8080/v1/status > /dev/null" "false"
echo ""

# Frontend
echo "Frontend:"
check "Next.js (port 3000)" "curl -sf http://localhost:3000 > /dev/null" "false"
echo ""

# L1 (optional, only with --full)
echo "L1 (optional):"
check "L1 Anvil" "curl -sf -X POST -H 'Content-Type: application/json' -d '{\"jsonrpc\":\"2.0\",\"method\":\"eth_chainId\",\"params\":[],\"id\":1}' http://localhost:8546 > /dev/null" "false"
echo ""

# Summary
echo "=== Summary ==="
echo "  Passed:   $PASS"
echo "  Failed:   $FAIL"
echo "  Warnings: $WARN"
echo ""

if [ $FAIL -gt 0 ]; then
    echo "  STATUS: UNHEALTHY ($FAIL required services down)"
    exit 1
else
    echo "  STATUS: HEALTHY"
    exit 0
fi
