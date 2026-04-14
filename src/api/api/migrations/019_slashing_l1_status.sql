-- ============================================================================
-- Migration 019: Slashing L1 lifecycle tracking
-- ============================================================================
--
-- Adds explicit L1 submission state tracking to the `slashings` table so that
-- the SlashingRetryService can find and retry pending L1 writes.
--
-- Background (C-4 fix from the 2026-04-11 spec-drift audit):
--
-- Before this migration, `services/slashing.rs::execute_slashing` treated the
-- L1 `ProverRegistry.slash()` call as "best-effort". A failed submission was
-- logged at WARN level and the function returned `None` for `l1_tx_hash`,
-- leaving operators blind to a broken slashing pipeline. The DB was marked as
-- slashed while the attacker's on-chain stake remained untouched — the exact
-- silent-failure pattern the audit found in several places.
--
-- After this migration:
--   - `l1_status`: one of 'submitted' | 'disabled' | 'unavailable' | 'pending_retry'
--   - `l1_error`: error message if `l1_status = 'pending_retry'`
--   - `l1_retry_count`: how many retry attempts have been made
--   - `l1_last_retry_at`: timestamp of the most recent retry
--
-- The SlashingRetryService (src/services/slashing_retry_service.rs) polls rows
-- with `l1_status = 'pending_retry'` and a retry budget remaining, resubmits
-- to L1, and updates status. Terminal states ('submitted', 'disabled',
-- 'unavailable') are never retried.

ALTER TABLE slashings
  ADD COLUMN IF NOT EXISTS l1_status VARCHAR(32) NOT NULL DEFAULT 'disabled';

ALTER TABLE slashings
  ADD COLUMN IF NOT EXISTS l1_error TEXT;

ALTER TABLE slashings
  ADD COLUMN IF NOT EXISTS l1_retry_count INTEGER NOT NULL DEFAULT 0;

ALTER TABLE slashings
  ADD COLUMN IF NOT EXISTS l1_last_retry_at TIMESTAMP WITH TIME ZONE;

-- Colluding prover count is needed to resubmit a slashing to L1 during retry.
-- Previously this value only existed in memory inside execute_slashing() and
-- was lost once the function returned, so the retry service had no way to
-- reconstruct the correct count. Default 1 is a safe fallback for historical
-- rows (most challenges target a single prover).
ALTER TABLE slashings
  ADD COLUMN IF NOT EXISTS colluding_count INTEGER NOT NULL DEFAULT 1;

-- Retry queue lookup index — the SlashingRetryService polls for rows where
-- `l1_status = 'pending_retry'` frequently, so this index is critical for
-- scalability.
CREATE INDEX IF NOT EXISTS idx_slashings_l1_status_retry
  ON slashings (l1_status, l1_last_retry_at)
  WHERE l1_status = 'pending_retry';

-- Populate existing rows: if l1_tx_hash is set, we assume the old best-effort
-- path actually succeeded and mark the row as 'submitted'. Rows with a NULL
-- l1_tx_hash keep the default 'disabled' value — operators should manually
-- review historical rows to decide if they need a retroactive retry.
UPDATE slashings
   SET l1_status = 'submitted'
 WHERE l1_tx_hash IS NOT NULL
   AND l1_status = 'disabled';

-- Sanity check: every row has a valid l1_status.
-- (No constraint added so this migration is reversible; we rely on the NOT NULL
-- DEFAULT 'disabled' on the column itself.)
