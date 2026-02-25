-- Quantum Shield Database Initial Schema
-- Version: 1.0
-- Based on docs/specs/DATABASE_DESIGN.md

-- ============================================================================
-- Core User Tables
-- ============================================================================

CREATE TABLE IF NOT EXISTS users (
    wallet_address VARCHAR(42) PRIMARY KEY,
    pk_dilithium BYTEA,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_active TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_users_created ON users(created_at DESC);

CREATE TABLE IF NOT EXISTS user_settings (
    wallet_address VARCHAR(42) PRIMARY KEY REFERENCES users(wallet_address),
    email VARCHAR(255),
    language VARCHAR(5) DEFAULT 'ja',
    notification_email BOOLEAN DEFAULT TRUE,
    notification_browser BOOLEAN DEFAULT TRUE,
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_dilithium_keys (
    key_id VARCHAR(66) PRIMARY KEY,
    wallet_address VARCHAR(42) NOT NULL REFERENCES users(wallet_address),
    pk_dilithium BYTEA NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    revoked_at TIMESTAMP WITH TIME ZONE
);

-- ============================================================================
-- Lock/Unlock Tables
-- ============================================================================

CREATE TABLE IF NOT EXISTS locks (
    lock_id VARCHAR(66) PRIMARY KEY,
    wallet_address VARCHAR(42) NOT NULL REFERENCES users(wallet_address),
    chain_id BIGINT NOT NULL,
    asset VARCHAR(42) NOT NULL,
    amount NUMERIC(78,0) NOT NULL,
    dest_addr BYTEA NOT NULL,
    expiry BIGINT NOT NULL,
    nonce BIGINT NOT NULL,
    pk_dilithium BYTEA NOT NULL,
    sig_dilithium BYTEA NOT NULL,
    sr_0 VARCHAR(66) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    l1_tx_hash VARCHAR(66),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    confirmed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_locks_wallet ON locks(wallet_address);
CREATE INDEX IF NOT EXISTS idx_locks_status ON locks(status);
CREATE INDEX IF NOT EXISTS idx_locks_created ON locks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_locks_chain ON locks(chain_id);

CREATE TABLE IF NOT EXISTS unlock_requests (
    unlock_id VARCHAR(66) PRIMARY KEY,
    lock_id VARCHAR(66) NOT NULL REFERENCES locks(lock_id),
    wallet_address VARCHAR(42) NOT NULL REFERENCES users(wallet_address),
    dest_addr BYTEA NOT NULL,
    amount NUMERIC(78,0) NOT NULL,
    sig_dilithium BYTEA NOT NULL,
    sr_0 VARCHAR(66) NOT NULL,
    sr_1 VARCHAR(66) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    is_emergency BOOLEAN DEFAULT FALSE,
    bond_amount NUMERIC(78,0),
    release_time TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_unlocks_lock ON unlock_requests(lock_id);
CREATE INDEX IF NOT EXISTS idx_unlocks_wallet ON unlock_requests(wallet_address);
CREATE INDEX IF NOT EXISTS idx_unlocks_status ON unlock_requests(status);
CREATE INDEX IF NOT EXISTS idx_unlocks_release ON unlock_requests(release_time);

CREATE TABLE IF NOT EXISTS unlock_prover_signatures (
    signature_id VARCHAR(66) PRIMARY KEY,
    unlock_id VARCHAR(66) NOT NULL REFERENCES unlock_requests(unlock_id),
    prover_id VARCHAR(66) NOT NULL,
    sig_sphincs BYTEA NOT NULL,
    sr_0 VARCHAR(66) NOT NULL,
    sr_1 VARCHAR(66) NOT NULL,
    is_valid BOOLEAN DEFAULT TRUE,
    signed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(unlock_id, prover_id)
);

CREATE TABLE IF NOT EXISTS vrf_requests (
    vrf_id VARCHAR(66) PRIMARY KEY,
    unlock_id VARCHAR(66) UNIQUE NOT NULL REFERENCES unlock_requests(unlock_id),
    vrf_seed BYTEA NOT NULL,
    selected_prover_ids JSONB NOT NULL,
    prover_weights JSONB NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- ============================================================================
-- Prover Tables
-- ============================================================================

CREATE TABLE IF NOT EXISTS provers (
    prover_id VARCHAR(66) PRIMARY KEY,
    operator_addr VARCHAR(42) NOT NULL,
    sphincs_pubkey BYTEA NOT NULL,
    stake_amount NUMERIC(78,0) NOT NULL,
    hsm_attestation BYTEA,
    status VARCHAR(20) DEFAULT 'pending_approval',
    tier VARCHAR(20) DEFAULT 'standard',
    registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    approved_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_provers_status ON provers(status);
CREATE INDEX IF NOT EXISTS idx_provers_operator ON provers(operator_addr);
CREATE INDEX IF NOT EXISTS idx_provers_tier ON provers(tier);

CREATE TABLE IF NOT EXISTS prover_exits (
    exit_id VARCHAR(66) PRIMARY KEY,
    prover_id VARCHAR(66) UNIQUE NOT NULL REFERENCES provers(prover_id),
    initiated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    unbonding_end TIMESTAMP WITH TIME ZONE NOT NULL,
    stake_to_return NUMERIC(78,0) NOT NULL,
    pending_rewards NUMERIC(78,0) NOT NULL,
    status VARCHAR(20) DEFAULT 'unbonding'
);

CREATE TABLE IF NOT EXISTS prover_metrics (
    prover_id VARCHAR(66) PRIMARY KEY REFERENCES provers(prover_id),
    total_signatures BIGINT DEFAULT 0,
    signatures_24h BIGINT DEFAULT 0,
    signatures_7d BIGINT DEFAULT 0,
    avg_response_time_ms BIGINT DEFAULT 0,
    success_rate DOUBLE PRECISION DEFAULT 100,
    uptime_percentage DOUBLE PRECISION DEFAULT 100,
    total_rewards NUMERIC(78,0) DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- Challenge/Slashing Tables
-- ============================================================================

CREATE TABLE IF NOT EXISTS challenges (
    challenge_id VARCHAR(66) PRIMARY KEY,
    lock_id VARCHAR(66) NOT NULL REFERENCES locks(lock_id),
    unlock_id VARCHAR(66) REFERENCES unlock_requests(unlock_id),
    challenger VARCHAR(42) NOT NULL,
    fraud_proof_hash VARCHAR(66) NOT NULL,
    bond NUMERIC(78,0) NOT NULL,
    challenged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    defense_deadline TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    defender VARCHAR(42),
    defense_proof_hash VARCHAR(66),
    resolved_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_challenges_lock ON challenges(lock_id);
CREATE INDEX IF NOT EXISTS idx_challenges_status ON challenges(status);
CREATE INDEX IF NOT EXISTS idx_challenges_deadline ON challenges(defense_deadline);

CREATE TABLE IF NOT EXISTS slashings (
    slashing_id VARCHAR(66) PRIMARY KEY,
    challenge_id VARCHAR(66) UNIQUE NOT NULL REFERENCES challenges(challenge_id),
    prover_id VARCHAR(66) NOT NULL REFERENCES provers(prover_id),
    slash_amount NUMERIC(78,0) NOT NULL,
    challenger_reward NUMERIC(78,0) NOT NULL,
    insurance_amount NUMERIC(78,0) NOT NULL,
    burn_amount NUMERIC(78,0) NOT NULL,
    l1_tx_hash VARCHAR(66),
    slashed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- Governance Tables
-- ============================================================================

CREATE TABLE IF NOT EXISTS proposals (
    proposal_id VARCHAR(66) PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    proposer VARCHAR(42) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    votes_for NUMERIC(78,0) DEFAULT 0,
    votes_against NUMERIC(78,0) DEFAULT 0,
    votes_abstain NUMERIC(78,0) DEFAULT 0,
    quorum NUMERIC(78,0) NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_proposals_status ON proposals(status);
CREATE INDEX IF NOT EXISTS idx_proposals_end ON proposals(end_time);

CREATE TABLE IF NOT EXISTS votes (
    vote_id VARCHAR(66) PRIMARY KEY,
    proposal_id VARCHAR(66) NOT NULL REFERENCES proposals(proposal_id),
    voter VARCHAR(42) NOT NULL,
    support SMALLINT NOT NULL,
    weight NUMERIC(78,0) NOT NULL,
    l1_tx_hash VARCHAR(66),
    voted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(proposal_id, voter)
);

CREATE INDEX IF NOT EXISTS idx_votes_proposal ON votes(proposal_id);
CREATE INDEX IF NOT EXISTS idx_votes_voter ON votes(voter);

CREATE TABLE IF NOT EXISTS proposal_actions (
    action_id VARCHAR(66) PRIMARY KEY,
    proposal_id VARCHAR(66) NOT NULL REFERENCES proposals(proposal_id),
    target VARCHAR(42) NOT NULL,
    value NUMERIC(78,0) NOT NULL,
    data BYTEA NOT NULL,
    description TEXT,
    execution_order SMALLINT DEFAULT 0
);

-- ============================================================================
-- Token Hub (veQS) Tables
-- ============================================================================

CREATE TABLE IF NOT EXISTS veqs_locks (
    lock_id VARCHAR(66) PRIMARY KEY,
    wallet_address VARCHAR(42) NOT NULL REFERENCES users(wallet_address),
    locked_amount NUMERIC(78,0) NOT NULL,
    veqs_value NUMERIC(78,0) NOT NULL,
    lock_end TIMESTAMP WITH TIME ZONE NOT NULL,
    lock_duration_days BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS delegations (
    delegation_id VARCHAR(66) PRIMARY KEY,
    delegator VARCHAR(42) NOT NULL REFERENCES users(wallet_address),
    delegatee VARCHAR(42) NOT NULL REFERENCES users(wallet_address),
    amount NUMERIC(78,0) NOT NULL,
    delegated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reward_epochs (
    epoch BIGINT PRIMARY KEY,
    total_rewards NUMERIC(78,0) NOT NULL,
    total_veqs NUMERIC(78,0) NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    finalized BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS reward_claims (
    claim_id VARCHAR(66) PRIMARY KEY,
    wallet_address VARCHAR(42) NOT NULL REFERENCES users(wallet_address),
    epoch BIGINT NOT NULL REFERENCES reward_epochs(epoch),
    amount NUMERIC(78,0) NOT NULL,
    l1_tx_hash VARCHAR(66),
    claimed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- Observer Tables
-- ============================================================================

CREATE TABLE IF NOT EXISTS observers (
    observer_id VARCHAR(66) PRIMARY KEY,
    wallet_address VARCHAR(42) UNIQUE NOT NULL REFERENCES users(wallet_address),
    status VARCHAR(20) DEFAULT 'active',
    total_earnings NUMERIC(78,0) DEFAULT 0,
    successful_challenges BIGINT DEFAULT 0,
    failed_challenges BIGINT DEFAULT 0,
    registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    practice_mode_until TIMESTAMP WITH TIME ZONE,
    practice_mode_earnings NUMERIC(78,0) DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_observers_practice_mode ON observers(practice_mode_until)
    WHERE practice_mode_until IS NOT NULL;

CREATE TABLE IF NOT EXISTS observer_earnings (
    earning_id VARCHAR(66) PRIMARY KEY,
    observer_id VARCHAR(66) NOT NULL REFERENCES observers(observer_id),
    challenge_id VARCHAR(66) NOT NULL REFERENCES challenges(challenge_id),
    amount NUMERIC(78,0) NOT NULL,
    claimed BOOLEAN DEFAULT FALSE,
    claim_tx_hash VARCHAR(66),
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    claimed_at TIMESTAMP WITH TIME ZONE
);

-- ============================================================================
-- Audit/System Tables
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit_logs (
    log_id VARCHAR(66) PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(66) NOT NULL,
    action VARCHAR(50) NOT NULL,
    actor VARCHAR(42) NOT NULL,
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_actor ON audit_logs(actor);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);

CREATE TABLE IF NOT EXISTS system_settings (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL,
    updated_by VARCHAR(42),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- Admin Tables (TASK-P5-015)
-- ============================================================================

CREATE TABLE IF NOT EXISTS admin_roles (
    role_id VARCHAR(66) PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    level SMALLINT NOT NULL,
    permissions JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_users (
    admin_id VARCHAR(66) PRIMARY KEY,
    wallet_address VARCHAR(42) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    role_id VARCHAR(66) NOT NULL REFERENCES admin_roles(role_id),
    status VARCHAR(20) DEFAULT 'active',
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    two_factor_secret VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS admin_audit_logs (
    log_id VARCHAR(66) PRIMARY KEY,
    admin_id VARCHAR(66) NOT NULL REFERENCES admin_users(admin_id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id VARCHAR(66),
    details JSONB,
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_audit_admin ON admin_audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_resource ON admin_audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_created ON admin_audit_logs(created_at DESC);

CREATE TABLE IF NOT EXISTS admin_sessions (
    session_id VARCHAR(66) PRIMARY KEY,
    admin_id VARCHAR(66) NOT NULL REFERENCES admin_users(admin_id),
    ip_address VARCHAR(45) NOT NULL,
    user_agent VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    revoked_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_admin_sessions_admin ON admin_sessions(admin_id);

-- ============================================================================
-- Treasury Tables
-- ============================================================================

CREATE TABLE IF NOT EXISTS treasury_wallets (
    wallet_id VARCHAR(66) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL,
    address VARCHAR(42) NOT NULL,
    multisig_threshold INTEGER NOT NULL,
    multisig_signers JSONB NOT NULL,
    balance NUMERIC(78,0) NOT NULL,
    currency VARCHAR(10) DEFAULT 'ETH',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS treasury_transactions (
    tx_id VARCHAR(66) PRIMARY KEY,
    wallet_id VARCHAR(66) NOT NULL REFERENCES treasury_wallets(wallet_id),
    type VARCHAR(20) NOT NULL,
    amount NUMERIC(78,0) NOT NULL,
    currency VARCHAR(10) NOT NULL,
    from_address VARCHAR(42),
    to_address VARCHAR(42),
    purpose VARCHAR(500),
    status VARCHAR(20) DEFAULT 'pending',
    approved_by JSONB,
    tx_hash VARCHAR(66),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    executed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_treasury_tx_wallet ON treasury_transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_treasury_tx_status ON treasury_transactions(status);
CREATE INDEX IF NOT EXISTS idx_treasury_tx_created ON treasury_transactions(created_at DESC);

CREATE TABLE IF NOT EXISTS treasury_approvals (
    approval_id VARCHAR(66) PRIMARY KEY,
    transfer_id VARCHAR(66) NOT NULL REFERENCES treasury_transactions(tx_id),
    approver_id VARCHAR(66) NOT NULL REFERENCES admin_users(admin_id),
    approver_wallet VARCHAR(42) NOT NULL,
    approved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    signature BYTEA NOT NULL,
    status VARCHAR(20) DEFAULT 'approved',
    rejection_reason TEXT,
    UNIQUE(transfer_id, approver_id)
);

CREATE INDEX IF NOT EXISTS idx_treasury_approvals_transfer ON treasury_approvals(transfer_id);
CREATE INDEX IF NOT EXISTS idx_treasury_approvals_approver ON treasury_approvals(approver_id);

CREATE TABLE IF NOT EXISTS protocol_revenue (
    revenue_id VARCHAR(66) PRIMARY KEY,
    date DATE NOT NULL,
    source VARCHAR(50) NOT NULL,
    amount NUMERIC(78,0) NOT NULL,
    currency VARCHAR(10) NOT NULL,
    tx_hash VARCHAR(66),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_protocol_revenue_date ON protocol_revenue(date);
CREATE INDEX IF NOT EXISTS idx_protocol_revenue_source ON protocol_revenue(source);

-- ============================================================================
-- Metrics Tables
-- ============================================================================

CREATE TABLE IF NOT EXISTS daily_metrics (
    date DATE PRIMARY KEY,
    tvl NUMERIC(78,0) NOT NULL,
    active_users BIGINT NOT NULL,
    new_users BIGINT NOT NULL,
    transactions_count BIGINT NOT NULL,
    lock_volume NUMERIC(78,0) NOT NULL,
    unlock_volume NUMERIC(78,0) NOT NULL,
    fee_revenue NUMERIC(78,0) NOT NULL,
    prover_uptime DOUBLE PRECISION NOT NULL,
    avg_unlock_time DOUBLE PRECISION NOT NULL,
    computed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS alert_rules (
    rule_id VARCHAR(66) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    metric_type VARCHAR(50) NOT NULL,
    condition VARCHAR(10) NOT NULL,
    threshold NUMERIC(78,0) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    notification_channel VARCHAR(100) NOT NULL,
    enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS alerts (
    alert_id VARCHAR(66) PRIMARY KEY,
    rule_id VARCHAR(66) NOT NULL REFERENCES alert_rules(rule_id),
    severity VARCHAR(20) NOT NULL,
    message VARCHAR(500) NOT NULL,
    details JSONB,
    status VARCHAR(20) DEFAULT 'active',
    acknowledged_by VARCHAR(66) REFERENCES admin_users(admin_id),
    triggered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    resolved_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_alerts_rule ON alerts(rule_id);
CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status);
CREATE INDEX IF NOT EXISTS idx_alerts_triggered ON alerts(triggered_at DESC);

-- ============================================================================
-- Enterprise Contract Tables (v1.1 additions)
-- ============================================================================

CREATE TABLE IF NOT EXISTS enterprise_contracts (
    contract_id VARCHAR(66) PRIMARY KEY,
    prover_id VARCHAR(66) NOT NULL REFERENCES provers(prover_id),
    company_name VARCHAR(255) NOT NULL,
    sla_guarantee NUMERIC(5,2) DEFAULT 99.90,
    minimum_revenue NUMERIC(78,0) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_enterprise_contracts_prover ON enterprise_contracts(prover_id);
CREATE INDEX IF NOT EXISTS idx_enterprise_contracts_status ON enterprise_contracts(status);

CREATE TABLE IF NOT EXISTS unlock_risk_scores (
    unlock_id VARCHAR(66) PRIMARY KEY REFERENCES unlock_requests(unlock_id),
    score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
    level VARCHAR(10) NOT NULL CHECK (level IN ('low', 'medium', 'high')),
    reasons JSONB DEFAULT '[]'::jsonb,
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_risk_scores_level ON unlock_risk_scores(level);
CREATE INDEX IF NOT EXISTS idx_risk_scores_score ON unlock_risk_scores(score DESC);

-- ============================================================================
-- Seed Data for Admin Roles
-- ============================================================================

INSERT INTO admin_roles (role_id, name, level, permissions, created_at)
VALUES
    ('role-superadmin', 'superadmin', 1, '{"all": true}'::jsonb, NOW()),
    ('role-admin', 'admin', 2, '{"read": true, "write": true, "approve": true}'::jsonb, NOW()),
    ('role-operator', 'operator', 3, '{"read": true, "write": true}'::jsonb, NOW()),
    ('role-viewer', 'viewer', 4, '{"read": true}'::jsonb, NOW())
ON CONFLICT (role_id) DO NOTHING;
