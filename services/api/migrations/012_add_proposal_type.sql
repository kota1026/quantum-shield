-- Migration 012: Add proposal_type column to proposals table
-- The GovernanceRepository::create_proposal INSERT references this column,
-- and get_proposals_by_proposer SELECT also references it.
-- Default to 'signal' for existing proposals.

ALTER TABLE proposals ADD COLUMN IF NOT EXISTS proposal_type VARCHAR(20) DEFAULT 'signal';
