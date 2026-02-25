-- Migration 015: Seed dev-mode fallback provers
-- VRF dev mode returns these stub prover addresses when no real VRF contract is configured.
-- Without these entries, signing_queue FK constraint fails.
-- These provers are used ONLY in dev mode (VRF_CONTRACT_ADDRESS = 0x000...000).

-- Ensure user rows exist for fallback provers (FK: provers.operator_addr → users.wallet_address)
INSERT INTO users (wallet_address, created_at) VALUES
    ('0x0000000000000000000000000000000000000001', NOW()),
    ('0x0000000000000000000000000000000000000002', NOW())
ON CONFLICT (wallet_address) DO NOTHING;

-- Fallback prover #1 (returned by get_selected_prover in dev mode)
INSERT INTO provers (prover_id, operator_addr, sphincs_pubkey, stake_amount, status, tier, registered_at, approved_at)
VALUES (
    '0x0000000000000000000000000000000000000001',
    '0x0000000000000000000000000000000000000001',
    decode('0000000000000000000000000000000000000000000000000000000000000001', 'hex'),
    400000000000000000000000,
    'active',
    'genesis',
    NOW(),
    NOW()
) ON CONFLICT (prover_id) DO NOTHING;

-- Fallback prover #2 (returned by trigger_fallback in dev mode)
INSERT INTO provers (prover_id, operator_addr, sphincs_pubkey, stake_amount, status, tier, registered_at, approved_at)
VALUES (
    '0x0000000000000000000000000000000000000002',
    '0x0000000000000000000000000000000000000002',
    decode('0000000000000000000000000000000000000000000000000000000000000002', 'hex'),
    400000000000000000000000,
    'active',
    'genesis',
    NOW(),
    NOW()
) ON CONFLICT (prover_id) DO NOTHING;
