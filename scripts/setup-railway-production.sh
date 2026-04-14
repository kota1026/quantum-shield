#!/usr/bin/env bash
# =============================================================================
# Quantum Shield - Railway 本番環境セットアップ (あなたのPCから実行)
# =============================================================================
# 前提条件:
#   - psql コマンドが使えること
#   - RAILWAY_DB_URL 環境変数をセット
#
# 使い方:
#   export RAILWAY_DB_URL="postgresql://postgres:WLrGiYLolXtJkyIikibBHxeYxYhoefqe@interchange.proxy.rlwy.net:42013/railway"
#   bash scripts/setup-railway-production.sh
# =============================================================================
set -euo pipefail

: "${RAILWAY_DB_URL:?  ERROR: RAILWAY_DB_URL をセットしてください}"

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "=== Step 1: Railway Postgres に実プロバーキーをシード ==="
psql "$RAILWAY_DB_URL" -f "$REPO_ROOT/scripts/seed-real-provers.sql"
echo "  OK"

echo ""
echo "=== Step 2: プロバーの状態確認 ==="
psql "$RAILWAY_DB_URL" -c "SELECT prover_id, status, length(sphincs_pubkey) AS pk_len FROM provers ORDER BY status DESC;"

echo ""
echo "=== 完了 ==="
echo ""
echo "次のステップ (Railway ダッシュボードで手動設定):"
echo ""
echo "1. AI Prover サービスを2つ作成:"
echo "   Source: kota1026/quantum-shield / src/agents/ai-prover"
echo ""
echo "   Prover 1 の環境変数:"
echo "   ANTHROPIC_API_KEY=<your-key>"
echo "   API_URL=https://<backend>.railway.app"
echo "   PROVER_ID=0x9b8d4139a12a916f9269de6f2a019b36ea613a73"
echo "   PROVER_SPHINCS_PK=0x45fc636754a029a1e5412beaaa05657dcb9881a0a1fe138f9259b22771f50ed0"
echo "   PROVER_SPHINCS_SK=0xf4768f622a1130682bd011326bd043305ceabc2657a15d194c219a5ca8ecbd1a45fc636754a029a1e5412beaaa05657dcb9881a0a1fe138f9259b22771f50ed0"
echo "   AGENT_NAME=AI-Prover-1"
echo ""
echo "   Prover 2 の環境変数:"
echo "   ANTHROPIC_API_KEY=<your-key>"
echo "   API_URL=https://<backend>.railway.app"
echo "   PROVER_ID=0xece5fc0d9c21a01ee736eeec600df7f81b10b6e5"
echo "   PROVER_SPHINCS_PK=0x7d7523153f333b86a53c21536fc769f20995adfe052c749921ef15c19d30a870"
echo "   PROVER_SPHINCS_SK=0xabad4d4ea72a834ef0fc841efa4571f3e92341b6cde1d88d1e3a5914630025997d7523153f333b86a53c21536fc769f20995adfe052c749921ef15c19d30a870"
echo "   AGENT_NAME=AI-Prover-2"
