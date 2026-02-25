-- Insurance Fund Tables
-- Version: 1.0
-- Based on routes/insurance.rs types and UNIFIED_SPEC §手数料配分

-- ============================================================================
-- Insurance Fund Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS insurance_fund (
    fund_id VARCHAR(66) PRIMARY KEY DEFAULT 'main',
    total_balance NUMERIC(78,0) NOT NULL DEFAULT 0,
    total_received NUMERIC(78,0) NOT NULL DEFAULT 0,
    total_claims_paid NUMERIC(78,0) NOT NULL DEFAULT 0,
    approved_claims_count INTEGER NOT NULL DEFAULT 0,
    rejected_claims_count INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- Insurance Claims Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS insurance_claims (
    claim_id VARCHAR(66) PRIMARY KEY,
    claimant VARCHAR(42) NOT NULL REFERENCES users(wallet_address),
    claim_type VARCHAR(30) NOT NULL CHECK (claim_type IN (
        'slashing_loss', 'protocol_bug', 'oracle_manipulation',
        'bridge_failure', 'other'
    )),
    amount NUMERIC(78,0) NOT NULL,
    amount_usd NUMERIC(20,2),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN (
        'pending', 'under_review', 'approved', 'rejected', 'paid', 'cancelled'
    )),
    description TEXT NOT NULL,
    detailed_description TEXT,
    incident_tx_hash VARCHAR(66),
    lock_id VARCHAR(66) REFERENCES locks(lock_id),
    evidence JSONB,
    signature BYTEA NOT NULL,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    processed_by VARCHAR(42)
);

CREATE INDEX IF NOT EXISTS idx_insurance_claims_claimant ON insurance_claims(claimant);
CREATE INDEX IF NOT EXISTS idx_insurance_claims_status ON insurance_claims(status);
CREATE INDEX IF NOT EXISTS idx_insurance_claims_type ON insurance_claims(claim_type);
CREATE INDEX IF NOT EXISTS idx_insurance_claims_submitted ON insurance_claims(submitted_at DESC);

-- ============================================================================
-- Insurance Transactions Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS insurance_transactions (
    tx_hash VARCHAR(66) PRIMARY KEY,
    tx_type VARCHAR(30) NOT NULL CHECK (tx_type IN (
        'fee_income', 'slashing_income', 'claim_payout', 'emergency_withdrawal'
    )),
    amount NUMERIC(78,0) NOT NULL,
    amount_usd NUMERIC(20,2),
    description TEXT,
    claim_id VARCHAR(66) REFERENCES insurance_claims(claim_id),
    source VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_insurance_tx_type ON insurance_transactions(tx_type);
CREATE INDEX IF NOT EXISTS idx_insurance_tx_created ON insurance_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_insurance_tx_claim ON insurance_transactions(claim_id);

-- ============================================================================
-- Initialize default fund record
-- ============================================================================

INSERT INTO insurance_fund (fund_id) VALUES ('main') ON CONFLICT DO NOTHING;
