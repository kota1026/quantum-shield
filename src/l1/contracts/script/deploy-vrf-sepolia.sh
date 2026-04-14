#!/bin/bash
# =============================================================================
# Quantum Shield VRF Contract Deployment Script
# Deploy VRFConsumerV2Production to Ethereum Sepolia
# =============================================================================

set -e

echo "=========================================="
echo "  Quantum Shield VRF Deployment to Sepolia"
echo "=========================================="

# ── Prerequisites Check ──
command -v forge >/dev/null 2>&1 || { echo "Error: Foundry not installed. Run: curl -L https://foundry.paradigm.xyz | bash && foundryup"; exit 1; }

# ── Configuration ──
# Sepolia VRF Coordinator (Chainlink v2.5)
VRF_COORDINATOR="0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625"

# Sepolia Key Hash (150 gwei gas lane)
KEY_HASH="0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c"

# L1 Vault address (already deployed on Sepolia)
L1_VAULT="0x07012aeF87C6E423c32F2f8eaF81762f63337260"

# ── Environment Variables Required ──
if [ -z "$SEPOLIA_RPC_URL" ]; then
    echo "Error: SEPOLIA_RPC_URL not set"
    echo "  export SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY"
    exit 1
fi

if [ -z "$PRIVATE_KEY" ]; then
    echo "Error: PRIVATE_KEY not set"
    echo "  export PRIVATE_KEY=your_deployer_private_key_hex"
    exit 1
fi

if [ -z "$VRF_SUBSCRIPTION_ID" ]; then
    echo "Error: VRF_SUBSCRIPTION_ID not set"
    echo ""
    echo "  Create a subscription at: https://vrf.chain.link/sepolia"
    echo "  Then: export VRF_SUBSCRIPTION_ID=your_subscription_id"
    exit 1
fi

echo ""
echo "Configuration:"
echo "  Network:          Ethereum Sepolia (11155111)"
echo "  VRF Coordinator:  $VRF_COORDINATOR"
echo "  Key Hash:         $KEY_HASH"
echo "  L1 Vault:         $L1_VAULT"
echo "  Subscription ID:  $VRF_SUBSCRIPTION_ID"
echo "  RPC URL:          $SEPOLIA_RPC_URL"
echo ""

# ── Step 1: Build ──
echo "Step 1: Building contracts..."
cd "$(dirname "$0")/.."
forge build --force
echo "  ✓ Build successful"

# ── Step 2: Deploy ──
echo ""
echo "Step 2: Deploying VRFConsumerV2Production..."
DEPLOY_OUTPUT=$(forge create \
    --rpc-url "$SEPOLIA_RPC_URL" \
    --private-key "$PRIVATE_KEY" \
    --constructor-args \
        "$VRF_COORDINATOR" \
        "$L1_VAULT" \
        "$KEY_HASH" \
        "$VRF_SUBSCRIPTION_ID" \
    src/VRFConsumerV2Production.sol:VRFConsumerV2Production \
    2>&1)

echo "$DEPLOY_OUTPUT"

# Extract deployed address
DEPLOYED_ADDRESS=$(echo "$DEPLOY_OUTPUT" | grep "Deployed to:" | awk '{print $3}')

if [ -z "$DEPLOYED_ADDRESS" ]; then
    echo "Error: Failed to extract deployed address"
    exit 1
fi

echo ""
echo "  ✓ Deployed to: $DEPLOYED_ADDRESS"

# ── Step 3: Verify (optional) ──
if [ -n "$ETHERSCAN_API_KEY" ]; then
    echo ""
    echo "Step 3: Verifying on Etherscan..."
    forge verify-contract \
        --chain-id 11155111 \
        --etherscan-api-key "$ETHERSCAN_API_KEY" \
        --constructor-args $(cast abi-encode "constructor(address,address,bytes32,uint256)" \
            "$VRF_COORDINATOR" "$L1_VAULT" "$KEY_HASH" "$VRF_SUBSCRIPTION_ID") \
        "$DEPLOYED_ADDRESS" \
        src/VRFConsumerV2Production.sol:VRFConsumerV2Production \
        2>&1 || echo "  ⚠ Verification failed (non-fatal)"
else
    echo ""
    echo "Step 3: Skipping Etherscan verification (ETHERSCAN_API_KEY not set)"
fi

# ── Step 4: Post-deployment instructions ──
echo ""
echo "=========================================="
echo "  Deployment Complete!"
echo "=========================================="
echo ""
echo "VRF Contract: $DEPLOYED_ADDRESS"
echo ""
echo "Next steps:"
echo ""
echo "1. Add consumer to Chainlink VRF subscription:"
echo "   Visit: https://vrf.chain.link/sepolia"
echo "   Add consumer: $DEPLOYED_ADDRESS"
echo ""
echo "2. Fund subscription with LINK tokens"
echo "   Get test LINK: https://faucets.chain.link/sepolia"
echo ""
echo "3. Update Railway environment variables:"
echo "   QS__VRF__CONTRACT_ADDRESS=$DEPLOYED_ADDRESS"
echo "   QS__VRF__RPC_URL=$SEPOLIA_RPC_URL"
echo "   QS__VRF__PRIVATE_KEY=\$PRIVATE_KEY"
echo ""
echo "4. Redeploy Railway service to pick up new VRF config"
echo ""

# Save deployment record
DEPLOY_RECORD="deployments/sepolia_vrf_$(date +%Y%m%d_%H%M%S).json"
mkdir -p deployments
cat > "$DEPLOY_RECORD" << EOF
{
    "contract": "VRFConsumerV2Production",
    "address": "$DEPLOYED_ADDRESS",
    "network": "sepolia",
    "chainId": 11155111,
    "vrfCoordinator": "$VRF_COORDINATOR",
    "keyHash": "$KEY_HASH",
    "l1Vault": "$L1_VAULT",
    "subscriptionId": "$VRF_SUBSCRIPTION_ID",
    "deployedAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "deployer": "$(cast wallet address --private-key $PRIVATE_KEY 2>/dev/null || echo 'unknown')"
}
EOF
echo "Deployment record saved: $DEPLOY_RECORD"
