#!/bin/sh
set -e

echo "=== Running database migrations ==="
for f in /app/migrations/*.sql; do
  echo "Applying: $(basename $f)"
  psql "$DATABASE_URL" -f "$f" 2>&1 || echo "  (already applied or skipped)"
done
echo "=== Migrations complete ==="

echo "=== Starting API server ==="
exec /app/api-server
