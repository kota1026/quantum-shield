-- Migration 014: Add missing columns to signing_queue
-- These columns are referenced by the unlock flow and prover portal
-- but were not included in the original 008_signing_queue migration.

ALTER TABLE signing_queue ADD COLUMN IF NOT EXISTS unlock_type VARCHAR(20) NOT NULL DEFAULT 'normal';
ALTER TABLE signing_queue ADD COLUMN IF NOT EXISTS user_address VARCHAR(42) NOT NULL DEFAULT '';
ALTER TABLE signing_queue ADD COLUMN IF NOT EXISTS amount NUMERIC(78,0) NOT NULL DEFAULT 0;
ALTER TABLE signing_queue ADD COLUMN IF NOT EXISTS asset VARCHAR(42) NOT NULL DEFAULT 'ETH';
ALTER TABLE signing_queue ADD COLUMN IF NOT EXISTS priority VARCHAR(20) NOT NULL DEFAULT 'normal';
ALTER TABLE signing_queue ADD COLUMN IF NOT EXISTS dilithium_verified BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE signing_queue ADD COLUMN IF NOT EXISTS deadline TIMESTAMP WITH TIME ZONE;

-- Index for prover portal queue filtering
CREATE INDEX IF NOT EXISTS idx_signing_queue_deadline ON signing_queue(deadline);
CREATE INDEX IF NOT EXISTS idx_signing_queue_unlock_type ON signing_queue(unlock_type);
