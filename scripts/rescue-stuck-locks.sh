#!/usr/bin/env bash
# =============================================================================
# Quantum Shield - 旧 v2 Vault のスタックロック救出スクリプト
# =============================================================================
# 0x108A5CE65... (旧 v2 vault) にある 6件のスタックロックを
# 緊急アンロックで救出します。
#
# 前提条件:
#   - forge (Foundry) がインストール済み: https://getfoundry.sh
#   - deployer/sender と同じウォレットの PRIVATE_KEY
#   - 各ロックに 0.5 ETH のボンドが必要 (計 3 ETH 程度)
#
# 使い方:
#   export PRIVATE_KEY=<deployer_hex_without_0x>
#   export SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/<key>
#   bash scripts/rescue-stuck-locks.sh
#
# フロー:
#   1. CheckRescueStatus  - 現在の状態確認
#   2. RescueLocks        - 緊急アンロック申請 (7日待機 + 0.5 ETH ボンド/件)
#   3. ExecuteRescue      - 7日後に実行 (ボンド返還)
# =============================================================================
set -euo pipefail

: "${PRIVATE_KEY:?  ERROR: PRIVATE_KEY をセットしてください}"
: "${SEPOLIA_RPC_URL:?  ERROR: SEPOLIA_RPC_URL をセットしてください}"

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CONTRACTS_DIR="$REPO_ROOT/src/l1/contracts"

echo "=== Step 1: スタックロック状況確認 ==="
cd "$CONTRACTS_DIR"
forge script script/RescueLocks.s.sol:CheckRescueStatus \
  --rpc-url "$SEPOLIA_RPC_URL" \
  -vv

echo ""
echo "=== Step 2: 緊急アンロック申請 (1件ずつ) ==="
echo "NOTE: 各ロックに 0.5 ETH のボンドが必要です"
echo "      申請後 7日間待機が必要です"
echo ""
read -p "申請を続けますか? [y/N] " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
  forge script script/RescueLocks.s.sol:RescueLocks \
    --rpc-url "$SEPOLIA_RPC_URL" \
    --private-key "$PRIVATE_KEY" \
    --broadcast \
    -vv
  echo ""
  echo "申請完了。7日後に以下を実行:"
  echo "  bash scripts/rescue-stuck-locks.sh --execute"
else
  echo "スキップしました"
fi

# --execute フラグで緊急アンロック実行
if [[ "${1:-}" == "--execute" ]]; then
  echo ""
  echo "=== Step 3: 緊急アンロック実行 ==="
  forge script script/RescueLocks.s.sol:ExecuteRescue \
    --rpc-url "$SEPOLIA_RPC_URL" \
    --private-key "$PRIVATE_KEY" \
    --broadcast \
    -vv
fi
