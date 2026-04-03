#!/bin/sh
set -e

# Map DATABASE_URL to Rust config system prefix
if [ -n "$DATABASE_URL" ]; then
  export QS__DATABASE__URL="$DATABASE_URL"
fi

# Map L1 RPC URL to L1 sync service config
# L1SyncConfig.rpc_url defaults to unreliable https://rpc.sepolia.org
# Ensure it uses the same RPC endpoint as the main L1 config
if [ -n "$SEPOLIA_RPC_URL" ] && [ -z "$QS__L1_SYNC__RPC_URL" ]; then
  export QS__L1_SYNC__RPC_URL="$SEPOLIA_RPC_URL"
fi
if [ -n "$QS__L1_RPC_URL" ] && [ -z "$QS__L1_SYNC__RPC_URL" ]; then
  export QS__L1_SYNC__RPC_URL="$QS__L1_RPC_URL"
fi

echo "=== Running database migrations ==="
for f in /app/migrations/*.sql; do
  echo "Applying: $(basename $f)"
  psql "$DATABASE_URL" -f "$f" 2>&1 || echo "  (already applied or skipped)"
done
echo "=== Migrations complete ==="

echo "=== Starting API server ==="
exec /app/api-server
