#!/usr/bin/env bash
# =============================================================================
# Quantum Shield - Phase 1 L1 Configuration (idempotent)
# =============================================================================
# Sets L1Vault + ProverRegistry to Phase 1 bridge mode:
#   Step 1: vault.setProverRegistry(REGISTRY)     - link Vault <-> Registry
#   Step 2: vault.setFullVerification(false)      - off-chain real FIPS 205
#                                                   verify, on-chain identity
#                                                   gate only (_verifySimplified)
#   Step 3: registry.registerProverTestnet(P1, pk1) - real SLH-DSA pubkey
#   Step 4: registry.registerProverTestnet(P2, pk2)
#
# All steps are idempotent: a step is skipped if already done.
#
# Operator addresses are fresh (from keygen.ts ethereum_address). The legacy
# placeholder slots 0x...01 / 0x...02 in the registry cannot be updated
# because registerProverTestnet only works on NONE-status provers and no
# ECDSA key exists for those addresses to call requestExit.
#
# Requirements:
#   - cast (foundry): curl -L https://foundry.paradigm.xyz | bash && foundryup
#   - Sepolia RPC access
#   - Deployer (= vault owner) private key
#
# Usage:
#   export PRIVATE_KEY=<deployer_hex_without_0x>
#   export SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/<key>
#   bash scripts/configure-l1-phase1.sh
# =============================================================================
set -euo pipefail

: "${PRIVATE_KEY:?  ERROR: set PRIVATE_KEY env var (hex, without 0x)}"
: "${SEPOLIA_RPC_URL:?  ERROR: set SEPOLIA_RPC_URL env var}"

VAULT="0x07012aeF87C6E423c32F2f8eaF81762f63337260"
REGISTRY="0x08e1fc1A0d614bc132B48950760c7A291cCB8946"

# Fresh operator addresses (from secrets/provers/{prover1,prover2}.env)
PROVER_001="0x9b8d4139a12a916f9269de6f2a019b36ea613a73"
PROVER_002="0xece5fc0d9c21a01ee736eeec600df7f81b10b6e5"

# Real SLH-DSA-SHAKE-128s public keys
PK_001="0x45fc636754a029a1e5412beaaa05657dcb9881a0a1fe138f9259b22771f50ed0"
PK_002="0x7d7523153f333b86a53c21536fc769f20995adfe052c749921ef15c19d30a870"

CAST_SEND="--rpc-url $SEPOLIA_RPC_URL --private-key $PRIVATE_KEY"
CAST_READ="--rpc-url $SEPOLIA_RPC_URL"

echo "=== Quantum Shield Phase 1 Bridge Configuration (idempotent) ==="
echo "Vault   : $VAULT"
echo "Registry: $REGISTRY"
echo "Prover 1: $PROVER_001"
echo "Prover 2: $PROVER_002"
echo "RPC     : $SEPOLIA_RPC_URL"
echo ""

# ── Step 1: Link ProverRegistry to Vault (idempotent) ────────────────────────
echo "[1/4] vault.setProverRegistry check..."
CURRENT_REG=$(cast call $VAULT "proverRegistry()(address)" $CAST_READ)
CURRENT_REG_LOWER=$(echo $CURRENT_REG | tr '[:upper:]' '[:lower:]')
EXPECTED_REG_LOWER=$(echo $REGISTRY | tr '[:upper:]' '[:lower:]')
if [ "$CURRENT_REG_LOWER" = "$EXPECTED_REG_LOWER" ]; then
  echo "  SKIP: already set to $REGISTRY"
else
  echo "  sending setProverRegistry($REGISTRY)..."
  cast send $VAULT "setProverRegistry(address)" "$REGISTRY" $CAST_SEND
  echo "  OK"
fi

# ── Step 2: Switch to simplified verification (idempotent) ───────────────────
echo "[2/4] vault.setFullVerification check..."
CURRENT_FULL=$(cast call $VAULT "useFullVerification()(bool)" $CAST_READ)
if [ "$CURRENT_FULL" = "false" ]; then
  echo "  SKIP: useFullVerification already false"
else
  echo "  sending setFullVerification(false)..."
  cast send $VAULT "setFullVerification(bool)" false $CAST_SEND
  echo "  OK — on-chain uses _verifySimplified (identity gate only)"
fi

# ── Step 3: Register Prover 001 (idempotent) ─────────────────────────────────
echo "[3/4] registry.registerProverTestnet($PROVER_001) check..."
P1_ACTIVE=$(cast call $REGISTRY "isActiveProver(address)(bool)" $PROVER_001 $CAST_READ)
if [ "$P1_ACTIVE" = "true" ]; then
  echo "  SKIP: prover 001 already active"
else
  echo "  sending registerProverTestnet($PROVER_001, $PK_001)..."
  cast send $REGISTRY \
    "registerProverTestnet(address,bytes)" "$PROVER_001" "$PK_001" \
    $CAST_SEND
  echo "  OK"
fi

# ── Step 4: Register Prover 002 (idempotent) ─────────────────────────────────
echo "[4/4] registry.registerProverTestnet($PROVER_002) check..."
P2_ACTIVE=$(cast call $REGISTRY "isActiveProver(address)(bool)" $PROVER_002 $CAST_READ)
if [ "$P2_ACTIVE" = "true" ]; then
  echo "  SKIP: prover 002 already active"
else
  echo "  sending registerProverTestnet($PROVER_002, $PK_002)..."
  cast send $REGISTRY \
    "registerProverTestnet(address,bytes)" "$PROVER_002" "$PK_002" \
    $CAST_SEND
  echo "  OK"
fi

# ── Final verification ───────────────────────────────────────────────────────
echo ""
echo "=== Final Verification ==="
FULL_VER=$(cast call $VAULT "useFullVerification()(bool)" $CAST_READ)
ACTIVE=$(cast call $REGISTRY "getActiveProverCount()(uint256)" $CAST_READ)
P1_FINAL=$(cast call $REGISTRY "isActiveProver(address)(bool)" $PROVER_001 $CAST_READ)
P2_FINAL=$(cast call $REGISTRY "isActiveProver(address)(bool)" $PROVER_002 $CAST_READ)
PK1_ONCHAIN=$(cast call $REGISTRY "getPublicKey(address)(bytes)" $PROVER_001 $CAST_READ)
PK2_ONCHAIN=$(cast call $REGISTRY "getPublicKey(address)(bytes)" $PROVER_002 $CAST_READ)

echo "useFullVerification  : $FULL_VER  (want: false)"
echo "active prover count  : $ACTIVE"
echo "prover 001 active    : $P1_FINAL  (want: true)"
echo "prover 002 active    : $P2_FINAL  (want: true)"
echo "prover 001 onchain pk: $PK1_ONCHAIN"
echo "prover 002 onchain pk: $PK2_ONCHAIN"

if [ "$FULL_VER" = "false" ] && [ "$P1_FINAL" = "true" ] && [ "$P2_FINAL" = "true" ]; then
  echo ""
  echo "All checks passed. Phase 1 bridge is LIVE on Sepolia."
  echo ""
  echo "Operator addresses for backend DB / secrets/provers/*.env:"
  echo "  prover1: $PROVER_001"
  echo "  prover2: $PROVER_002"
else
  echo ""
  echo "ERROR: Some checks failed. Review tx receipts above." >&2
  exit 1
fi
