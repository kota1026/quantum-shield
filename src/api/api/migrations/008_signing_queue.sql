-- Migration 008: signing_queue table
-- Phase 0 of Storage Migration (Redis-Only → Dual-Write)
-- Purpose: Prover signing queue for unlock requests
-- Reference: MIGRATION_PLAN.md §2.1

CREATE TABLE IF NOT EXISTS signing_queue (
    queue_id    VARCHAR(66)  PRIMARY KEY,
    unlock_id   VARCHAR(66)  NOT NULL REFERENCES unlock_requests(unlock_id),
    prover_id   VARCHAR(66)  NOT NULL REFERENCES provers(prover_id),
    lock_id     VARCHAR(66)  NOT NULL REFERENCES locks(lock_id),
    sr_0        VARCHAR(66)  NOT NULL,
    sr_1        VARCHAR(66)  NOT NULL,
    status      VARCHAR(20)  NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'processing', 'signed', 'expired', 'failed')),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    signed_at   TIMESTAMP WITH TIME ZONE,
    expires_at  TIMESTAMP WITH TIME ZONE,
    UNIQUE(unlock_id, prover_id)
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_signing_queue_prover ON signing_queue(prover_id);
CREATE INDEX IF NOT EXISTS idx_signing_queue_status ON signing_queue(status);
CREATE INDEX IF NOT EXISTS idx_signing_queue_unlock ON signing_queue(unlock_id);
CREATE INDEX IF NOT EXISTS idx_signing_queue_assigned ON signing_queue(assigned_at DESC);
CREATE INDEX IF NOT EXISTS idx_signing_queue_prover_status ON signing_queue(prover_id, status);
