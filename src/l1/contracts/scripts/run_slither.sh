#!/bin/bash
# ============================================================
# Quantum Shield - Slither Security Analysis Script
# ============================================================
# 使用方法:
#   cd quantum-shield/contracts
#   ./scripts/run_slither.sh
#
# 前提条件:
#   - Python 3.8+
#   - pip
#   - Foundry (forge)
# ============================================================

set -e

# 色付き出力
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║       Quantum Shield - Slither Security Analysis          ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"

# ============================================================
# Step 1: 環境チェック
# ============================================================
echo -e "\n${YELLOW}[1/6] 環境チェック...${NC}"

# Python確認
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}Error: Python3 が見つかりません${NC}"
    exit 1
fi
echo -e "  ✓ Python3: $(python3 --version)"

# pip確認
if ! command -v pip3 &> /dev/null; then
    echo -e "${RED}Error: pip3 が見つかりません${NC}"
    exit 1
fi
echo -e "  ✓ pip3: $(pip3 --version | head -c 20)..."

# Foundry確認
if ! command -v forge &> /dev/null; then
    echo -e "${RED}Error: Foundry (forge) が見つかりません${NC}"
    echo -e "  インストール: curl -L https://foundry.paradigm.xyz | bash"
    exit 1
fi
echo -e "  ✓ Forge: $(forge --version | head -c 30)..."

# ============================================================
# Step 2: Slitherインストール
# ============================================================
echo -e "\n${YELLOW}[2/6] Slither インストール/更新...${NC}"

pip3 install slither-analyzer --upgrade --quiet
pip3 install solc-select --upgrade --quiet

echo -e "  ✓ Slither: $(slither --version 2>/dev/null || echo 'installed')"

# ============================================================
# Step 3: Solcバージョン設定
# ============================================================
echo -e "\n${YELLOW}[3/6] Solidity コンパイラ設定...${NC}"

solc-select install 0.8.20 2>/dev/null || true
solc-select use 0.8.20

echo -e "  ✓ solc: $(solc --version | grep Version)"

# ============================================================
# Step 4: Foundryビルド
# ============================================================
echo -e "\n${YELLOW}[4/6] Foundry ビルド...${NC}"

# 既存のビルドをクリーン
forge clean 2>/dev/null || true

# ビルド実行
forge build --force

echo -e "  ✓ ビルド完了"

# ============================================================
# Step 5: Slither実行
# ============================================================
echo -e "\n${YELLOW}[5/6] Slither 分析実行...${NC}"

# 出力ディレクトリ作成
REPORT_DIR="slither-reports"
mkdir -p "$REPORT_DIR"

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
REPORT_FILE="$REPORT_DIR/slither_report_${TIMESTAMP}.md"
JSON_FILE="$REPORT_DIR/slither_report_${TIMESTAMP}.json"

echo -e "  分析中... (数分かかる場合があります)"

# Slither実行 (Foundry用設定)
slither . \
    --foundry-out-directory out \
    --exclude-dependencies \
    --exclude-informational \
    --exclude-low \
    --json "$JSON_FILE" \
    --markdown-root . \
    2>&1 | tee "$REPORT_DIR/slither_output_${TIMESTAMP}.txt" || true

# ============================================================
# Step 6: レポート生成
# ============================================================
echo -e "\n${YELLOW}[6/6] レポート生成...${NC}"

# Markdownレポート作成
cat > "$REPORT_FILE" << EOF
# Slither Security Analysis Report

**Generated:** $(date -u +"%Y-%m-%d %H:%M:%S UTC")
**Project:** Quantum Shield
**Branch:** dev/phase2-native-stark
**Solidity Version:** 0.8.20

## Summary

EOF

# JSONからサマリー抽出
if [ -f "$JSON_FILE" ]; then
    HIGH_COUNT=$(jq '[.results.detectors[] | select(.impact == "High")] | length' "$JSON_FILE" 2>/dev/null || echo "0")
    MEDIUM_COUNT=$(jq '[.results.detectors[] | select(.impact == "Medium")] | length' "$JSON_FILE" 2>/dev/null || echo "0")
    LOW_COUNT=$(jq '[.results.detectors[] | select(.impact == "Low")] | length' "$JSON_FILE" 2>/dev/null || echo "0")
    INFO_COUNT=$(jq '[.results.detectors[] | select(.impact == "Informational")] | length' "$JSON_FILE" 2>/dev/null || echo "0")
    
    cat >> "$REPORT_FILE" << EOF
| Severity | Count |
|----------|-------|
| 🔴 High | $HIGH_COUNT |
| 🟠 Medium | $MEDIUM_COUNT |
| 🟡 Low | $LOW_COUNT |
| 🔵 Informational | $INFO_COUNT |

## Findings

EOF

    # 各検出項目をMarkdownに追加
    jq -r '.results.detectors[] | "### \(.check)\n\n**Impact:** \(.impact) | **Confidence:** \(.confidence)\n\n\(.description)\n\n---\n"' "$JSON_FILE" >> "$REPORT_FILE" 2>/dev/null || true
fi

# ============================================================
# 結果表示
# ============================================================
echo -e "\n${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                    分析完了                                ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"

echo -e "\n${BLUE}レポートファイル:${NC}"
echo -e "  📄 Markdown: $REPORT_FILE"
echo -e "  📊 JSON:     $JSON_FILE"
echo -e "  📝 Log:      $REPORT_DIR/slither_output_${TIMESTAMP}.txt"

# サマリー表示
if [ -f "$JSON_FILE" ]; then
    echo -e "\n${BLUE}検出サマリー:${NC}"
    echo -e "  🔴 High:          $HIGH_COUNT"
    echo -e "  🟠 Medium:        $MEDIUM_COUNT"
    echo -e "  🟡 Low:           $LOW_COUNT"
    echo -e "  🔵 Informational: $INFO_COUNT"
    
    if [ "$HIGH_COUNT" -gt 0 ] || [ "$MEDIUM_COUNT" -gt 0 ]; then
        echo -e "\n${RED}⚠️  重要な問題が検出されました。レポートを確認してください。${NC}"
    else
        echo -e "\n${GREEN}✅ 重大な問題は検出されませんでした。${NC}"
    fi
fi
