#!/usr/bin/env bash
# =============================================================================
# Quantum Shield - Phase 1 Manual Lock E2E Verification
# =============================================================================
# Drives ONE real Sepolia lock through the full FE→BE→DB→L1 path without
# the orchestrator (= no Anthropic API, no AI-driven verdict). Verdict is
# deterministic: tx_hash exists in DB AND cast receipt confirms tx mined.
#
# What it does:
#   1. Starts Docker compose services (postgres, redis)
#   2. Runs sqlx migrations
#   3. Builds api-server (--release to mirror CI)
#   4. Boots api-server with RUN_MODE=testnet_beta + the provided
#      DEPLOYER_PRIVATE_KEY pointing at Sepolia Vault 0x07012aeF…7260
#   5. POST /v1/lock with a small (0.0001 ETH) test payload
#   6. Reads back l1_tx_hash from response and DB
#   7. cast receipt against publicnode → confirms 0x1 status
#   8. Prints Etherscan URL — that URL is the Phase 1 ground-truth artifact.
#
# Usage:
#   DEPLOYER_PRIVATE_KEY=<64hex> ./scripts/phase1-manual-verify.sh
#
# Cost:
#   - 0.0001 ETH lock + ~0.0005 ETH gas. Sepolia faucet ETH, no real value.
#   - 0 Anthropic tokens.
#
# Requirements (must be installed locally):
#   - docker compose
#   - rustup / cargo
#   - sqlx-cli (cargo install sqlx-cli --no-default-features --features postgres,rustls)
#   - foundry (cast)
#   - jq, psql, curl
# =============================================================================
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

# ---- guard rails -----------------------------------------------------------
if [ -z "${DEPLOYER_PRIVATE_KEY:-}" ]; then
  echo "ERROR: DEPLOYER_PRIVATE_KEY env var required (64 hex chars, no 0x prefix)"
  echo "Usage: DEPLOYER_PRIVATE_KEY=<hex> $0"
  exit 1
fi
if [ "${#DEPLOYER_PRIVATE_KEY}" -ne 64 ]; then
  echo "ERROR: DEPLOYER_PRIVATE_KEY must be exactly 64 hex chars (got ${#DEPLOYER_PRIVATE_KEY})"
  exit 1
fi
for cmd in docker cargo cast jq psql curl sqlx; do
  command -v "$cmd" >/dev/null 2>&1 || { echo "ERROR: missing required tool: $cmd"; exit 1; }
done

VAULT="0x07012aeF87C6E423c32F2f8eaF81762f63337260"
RPC="https://ethereum-sepolia-rpc.publicnode.com"
DATABASE_URL="postgresql://quantum:quantum_dev@localhost:5432/quantum_shield"
DEST_ADDR="0x000000000000000000000000000000000000dEaD"
AMOUNT_WEI="100000000000000"  # 0.0001 ETH
NOW_S=$(date +%s)
EXPIRY=$((NOW_S + 3600))
NONCE=$((NOW_S * 1000))

# ---- Step 1: docker services ----------------------------------------------
echo "▸ Step 1: starting docker services (postgres, redis)..."
docker compose up -d postgres redis >/dev/null
echo "  waiting for postgres..."
for i in $(seq 1 30); do
  if docker compose exec -T postgres pg_isready -U quantum >/dev/null 2>&1; then
    echo "  postgres ready"
    break
  fi
  sleep 1
done

# ---- Step 2: migrations ---------------------------------------------------
echo "▸ Step 2: running sqlx migrations..."
(cd src/api/api && DATABASE_URL="$DATABASE_URL" sqlx migrate run >/dev/null)

# ---- Step 3: build api-server --------------------------------------------
echo "▸ Step 3: building api-server (release)..."
(cd src/api/api && SQLX_OFFLINE=true cargo build --bin api-server --release 2>&1 | tail -3)

# ---- Step 4: boot api-server with full Sepolia config ---------------------
LOG="$REPO_ROOT/scripts/.phase1-manual-verify.api-server.log"
PID_FILE="$REPO_ROOT/scripts/.phase1-manual-verify.pid"
rm -f "$LOG"
echo "▸ Step 4: booting api-server (log: $LOG)..."

# RUN_MODE=testnet_beta is the explicit acknowledgement that
# skip_signature_verification=true is acceptable on Sepolia for this manual
# test. Without it, config.rs's enforce_production_guards panics at startup.
QS__DATABASE__URL="$DATABASE_URL" \
QS__L1_PRIVATE_KEY="$DEPLOYER_PRIVATE_KEY" \
QS__L1_RPC_URL="$RPC" \
QS__L1_VAULT_ADDRESS="$VAULT" \
QS__SECURITY__SKIP_SIGNATURE_VERIFICATION=true \
QS__SECURITY__SKIP_TOTP_VERIFICATION=true \
RUN_MODE=testnet_beta \
RUST_LOG=quantum_shield_api=info,tower_http=warn \
nohup target/release/api-server >"$LOG" 2>&1 &
echo $! >"$PID_FILE"
trap 'kill "$(cat "$PID_FILE" 2>/dev/null)" 2>/dev/null || true' EXIT

echo "  waiting for /v1/health..."
for i in $(seq 1 60); do
  if curl -sf http://localhost:8080/v1/health >/dev/null 2>&1; then
    echo "  api-server ready"
    break
  fi
  sleep 1
done

# Confirm L1 vault initialized (the whole point of this exercise)
if ! grep -q "AppState initialized. l1_vault present: true" "$LOG"; then
  echo "ERROR: l1_vault did not initialize. Last 30 log lines:"
  tail -30 "$LOG"
  exit 1
fi
echo "  ✓ l1_vault present: true"

# ---- Step 5: POST /v1/lock -----------------------------------------------
echo "▸ Step 5: POST /v1/lock (amount=$AMOUNT_WEI wei = 0.0001 ETH)..."
PAYLOAD=$(cat <<EOF
{
  "chain_id": 11155111,
  "asset": "ETH",
  "amount": "$AMOUNT_WEI",
  "dest_addr": "$DEST_ADDR",
  "expiry": $EXPIRY,
  "nonce": $NONCE,
  "pk_dilithium": "0x$(printf '00%.0s' {1..1952})",
  "sig_dilithium": "0x$(printf '00%.0s' {1..3309})"
}
EOF
)
RESPONSE=$(curl -sS -X POST http://localhost:8080/v1/lock \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD")
echo "  response: $(echo "$RESPONSE" | jq -c .)"

LOCK_ID=$(echo "$RESPONSE" | jq -r '.lock_id // empty')
RESPONSE_TX=$(echo "$RESPONSE" | jq -r '.l1_tx_hash // empty')
if [ -z "$LOCK_ID" ]; then
  echo "ERROR: lock POST did not return lock_id. Full response:"
  echo "$RESPONSE" | jq .
  exit 1
fi
echo "  ✓ lock_id=$LOCK_ID"
echo "  ✓ response.l1_tx_hash=${RESPONSE_TX:-<NOT RETURNED>}"

# ---- Step 6: verify DB -----------------------------------------------------
echo "▸ Step 6: psql verify…"
DB_TX=$(psql "$DATABASE_URL" -t -A -c \
  "SELECT l1_tx_hash FROM locks WHERE lock_id = '$LOCK_ID';" | tr -d ' ')
echo "  db.l1_tx_hash=${DB_TX:-<NULL>}"
if [ -z "$DB_TX" ] || [ "$DB_TX" = "" ]; then
  echo "FAIL: lock $LOCK_ID has no l1_tx_hash in DB."
  echo "    L1 deposit silently failed. Last 80 api-server log lines:"
  tail -80 "$LOG"
  exit 1
fi

# ---- Step 7: cast receipt -------------------------------------------------
echo "▸ Step 7: cast receipt $DB_TX (Sepolia)…"
sleep 5  # give the tx a few extra seconds to be mined
RECEIPT=$(cast receipt "$DB_TX" --rpc-url "$RPC" --json 2>/dev/null || echo "{}")
STATUS=$(echo "$RECEIPT" | jq -r '.status // "missing"')
BLOCK=$(echo "$RECEIPT" | jq -r '.blockNumber // empty')
echo "  status=$STATUS block=${BLOCK:-<pending>}"

case "$STATUS" in
  "0x1"|"1")
    echo ""
    echo "═══════════════════════════════════════════════════════════════"
    echo " ✓ PHASE 1 PASS — lock anchored on Sepolia"
    echo "═══════════════════════════════════════════════════════════════"
    echo " lock_id : $LOCK_ID"
    echo " tx_hash : $DB_TX"
    echo " block   : $BLOCK"
    echo " etherscan: https://sepolia.etherscan.io/tx/$DB_TX"
    echo "═══════════════════════════════════════════════════════════════"
    ;;
  "0x0"|"0")
    echo "FAIL: tx reverted on L1. Etherscan: https://sepolia.etherscan.io/tx/$DB_TX"
    exit 1
    ;;
  *)
    echo "FAIL: tx not mined yet (status=$STATUS). Re-check in 30s:"
    echo "  cast receipt $DB_TX --rpc-url $RPC"
    exit 1
    ;;
esac
