#!/bin/bash
# Bump nonce on mainnet by sending empty transactions to self
# This script sends 460 transactions to reach nonce 469

set -e

PRIVATE_KEY="0xREDACTED_ETH_PRIVATE_KEY"
RPC_URL="https://eth.llamarpc.com"
FROM_ADDRESS="0xe69BB031877Cdf6c001BdAEDC0A615B40484CDC3"
TARGET_NONCE=469

# Get current nonce
CURRENT_NONCE=$(cast nonce $FROM_ADDRESS --rpc-url $RPC_URL)
echo "Current nonce: $CURRENT_NONCE"
echo "Target nonce: $TARGET_NONCE"

NEEDED=$((TARGET_NONCE - CURRENT_NONCE))
echo "Need to send $NEEDED transactions"

if [ $NEEDED -le 0 ]; then
    echo "Already at or past target nonce!"
    exit 0
fi

# Estimate gas price
GAS_PRICE=$(cast gas-price --rpc-url $RPC_URL)
echo "Current gas price: $GAS_PRICE wei"

# Calculate total cost (21000 gas per tx)
TOTAL_GAS=$((21000 * NEEDED))
TOTAL_COST_WEI=$((TOTAL_GAS * GAS_PRICE / 1000000000000000000))
echo "Estimated total cost: ~$TOTAL_COST_WEI ETH"

read -p "Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
fi

# Send transactions in batches
BATCH_SIZE=50
for ((i=0; i<NEEDED; i+=BATCH_SIZE)); do
    END=$((i + BATCH_SIZE))
    if [ $END -gt $NEEDED ]; then
        END=$NEEDED
    fi

    echo "Sending transactions $i to $END..."

    for ((j=i; j<END; j++)); do
        # Send 0 ETH to self
        cast send $FROM_ADDRESS --value 0 --private-key $PRIVATE_KEY --rpc-url $RPC_URL --gas-limit 21000 > /dev/null 2>&1 &
    done

    # Wait for batch to complete
    wait

    # Check current nonce
    NEW_NONCE=$(cast nonce $FROM_ADDRESS --rpc-url $RPC_URL)
    echo "Current nonce after batch: $NEW_NONCE"
done

FINAL_NONCE=$(cast nonce $FROM_ADDRESS --rpc-url $RPC_URL)
echo ""
echo "=== DONE ==="
echo "Final nonce: $FINAL_NONCE"
echo "Target was: $TARGET_NONCE"
