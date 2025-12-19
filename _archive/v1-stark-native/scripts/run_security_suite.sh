#!/bin/bash
# ============================================================================
# Phase 1-3 セキュリティテスト完全実行スクリプト
# ============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}"
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║      QuantumShieldBridge セキュリティ検証スイート              ║"
echo "║                   Phase 1-3 完全実行                          ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Change to project directory
cd "$(dirname "$0")/.."

# Results tracking
declare -A PHASE_RESULTS
TOTAL_TESTS=0
PASSED_TESTS=0

# ============================================================================
# PHASE 1: Forge テスト実行
# ============================================================================

echo -e "\n${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}  PHASE 1: Forge セキュリティテスト${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

# 1.1 基本テスト
echo -e "${BLUE}[1.1] 基本テスト (QuantumShieldBridgeTest)...${NC}"
if forge test --match-contract QuantumShieldBridgeTest -v 2>&1; then
    PHASE_RESULTS["basic_tests"]="✅ PASS"
    ((PASSED_TESTS+=46))
else
    PHASE_RESULTS["basic_tests"]="❌ FAIL"
fi
((TOTAL_TESTS+=46))

# 1.2 リエントランシーテスト
echo -e "\n${BLUE}[1.2] リエントランシーテスト...${NC}"
if forge test --match-contract ReentrancyTest -v 2>&1; then
    PHASE_RESULTS["reentrancy"]="✅ PASS"
    ((PASSED_TESTS+=1))
else
    PHASE_RESULTS["reentrancy"]="❌ FAIL"
fi
((TOTAL_TESTS+=1))

# 1.3 クロスファンクションリエントランシーテスト
echo -e "\n${BLUE}[1.3] クロスファンクションリエントランシーテスト...${NC}"
if forge test --match-contract CrossFunctionReentrancyTest -v 2>&1; then
    PHASE_RESULTS["cross_reentrancy"]="✅ PASS"
    ((PASSED_TESTS+=2))
else
    PHASE_RESULTS["cross_reentrancy"]="❌ FAIL"
fi
((TOTAL_TESTS+=2))

# 1.4 Force-Feed ETHテスト
echo -e "\n${BLUE}[1.4] Force-Feed ETHテスト...${NC}"
if forge test --match-contract ForceFeedETHTest -v 2>&1; then
    PHASE_RESULTS["force_feed"]="✅ PASS"
    ((PASSED_TESTS+=3))
else
    PHASE_RESULTS["force_feed"]="❌ FAIL"
fi
((TOTAL_TESTS+=3))

# 1.5 タイムスタンプ操作テスト
echo -e "\n${BLUE}[1.5] タイムスタンプ操作テスト...${NC}"
if forge test --match-contract TimestampManipulationTest -v 2>&1; then
    PHASE_RESULTS["timestamp"]="✅ PASS"
    ((PASSED_TESTS+=5))
else
    PHASE_RESULTS["timestamp"]="❌ FAIL"
fi
((TOTAL_TESTS+=5))

# 1.6 整数境界テスト
echo -e "\n${BLUE}[1.6] 整数境界テスト...${NC}"
if forge test --match-contract IntegerBoundaryTest -v 2>&1; then
    PHASE_RESULTS["integer_boundary"]="✅ PASS"
    ((PASSED_TESTS+=5))
else
    PHASE_RESULTS["integer_boundary"]="❌ FAIL"
fi
((TOTAL_TESTS+=5))

# 1.7 ストレージスロットテスト
echo -e "\n${BLUE}[1.7] ストレージスロットテスト...${NC}"
if forge test --match-contract StorageSlotTest -v 2>&1; then
    PHASE_RESULTS["storage_slot"]="✅ PASS"
    ((PASSED_TESTS+=3))
else
    PHASE_RESULTS["storage_slot"]="❌ FAIL"
fi
((TOTAL_TESTS+=3))

# 1.8 緊急リカバリーテスト
echo -e "\n${BLUE}[1.8] 緊急リカバリーテスト...${NC}"
if forge test --match-contract EmergencyRecoveryTest -v 2>&1; then
    PHASE_RESULTS["emergency"]="✅ PASS"
    ((PASSED_TESTS+=6))
else
    PHASE_RESULTS["emergency"]="❌ FAIL"
fi
((TOTAL_TESTS+=6))

# 1.9 ガスグリーフィングテスト
echo -e "\n${BLUE}[1.9] ガスグリーフィングテスト...${NC}"
if forge test --match-contract GasGriefingTest -v 2>&1; then
    PHASE_RESULTS["gas_griefing"]="✅ PASS"
    ((PASSED_TESTS+=2))
else
    PHASE_RESULTS["gas_griefing"]="❌ FAIL"
fi
((TOTAL_TESTS+=2))

# 1.10 Fuzzテスト
echo -e "\n${BLUE}[1.10] Fuzzテスト...${NC}"
if forge test --match-contract FuzzTest -v 2>&1; then
    PHASE_RESULTS["fuzz"]="✅ PASS"
    ((PASSED_TESTS+=3))
else
    PHASE_RESULTS["fuzz"]="❌ FAIL"
fi
((TOTAL_TESTS+=3))

# 1.11 Invariantテスト (基本)
echo -e "\n${BLUE}[1.11] Invariantテスト (基本)...${NC}"
if forge test --match-contract "^InvariantTest$" -v 2>&1; then
    PHASE_RESULTS["invariant_basic"]="✅ PASS"
    ((PASSED_TESTS+=4))
else
    PHASE_RESULTS["invariant_basic"]="❌ FAIL"
fi
((TOTAL_TESTS+=4))

# 1.12 Invariantテスト (拡張)
echo -e "\n${BLUE}[1.12] Invariantテスト (拡張)...${NC}"
if forge test --match-contract ExtendedInvariantTest -v 2>&1; then
    PHASE_RESULTS["invariant_extended"]="✅ PASS"
    ((PASSED_TESTS+=4))
else
    PHASE_RESULTS["invariant_extended"]="❌ FAIL"
fi
((TOTAL_TESTS+=4))

# ============================================================================
# PHASE 2: 静的解析
# ============================================================================

echo -e "\n${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}  PHASE 2: 静的解析${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

# 2.1 Slither静的解析
echo -e "${BLUE}[2.1] Slither静的解析...${NC}"
if command -v slither &> /dev/null; then
    if slither . --config-file slither.config.json 2>&1 | tee slither-output.txt; then
        HIGH=$(grep -c '"impact": "High"' slither-report.json 2>/dev/null || echo "0")
        MEDIUM=$(grep -c '"impact": "Medium"' slither-report.json 2>/dev/null || echo "0")

        if [ "$HIGH" = "0" ] && [ "$MEDIUM" = "0" ]; then
            PHASE_RESULTS["slither"]="✅ PASS (High:0, Medium:0)"
        else
            PHASE_RESULTS["slither"]="⚠️ WARN (High:$HIGH, Medium:$MEDIUM)"
        fi
    else
        PHASE_RESULTS["slither"]="❌ FAIL"
    fi
else
    PHASE_RESULTS["slither"]="⏭️ SKIP (not installed)"
    echo -e "${YELLOW}⚠️ Slitherがインストールされていません${NC}"
    echo -e "${YELLOW}   インストール: pip install slither-analyzer${NC}"
fi

# 2.2 Coverage Report
echo -e "\n${BLUE}[2.2] Coverage Report...${NC}"
if forge coverage --report summary 2>&1 | tee coverage-output.txt; then
    COVERAGE=$(grep -oP 'lines.*?(\d+\.\d+)%' coverage-output.txt | grep -oP '\d+\.\d+' | head -1 || echo "0")
    if [ -n "$COVERAGE" ]; then
        COVERAGE_INT=${COVERAGE%.*}
        if [ "$COVERAGE_INT" -ge 85 ]; then
            PHASE_RESULTS["coverage"]="✅ PASS (${COVERAGE}%)"
        else
            PHASE_RESULTS["coverage"]="⚠️ WARN (${COVERAGE}%, target: 85%)"
        fi
    else
        PHASE_RESULTS["coverage"]="✅ Generated"
    fi
else
    PHASE_RESULTS["coverage"]="❌ FAIL"
fi

# 2.3 Gas Report
echo -e "\n${BLUE}[2.3] Gas Report...${NC}"
forge test --gas-report 2>&1 | tee gas-report.txt
PHASE_RESULTS["gas_report"]="✅ Generated"

# ============================================================================
# サマリーレポート
# ============================================================================

echo -e "\n${BLUE}"
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                    検証結果サマリー                            ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

echo -e "\n${YELLOW}━━━ Phase 1: Forgeテスト ━━━${NC}"
for test in basic_tests reentrancy cross_reentrancy force_feed timestamp integer_boundary storage_slot emergency gas_griefing fuzz invariant_basic invariant_extended; do
    if [ -n "${PHASE_RESULTS[$test]}" ]; then
        echo -e "  $test: ${PHASE_RESULTS[$test]}"
    fi
done

echo -e "\n${YELLOW}━━━ Phase 2: 静的解析 ━━━${NC}"
for tool in slither coverage gas_report; do
    if [ -n "${PHASE_RESULTS[$tool]}" ]; then
        echo -e "  $tool: ${PHASE_RESULTS[$tool]}"
    fi
done

# Calculate totals
PHASE1_PASS=$(echo "${PHASE_RESULTS[@]}" | grep -o "✅" | wc -l || echo "0")
PHASE1_TOTAL=${#PHASE_RESULTS[@]}

echo -e "\n${YELLOW}━━━ 統計 ━━━${NC}"
echo -e "  カテゴリPASS: $PHASE1_PASS/$PHASE1_TOTAL"
echo -e "  総テスト数: $TOTAL_TESTS"
echo -e "  PASSテスト数: $PASSED_TESTS"

# Final verdict
echo ""
if [ "$PASSED_TESTS" -eq "$TOTAL_TESTS" ]; then
    echo -e "${GREEN}🎉 全テスト完了！監査準備完了レベル (Level 4) に到達しました！${NC}"
    echo ""
    echo -e "${GREEN}次のステップ:${NC}"
    echo -e "  1. セキュリティドキュメントの最終確認 (docs/SECURITY.md)"
    echo -e "  2. 外部監査の依頼"
    echo -e "  3. Bug Bountyプログラムの設置"
else
    echo -e "${YELLOW}⚠️ $((TOTAL_TESTS - PASSED_TESTS)) テストが失敗しました。上記の詳細を確認してください。${NC}"
fi

# Generate report file
REPORT_FILE="security_report_$(date +%Y%m%d_%H%M%S).md"
cat > "$REPORT_FILE" << REPORT
# QuantumShieldBridge セキュリティレポート
生成日時: $(date)

## Phase 1: Forgeテスト結果
$(for test in basic_tests reentrancy cross_reentrancy force_feed timestamp integer_boundary storage_slot emergency gas_griefing fuzz invariant_basic invariant_extended; do
    if [ -n "${PHASE_RESULTS[$test]}" ]; then
        echo "- $test: ${PHASE_RESULTS[$test]}"
    fi
done)

## Phase 2: 静的解析結果
$(for tool in slither coverage gas_report; do
    if [ -n "${PHASE_RESULTS[$tool]}" ]; then
        echo "- $tool: ${PHASE_RESULTS[$tool]}"
    fi
done)

## 統計
- カテゴリPASS: $PHASE1_PASS/$PHASE1_TOTAL
- 総テスト数: $TOTAL_TESTS
- PASSテスト数: $PASSED_TESTS

## 次のステップ
1. 外部監査依頼
2. Bug Bountyプログラム設置
3. Mainnetデプロイ準備
REPORT

echo -e "\n${BLUE}レポート生成: $REPORT_FILE${NC}"
