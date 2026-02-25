#!/bin/bash
# Cleanup seed data for clean slate
# Run this script to delete all seed data (provers, observers)

set -e

# Get database URL from environment or use default
DB_URL="${DATABASE_URL:-postgres://quantum:quantum@localhost:5432/quantum_shield}"

echo "Cleaning up seed data..."
echo "Database: $DB_URL"
echo ""

# Delete provers
echo "Deleting all provers..."
psql "$DB_URL" -c "DELETE FROM provers;"

# Delete observers
echo "Deleting all observers..."
psql "$DB_URL" -c "DELETE FROM observers;"

# Show remaining counts
echo ""
echo "Verification:"
psql "$DB_URL" -c "SELECT 'Provers' as table_name, COUNT(*) as count FROM provers UNION ALL SELECT 'Observers', COUNT(*) FROM observers;"

echo ""
echo "Seed data cleanup complete!"
