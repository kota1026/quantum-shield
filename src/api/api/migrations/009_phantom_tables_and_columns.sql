-- Phase 1: Phantom Tables & Missing Columns
-- Resolves: C-1 (phantom table runtime errors), C-5 (proposals missing columns)
--
-- Creates tables referenced by repository code but never created in migrations:
--   - council_members (GovernanceRepository::get_council_members)
--   - budget_allocations (TreasuryRepository::get_budget_allocations)
--   - treasury_audit_log (TreasuryRepository::get_audit_log, count_audit_log)
--
-- Adds missing columns to proposals table:
--   - executed_by, executed_tx_hash, executed_at (GovernanceRepository::execute_proposal)

-- ============================================================================
-- Council Members Table (phantom: referenced in governance.rs)
-- ============================================================================

CREATE TABLE IF NOT EXISTS council_members (
    member_id VARCHAR(66) PRIMARY KEY,
    wallet_address VARCHAR(42) NOT NULL,
    name VARCHAR(100),
    role VARCHAR(50) NOT NULL DEFAULT 'member',
    voting_power NUMERIC(78,0) NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_active TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_council_members_status ON council_members(status);
CREATE INDEX IF NOT EXISTS idx_council_members_wallet ON council_members(wallet_address);

-- ============================================================================
-- Budget Allocations Table (phantom: referenced in treasury.rs)
-- ============================================================================

CREATE TABLE IF NOT EXISTS budget_allocations (
    allocation_id VARCHAR(66) PRIMARY KEY,
    category VARCHAR(100) NOT NULL,
    allocated_amount NUMERIC(78,0) NOT NULL DEFAULT 0,
    spent_amount NUMERIC(78,0) NOT NULL DEFAULT 0,
    currency VARCHAR(10) NOT NULL DEFAULT 'ETH',
    period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_budget_allocations_period ON budget_allocations(period_end);
CREATE INDEX IF NOT EXISTS idx_budget_allocations_category ON budget_allocations(category);

-- ============================================================================
-- Treasury Audit Log Table (phantom: referenced in treasury.rs)
-- ============================================================================

CREATE TABLE IF NOT EXISTS treasury_audit_log (
    audit_id VARCHAR(66) PRIMARY KEY,
    tx_id VARCHAR(66) REFERENCES treasury_transactions(tx_id),
    action VARCHAR(100) NOT NULL,
    actor VARCHAR(42) NOT NULL,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_treasury_audit_log_created ON treasury_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_treasury_audit_log_actor ON treasury_audit_log(actor);
CREATE INDEX IF NOT EXISTS idx_treasury_audit_log_action ON treasury_audit_log(action);

-- ============================================================================
-- Proposals Table - Add Missing Columns (phantom columns: referenced in governance.rs)
-- ============================================================================

ALTER TABLE proposals ADD COLUMN IF NOT EXISTS executed_by VARCHAR(42);
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS executed_tx_hash VARCHAR(66);
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS executed_at TIMESTAMP WITH TIME ZONE;
