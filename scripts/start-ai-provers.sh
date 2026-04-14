#!/usr/bin/env bash
# =============================================================================
# Quantum Shield - Start 2 AI Prover agents with real SLH-DSA keys
# =============================================================================
# Loads each prover's secrets/provers/*.env (real SLH-DSA keypair +
# operator address) and launches the AI Prover agent in the background.
#
# Prerequisites:
#   - Backend API running at http://localhost:8080
#   - Database seeded via scripts/seed-real-provers.sql
#   - ANTHROPIC_API_KEY env var set (for signature verification reasoning)
#
# Usage:
#   export ANTHROPIC_API_KEY=sk-ant-...
#   bash scripts/start-ai-provers.sh
#
# Stop:
#   pkill -f "ai-prover/src/index.ts"
# =============================================================================
set -euo pipefail

: "${ANTHROPIC_API_KEY:?  ERROR: set ANTHROPIC_API_KEY env var}"

cd "$(dirname "$0")/.."
REPO_ROOT="$(pwd)"
SECRETS_DIR="$REPO_ROOT/secrets/provers"
AGENT_DIR="$REPO_ROOT/src/agents/ai-prover"
LOG_DIR="$REPO_ROOT/logs/ai-prover"

mkdir -p "$LOG_DIR"

if [ ! -f "$SECRETS_DIR/prover1.env" ] || [ ! -f "$SECRETS_DIR/prover2.env" ]; then
  echo "ERROR: missing $SECRETS_DIR/prover{1,2}.env" >&2
  echo "  Run:  pnpm exec tsx src/agents/ai-prover/src/keygen.ts --env > ..." >&2
  exit 1
fi

# Install deps if needed
cd "$AGENT_DIR"
if [ ! -d "node_modules" ]; then
  echo "Installing ai-prover dependencies..."
  pnpm install
fi

# Verify backend is reachable
echo "Checking backend health..."
if ! curl -fsS http://localhost:8080/v1/health > /dev/null 2>&1; then
  echo "ERROR: backend not reachable at http://localhost:8080/v1/health" >&2
  echo "  Start it with:  cd src/api/api && cargo run --bin api-server" >&2
  exit 1
fi
echo "  OK"

launch_prover() {
  local id="$1"
  local env_file="$2"
  local log_file="$LOG_DIR/prover${id}.log"

  echo ""
  echo "=== Launching AI Prover $id ==="
  echo "  env file : $env_file"
  echo "  log file : $log_file"

  # Run in a subshell so env vars don't leak between provers.
  (
    set -a
    # shellcheck disable=SC1090
    source "$env_file"
    export ANTHROPIC_API_KEY
    # Defaults for the agent loop
    export API_URL="${API_URL:-http://localhost:8080}"
    export POLLING_INTERVAL="${POLLING_INTERVAL:-10}"
    export MAX_BATCH_SIZE="${MAX_BATCH_SIZE:-10}"
    export LOG_LEVEL="${LOG_LEVEL:-info}"
    export AUDIT_LOG_FILE="$LOG_DIR/prover${id}-audit.log"
    export AGENT_NAME="AI-Prover-${id}"
    set +a

    echo "  PROVER_ID  : $PROVER_ID"
    echo "  PUBKEY     : ${PROVER_SPHINCS_PK:0:18}...${PROVER_SPHINCS_PK: -8}"

    cd "$AGENT_DIR"
    nohup pnpm exec tsx src/index.ts > "$log_file" 2>&1 &
    local pid=$!
    echo "  PID        : $pid"
    echo "$pid" > "$LOG_DIR/prover${id}.pid"
  )
}

launch_prover 1 "$SECRETS_DIR/prover1.env"
launch_prover 2 "$SECRETS_DIR/prover2.env"

echo ""
echo "=== Both AI Provers launched ==="
echo ""
echo "Tail logs:"
echo "  tail -f $LOG_DIR/prover1.log"
echo "  tail -f $LOG_DIR/prover2.log"
echo ""
echo "Stop:"
echo "  kill \$(cat $LOG_DIR/prover1.pid $LOG_DIR/prover2.pid)"
