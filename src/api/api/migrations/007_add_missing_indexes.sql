-- Add Missing Database Indexes
-- Addresses performance bottlenecks identified in QS Admin and core operations

-- ============================================================================
-- High Priority: unlock_prover_signatures
-- ============================================================================

-- VRF prover selection queries
CREATE INDEX IF NOT EXISTS idx_unlock_prover_sigs_prover_id
    ON unlock_prover_signatures(prover_id);

-- Signature verification and aggregation
CREATE INDEX IF NOT EXISTS idx_unlock_prover_sigs_unlock_prover
    ON unlock_prover_signatures(unlock_id, prover_id);

-- ============================================================================
-- High Priority: challenges
-- ============================================================================

-- Observer challenge history and earnings
CREATE INDEX IF NOT EXISTS idx_challenges_challenger
    ON challenges(challenger);

-- JOIN with unlock_requests
CREATE INDEX IF NOT EXISTS idx_challenges_unlock_id
    ON challenges(unlock_id);

-- ============================================================================
-- High Priority: user_dilithium_keys
-- ============================================================================

-- Auth: lookup keys per wallet
CREATE INDEX IF NOT EXISTS idx_user_dilithium_keys_wallet
    ON user_dilithium_keys(wallet_address);

-- Filter active keys during signature verification
CREATE INDEX IF NOT EXISTS idx_user_dilithium_keys_wallet_active
    ON user_dilithium_keys(wallet_address, is_active)
    WHERE is_active = TRUE;

-- ============================================================================
-- High Priority: vrf_requests
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_vrf_requests_status
    ON vrf_requests(status);

-- ============================================================================
-- High Priority: proposal_actions
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_proposal_actions_proposal_id
    ON proposal_actions(proposal_id);

-- ============================================================================
-- High Priority: reward_claims
-- ============================================================================

-- Prevent double-claiming per wallet/epoch
CREATE INDEX IF NOT EXISTS idx_reward_claims_wallet_epoch
    ON reward_claims(wallet_address, epoch);

CREATE INDEX IF NOT EXISTS idx_reward_claims_epoch
    ON reward_claims(epoch);

-- ============================================================================
-- High Priority: observer_earnings
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_observer_earnings_observer_id
    ON observer_earnings(observer_id);

CREATE INDEX IF NOT EXISTS idx_observer_earnings_unclaimed
    ON observer_earnings(claimed)
    WHERE claimed = FALSE;

-- ============================================================================
-- High Priority: prover_exits / slashings / delegations / veqs_locks
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_prover_exits_status
    ON prover_exits(status);

CREATE INDEX IF NOT EXISTS idx_slashings_prover_id
    ON slashings(prover_id);

CREATE INDEX IF NOT EXISTS idx_slashings_slashed_at
    ON slashings(slashed_at DESC);

CREATE INDEX IF NOT EXISTS idx_delegations_delegator
    ON delegations(delegator);

CREATE INDEX IF NOT EXISTS idx_delegations_delegatee
    ON delegations(delegatee);

CREATE INDEX IF NOT EXISTS idx_veqs_locks_wallet
    ON veqs_locks(wallet_address);

-- ============================================================================
-- Medium Priority: locks / unlock_requests
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_locks_asset
    ON locks(asset);

CREATE INDEX IF NOT EXISTS idx_locks_l1_tx_hash
    ON locks(l1_tx_hash)
    WHERE l1_tx_hash IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_unlock_requests_lock_status
    ON unlock_requests(lock_id, status);

CREATE INDEX IF NOT EXISTS idx_unlock_requests_is_emergency
    ON unlock_requests(is_emergency);

-- ============================================================================
-- Medium Priority: challenges (additional)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_challenges_resolved_at
    ON challenges(resolved_at DESC)
    WHERE resolved_at IS NOT NULL;

-- ============================================================================
-- Medium Priority: admin_users
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_admin_users_email
    ON admin_users(email);

CREATE INDEX IF NOT EXISTS idx_admin_users_role_id
    ON admin_users(role_id);

CREATE INDEX IF NOT EXISTS idx_admin_users_status
    ON admin_users(status);

-- ============================================================================
-- Medium Priority: treasury / alerts
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_treasury_wallets_address
    ON treasury_wallets(address);

CREATE INDEX IF NOT EXISTS idx_treasury_tx_from_to
    ON treasury_transactions(from_address, to_address);

CREATE INDEX IF NOT EXISTS idx_alerts_unacknowledged
    ON alerts(status)
    WHERE acknowledged_by IS NULL;

-- ============================================================================
-- Additional: insurance_claims
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_insurance_claims_lock_id
    ON insurance_claims(lock_id)
    WHERE lock_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_insurance_claims_processed_at
    ON insurance_claims(processed_at DESC)
    WHERE processed_at IS NOT NULL;
