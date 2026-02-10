-- Cleanup seed data for clean slate
-- Run with: psql -d quantum_shield -f scripts/cleanup_seed_data.sql

BEGIN;

-- Delete all provers (seed data)
DELETE FROM provers;
RAISE NOTICE 'Deleted all provers';

-- Delete all observers (seed data)
DELETE FROM observers;
RAISE NOTICE 'Deleted all observers';

-- Reset sequences if needed (optional)
-- ALTER SEQUENCE provers_id_seq RESTART WITH 1;
-- ALTER SEQUENCE observers_id_seq RESTART WITH 1;

COMMIT;

-- Verify deletion
SELECT 'Provers remaining:' as status, COUNT(*) as count FROM provers
UNION ALL
SELECT 'Observers remaining:', COUNT(*) FROM observers;
