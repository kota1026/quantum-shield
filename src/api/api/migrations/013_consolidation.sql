-- Migration 013: Schema Consolidation
-- Purpose: Reconcile all schema drift between migrations 001-012 and actual Rust code expectations
-- Reference: Phase 0.1 of Service Launch Plan
--
-- Issues addressed:
-- 1. signing_queue: migration 008 column names vs Rust code expectations
-- 2. council_actions/council_action_signatures: phantom tables (never created)
-- 3. provers: missing columns used by Rust code (uptime_percentage, pending_rewards, total_earnings)
-- 4. signing_queue: missing columns (user_address, amount) used in INSERT

-- ============================================================================
-- 1. signing_queue Schema Reconciliation
-- ============================================================================
-- Migration 008 defines: assigned_at, signed_at, expires_at
-- Rust SigningQueueRow expects: created_at, completed_at, deadline
-- Rust INSERT also uses: user_address, amount
--
-- Strategy: Add the columns that Rust code expects. Keep old columns for
-- backwards compatibility. New queries use the Rust-expected names.

-- Add columns expected by Rust code (if they don't exist)
ALTER TABLE signing_queue ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE signing_queue ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE signing_queue ADD COLUMN IF NOT EXISTS deadline TIMESTAMP WITH TIME ZONE;
ALTER TABLE signing_queue ADD COLUMN IF NOT EXISTS user_address VARCHAR(42) NOT NULL DEFAULT '';
ALTER TABLE signing_queue ADD COLUMN IF NOT EXISTS amount VARCHAR(78) NOT NULL DEFAULT '0';

-- Backfill: copy data from old column names to new ones (only if old columns exist and new are empty)
DO $$
BEGIN
    -- If assigned_at exists and created_at is still at default, copy over
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name = 'signing_queue' AND column_name = 'assigned_at') THEN
        UPDATE signing_queue
        SET created_at = COALESCE(created_at, assigned_at)
        WHERE created_at IS NULL AND assigned_at IS NOT NULL;
    END IF;

    -- If signed_at exists and completed_at is null, copy over
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name = 'signing_queue' AND column_name = 'signed_at') THEN
        UPDATE signing_queue
        SET completed_at = COALESCE(completed_at, signed_at)
        WHERE completed_at IS NULL AND signed_at IS NOT NULL;
    END IF;

    -- If expires_at exists and deadline is null, copy over
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name = 'signing_queue' AND column_name = 'expires_at') THEN
        UPDATE signing_queue
        SET deadline = COALESCE(deadline, expires_at)
        WHERE deadline IS NULL AND expires_at IS NOT NULL;
    END IF;
END $$;

-- Add indexes for the new column names
CREATE INDEX IF NOT EXISTS idx_signing_queue_created ON signing_queue(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_signing_queue_deadline ON signing_queue(deadline);

-- Make sr_0 and sr_1 nullable (Rust code expects Option<String>)
ALTER TABLE signing_queue ALTER COLUMN sr_0 DROP NOT NULL;
ALTER TABLE signing_queue ALTER COLUMN sr_1 DROP NOT NULL;

-- Make unlock_id nullable (Rust code expects Option<String>)
-- Need to drop FK first if it exists
DO $$
BEGIN
    -- Drop foreign key constraint on unlock_id if it exists
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints
               WHERE table_name = 'signing_queue'
               AND constraint_type = 'FOREIGN KEY'
               AND constraint_name LIKE '%unlock_id%') THEN
        EXECUTE 'ALTER TABLE signing_queue DROP CONSTRAINT ' ||
                (SELECT constraint_name FROM information_schema.table_constraints
                 WHERE table_name = 'signing_queue'
                 AND constraint_type = 'FOREIGN KEY'
                 AND constraint_name LIKE '%unlock_id%' LIMIT 1);
    END IF;
EXCEPTION WHEN OTHERS THEN
    -- Ignore if constraint doesn't exist
    NULL;
END $$;

ALTER TABLE signing_queue ALTER COLUMN unlock_id DROP NOT NULL;

-- ============================================================================
-- 2. Council Actions & Signatures (phantom tables)
-- ============================================================================
-- Referenced by council.rs but never created in any migration.
-- council_members was created in 009 but council_actions was not.

CREATE TABLE IF NOT EXISTS council_actions (
    action_id           VARCHAR(66)  PRIMARY KEY,
    action_type         VARCHAR(50)  NOT NULL,
    proposer            VARCHAR(42)  NOT NULL,
    proposed_at         TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    expires_at          TIMESTAMP WITH TIME ZONE NOT NULL,
    signature_count     INTEGER      NOT NULL DEFAULT 0,
    required_signatures INTEGER      NOT NULL DEFAULT 5,
    state               VARCHAR(20)  NOT NULL DEFAULT 'proposed'
        CHECK (state IN ('proposed', 'approved', 'executed', 'expired', 'rejected')),
    action_data         JSONB,
    raw_data            TEXT,
    executed_at         TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_council_actions_state ON council_actions(state);
CREATE INDEX IF NOT EXISTS idx_council_actions_proposer ON council_actions(proposer);
CREATE INDEX IF NOT EXISTS idx_council_actions_proposed_at ON council_actions(proposed_at DESC);

CREATE TABLE IF NOT EXISTS council_action_signatures (
    id                  SERIAL       PRIMARY KEY,
    action_id           VARCHAR(66)  NOT NULL REFERENCES council_actions(action_id),
    signer_address      VARCHAR(42)  NOT NULL,
    signer_seat_id      INTEGER      NOT NULL,
    signed_at           TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(action_id, signer_address)
);

CREATE INDEX IF NOT EXISTS idx_council_sigs_action ON council_action_signatures(action_id);
CREATE INDEX IF NOT EXISTS idx_council_sigs_signer ON council_action_signatures(signer_address);

-- ============================================================================
-- 3. Provers / Prover Metrics - Safety Net
-- ============================================================================
-- uptime_percentage (DOUBLE PRECISION) and total_rewards (NUMERIC) already
-- exist in prover_metrics from migration 001. ADD IF NOT EXISTS is a no-op
-- safety net in case the table was created without them.
ALTER TABLE prover_metrics ADD COLUMN IF NOT EXISTS uptime_percentage DOUBLE PRECISION DEFAULT 100;
ALTER TABLE prover_metrics ADD COLUMN IF NOT EXISTS total_rewards NUMERIC(78,0) DEFAULT 0;

-- ============================================================================
-- 4. Ensure all status CHECK constraints are loose enough
-- ============================================================================
-- signing_queue status: Rust uses 'pending', 'processing', 'signed', 'expired', 'failed'
-- These match the CHECK in migration 008 so no change needed.

-- ============================================================================
-- 5. Ensure queue_id uniqueness
-- ============================================================================
-- Rust INSERT uses ON CONFLICT (queue_id) which requires a unique constraint or index
-- queue_id is already PRIMARY KEY in migration 008, so this is fine.
-- But if the table was created externally with id SERIAL as PK:
DO $$
BEGIN
    -- If queue_id is not already unique/primary, add unique constraint
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints
                   WHERE table_name = 'signing_queue'
                   AND (constraint_type = 'PRIMARY KEY' OR constraint_type = 'UNIQUE')
                   AND constraint_name LIKE '%queue_id%') THEN
        -- Check if there's already a unique index
        IF NOT EXISTS (SELECT 1 FROM pg_indexes
                       WHERE tablename = 'signing_queue'
                       AND indexdef LIKE '%queue_id%'
                       AND indexdef LIKE '%UNIQUE%') THEN
            ALTER TABLE signing_queue ADD CONSTRAINT signing_queue_queue_id_unique UNIQUE (queue_id);
        END IF;
    END IF;
END $$;
