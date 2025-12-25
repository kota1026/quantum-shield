#!/bin/bash
# Deploy script for Sepolia testnet
# Part of [INFRA-001] Testnet Environment Setup

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=====================================${NC}"
echo -e "${GREEN}Quantum Shield - Sepolia Deployment${NC}"
echo -e "${GREEN}=====================================${NC}"

# Check environment variables
if [ -z "$SEPOLIA_RPC_URL" ]; then
    echo -e "${RED}Error: SEPOLIA_RPC_URL is not set${NC}"
    echo "Please set it in your .env file or export it"
    exit 1
fi

if [ -z "$DEPLOYER_PRIVATE_KEY" ]; then
    echo -e "${RED}Error: DEPLOYER_PRIVATE_KEY is not set${NC}"
    echo "Please set it in your .env file or export it"
    exit 1
fi

# Optional: Etherscan API key for verification
VERIFY_FLAG=""
if [ -n "$ETHERSCAN_API_KEY" ]; then
    VERIFY_FLAG="--verify --etherscan-api-key $ETHERSCAN_API_KEY"
    echo -e "${GREEN}✓ Etherscan verification enabled${NC}"
fi

# Change to contracts directory
cd "$(dirname "$0")/../../../contracts"

echo ""
echo -e "${YELLOW}Step 1: Compiling contracts...${NC}"
forge build

echo ""
echo -e "${YELLOW}Step 2: Running tests before deployment...${NC}"
forge test --match-path "test/AIRConstraintsTest.t.sol" -v

echo ""
echo -e "${YELLOW}Step 3: Deploying to Sepolia...${NC}"

# Deploy AIRConstraints
echo "Deploying AIRConstraints..."
AIR_RESULT=$(forge create \
    --rpc-url $SEPOLIA_RPC_URL \
    --private-key $DEPLOYER_PRIVATE_KEY \
    $VERIFY_FLAG \
    src/stark/AIRConstraints.sol:AIRConstraints \
    2>&1)

AIR_ADDRESS=$(echo "$AIR_RESULT" | grep "Deployed to:" | awk '{print $3}')
echo -e "${GREEN}✓ AIRConstraints deployed to: $AIR_ADDRESS${NC}"

# Deploy ConstraintEvaluator
echo "Deploying ConstraintEvaluator..."
EVAL_RESULT=$(forge create \
    --rpc-url $SEPOLIA_RPC_URL \
    --private-key $DEPLOYER_PRIVATE_KEY \
    $VERIFY_FLAG \
    src/stark/ConstraintEvaluator.sol:ConstraintEvaluator \
    2>&1)

EVAL_ADDRESS=$(echo "$EVAL_RESULT" | grep "Deployed to:" | awk '{print $3}')
echo -e "${GREEN}✓ ConstraintEvaluator deployed to: $EVAL_ADDRESS${NC}"

# Save deployment addresses
DEPLOYMENT_FILE="../deployments/sepolia/$(date +%Y%m%d_%H%M%S).json"
mkdir -p "../deployments/sepolia"

cat > "$DEPLOYMENT_FILE" << EOF
{
  "network": "sepolia",
  "chainId": 11155111,
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "contracts": {
    "AIRConstraints": "$AIR_ADDRESS",
    "ConstraintEvaluator": "$EVAL_ADDRESS"
  },
  "deployer": "$(cast wallet address --private-key $DEPLOYER_PRIVATE_KEY 2>/dev/null || echo 'unknown')"
}
EOF

echo ""
echo -e "${GREEN}=====================================${NC}"
echo -e "${GREEN}Deployment Complete!${NC}"
echo -e "${GREEN}=====================================${NC}"
echo ""
echo "Deployment record saved to: $DEPLOYMENT_FILE"
echo ""
echo "Contract Addresses:"
echo "  AIRConstraints:       $AIR_ADDRESS"
echo "  ConstraintEvaluator:  $EVAL_ADDRESS"
echo ""
echo "Verify on Etherscan:"
echo "  https://sepolia.etherscan.io/address/$AIR_ADDRESS"
echo "  https://sepolia.etherscan.io/address/$EVAL_ADDRESS"
