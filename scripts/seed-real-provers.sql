-- =============================================================================
-- Quantum Shield - Seed real SLH-DSA prover records into backend DB
-- =============================================================================
-- Inserts (or updates) the two AI Provers with their real FIPS 205 public keys
-- so the backend's VRF-based prover selection picks them for unlock signing.
--
-- Operator addresses match the L1 ProverRegistry entries broadcast in
-- tx 0x99b73047... and 0x6f6162b0... (Sepolia blocks 10634601/10634602).
--
-- Run:
--   psql postgresql://quantum:quantum_dev@localhost:5432/quantum_shield \
--        -f scripts/seed-real-provers.sql
-- =============================================================================

BEGIN;

-- Show current prover state before changes
\echo '=== Current provers (before) ==='
SELECT prover_id, operator_addr, status, length(sphincs_pubkey) AS pk_len
FROM provers
ORDER BY prover_id;

-- Deactivate any legacy placeholder provers (0x...01 / 0x...02) so VRF
-- won't pick them — their on-chain pubkeys are fake and the signatures
-- would never verify.
UPDATE provers
SET status = 'inactive'
WHERE operator_addr IN (
  '0x0000000000000000000000000000000000000001',
  '0x0000000000000000000000000000000000000002'
);

-- Prover 1: 0x9b8d4139a12a916f9269de6f2a019b36ea613a73
-- SLH-DSA-SHAKE-128s pubkey: 0x45fc636754a029a1e5412beaaa05657dcb9881a0a1fe138f9259b22771f50ed0
INSERT INTO provers (prover_id, operator_addr, sphincs_pubkey, stake_amount, status, tier, approved_at)
VALUES (
  '0x9b8d4139a12a916f9269de6f2a019b36ea613a73',
  '0x9b8d4139a12a916f9269de6f2a019b36ea613a73',
  decode('45fc636754a029a1e5412beaaa05657dcb9881a0a1fe138f9259b22771f50ed0', 'hex'),
  0,
  'active',
  'standard',
  NOW()
)
ON CONFLICT (prover_id) DO UPDATE
SET sphincs_pubkey = EXCLUDED.sphincs_pubkey,
    status         = 'active',
    approved_at    = NOW();

-- Prover 2: 0xece5fc0d9c21a01ee736eeec600df7f81b10b6e5
-- SLH-DSA-SHAKE-128s pubkey: 0x7d7523153f333b86a53c21536fc769f20995adfe052c749921ef15c19d30a870
INSERT INTO provers (prover_id, operator_addr, sphincs_pubkey, stake_amount, status, tier, approved_at)
VALUES (
  '0xece5fc0d9c21a01ee736eeec600df7f81b10b6e5',
  '0xece5fc0d9c21a01ee736eeec600df7f81b10b6e5',
  decode('7d7523153f333b86a53c21536fc769f20995adfe052c749921ef15c19d30a870', 'hex'),
  0,
  'active',
  'standard',
  NOW()
)
ON CONFLICT (prover_id) DO UPDATE
SET sphincs_pubkey = EXCLUDED.sphincs_pubkey,
    status         = 'active',
    approved_at    = NOW();

-- Show final state
\echo ''
\echo '=== Provers (after) ==='
SELECT prover_id, operator_addr, status, length(sphincs_pubkey) AS pk_len, approved_at
FROM provers
ORDER BY status DESC, prover_id;

\echo ''
\echo '=== Active count (should be >= 2) ==='
SELECT count(*) AS active_count FROM provers WHERE status = 'active';

COMMIT;
