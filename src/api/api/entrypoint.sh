#!/bin/sh
set -e

# Map DATABASE_URL to Rust config system prefix
if [ -n "$DATABASE_URL" ]; then
  export QS__DATABASE__URL="$DATABASE_URL"
fi

echo "=== Running database migrations ==="
for f in /app/migrations/*.sql; do
  echo "Applying: $(basename $f)"
  psql "$DATABASE_URL" -f "$f" 2>&1 || echo "  (already applied or skipped)"
done
echo "=== Migrations complete ==="

echo "=== Starting API server ==="
exec /app/api-server
