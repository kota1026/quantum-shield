#!/usr/bin/env bash
# =============================================================================
# Quantum Shield - Phase 1 L1 Configuration
# =============================================================================
# Sets L1Vault + ProverRegistry to Phase 1 bridge mode:
#   - useFullVerification = false  (simplified on-chain identity gate)
#   - SPHINCS+ pubkeys updated to real FIPS 205 keys
#
# Requirements (on your LOCAL machine):
#   - foundry installed: curl -L https://foundry.paradigm.xyz | bash && foundryup
#   - Sepolia RPC access
#   - Deployer private key (Vault owner)
#
# Usage:
#   export PRIVATE_KEY=<deployer_hex_without_0x>
#   export SEPOLIA_RPC_URL=https://rpc.sepolia.org   # or Alchemy/Infura URL
#   bash scripts/configure-l1-phase1.sh
# =============================================================================
set -euo pipefail

: "${PRIVATE_KEY:?  ERROR: set PRIVATE_KEY env var (hex, without 0x)}"
: "${SEPOLIA_RPC_URL:?  ERROR: set SEPOLIA_RPC_URL env var}"

VAULT="0x07012aeF87C6E423c32F2f8eaF81762f63337260"
REGISTRY="0x08e1fc1A0d614bc132B48950760c7A291cCB8946"
PROVER_001="0x0000000000000000000000000000000000000001"
PROVER_002="0x0000000000000000000000000000000000000002"
# Real SLH-DSA-SHAKE-128s public keys (secrets/provers/prover1.env / prover2.env)
PK_001="0x45fc636754a029a1e5412beaaa05657dcb9881a0a1fe138f9259b22771f50ed0"
PK_002="0x7d7523153f333b86a53c21536fc769f20995adfe052c749921ef15c19d30a870"

CAST_OPTS="--rpc-url $SEPOLIA_RPC_URL --private-key $PRIVATE_KEY"

echo "=== Quantum Shield Phase 1 Bridge Configuration ==="
echo "Vault   : $VAULT"
echo "Registry: $REGISTRY"
echo "RPC     : $SEPOLIA_RPC_URL"
echo ""

# ── Step 1: Link ProverRegistry to Vault ─────────────────────────────────────
echo "[1/4] vault.setProverRegistry($REGISTRY) ..."
cast send $VAULT "setProverRegistry(address)" "$REGISTRY" $CAST_OPTS
echo "  OK"

# ── Step 2: Switch to simplified verification (Phase 1 bridge) ───────────────
echo "[2/4] vault.setFullVerification(false) ..."
cast send $VAULT "setFullVerification(bool)" false $CAST_OPTS
echo "  OK — on-chain uses _verifySimplified (identity gate only)"

# ── Step 3: Register Prover 001 with real SLH-DSA-SHAKE-128s pubkey ──────────
echo "[3/4] registry.registerProverTestnet(PROVER_001, real_pk) ..."
cast send $REGISTRY \
  "registerProverTestnet(address,bytes)" "$PROVER_001" "$PK_001" \
  $CAST_OPTS
echo "  OK"

# ── Step 4: Register Prover 002 with real SLH-DSA-SHAKE-128s pubkey ──────────
echo "[4/4] registry.registerProverTestnet(PROVER_002, real_pk) ..."
cast send $REGISTRY \
  "registerProverTestnet(address,bytes)" "$PROVER_002" "$PK_002" \
  $CAST_OPTS
echo "  OK"

# ── Verification (read-only) ──────────────────────────────────────────────────
echo ""
echo "=== Verification ==="
FULL_VER=$(cast call $VAULT "useFullVerification()(bool)" --rpc-url $SEPOLIA_RPC_URL)
ACTIVE=$(cast call $REGISTRY "getActiveProverCount()(uint256)" --rpc-url $SEPOLIA_RPC_URL)
P1_ACTIVE=$(cast call $REGISTRY "isActiveProver(address)(bool)" $PROVER_001 --rpc-url $SEPOLIA_RPC_URL)
P2_ACTIVE=$(cast call $REGISTRY "isActiveProver(address)(bool)" $PROVER_002 --rpc-url $SEPOLIA_RPC_URL)

echo "useFullVerification : $FULL_VER  (want: false)"
echo "active provers      : $ACTIVE"
echo "prover 001 active   : $P1_ACTIVE  (want: true)"
echo "prover 002 active   : $P2_ACTIVE  (want: true)"

if [ "$FULL_VER" = "false" ] && [ "$P1_ACTIVE" = "true" ] && [ "$P2_ACTIVE" = "true" ]; then
  echo ""
  echo "All checks passed. Phase 1 bridge is LIVE on Sepolia."
else
  echo ""
  echo "ERROR: Some checks failed. Review tx receipts above." >&2
  exit 1
fi
