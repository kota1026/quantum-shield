#!/bin/bash
# ============================================================
# Quantum Shield - CP-1 Compliance Checker
# ============================================================
# keccak256 使用箇所を検出し、CP-1違反をレポート
#
# 使用方法:
#   cd quantum-shield/contracts
#   ./scripts/check_cp1_compliance.sh
# ============================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     Quantum Shield - CP-1 Compliance Check                ║${NC}"
echo -e "${BLUE}║     (keccak256/SHA-256/ECDSA/RSA 使用検出)                ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"

# 出力ディレクトリ
REPORT_DIR="compliance-reports"
mkdir -p "$REPORT_DIR"

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
REPORT_FILE="$REPORT_DIR/cp1_compliance_${TIMESTAMP}.md"

# ============================================================
# 禁止アルゴリズムのパターン
# ============================================================
PROHIBITED_PATTERNS=(
    "keccak256"
    "sha256"
    "ecrecover"
    "ECDSA"
    "RSA"
)

echo -e "\n${YELLOW}[1/4] ソースファイル検索...${NC}"

# srcディレクトリのSolidityファイルを検索
SRC_FILES=$(find src -name "*.sol" -type f 2>/dev/null)
FILE_COUNT=$(echo "$SRC_FILES" | wc -l)

echo -e "  検出ファイル数: $FILE_COUNT"

# レポートヘッダー
cat > "$REPORT_FILE" << EOF
# CP-1 Compliance Report

**Generated:** $(date -u +"%Y-%m-%d %H:%M:%S UTC")
**Project:** Quantum Shield
**Scope:** contracts/src/**/*.sol

## CP-1 Requirements

Per CORE_PRINCIPLES.md, the following algorithms are **PROHIBITED**:
- ❌ keccak256 (Grover's algorithm vulnerable)
- ❌ SHA-256 (Not FIPS 202 compliant for our use)
- ❌ ECDSA (Shor's algorithm vulnerable)
- ❌ RSA (Shor's algorithm vulnerable)

**REQUIRED:**
- ✅ SHA3-256 (FIPS 202)
- ✅ Dilithium-III (FIPS 204)
- ✅ SPHINCS+-128s (FIPS 205)

---

## Scan Results

EOF

echo -e "\n${YELLOW}[2/4] 禁止アルゴリズム検索...${NC}"

VIOLATION_COUNT=0
COMMENT_ONLY_COUNT=0

for pattern in "${PROHIBITED_PATTERNS[@]}"; do
    echo -e "  検索中: $pattern"
    
    echo "### Pattern: \`$pattern\`" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    
    FOUND=false
    
    while IFS= read -r file; do
        [ -z "$file" ] && continue
        
        # パターン検索（行番号付き）
        MATCHES=$(grep -n "$pattern" "$file" 2>/dev/null || true)
        
        if [ -n "$MATCHES" ]; then
            FOUND=true
            echo "#### File: \`$file\`" >> "$REPORT_FILE"
            echo "" >> "$REPORT_FILE"
            echo '```solidity' >> "$REPORT_FILE"
            
            while IFS= read -r match; do
                LINE_NUM=$(echo "$match" | cut -d: -f1)
                LINE_CONTENT=$(echo "$match" | cut -d: -f2-)
                
                # コメントかどうかチェック
                if echo "$LINE_CONTENT" | grep -qE "^\s*(//|/\*|\*)" ; then
                    echo "Line $LINE_NUM: $LINE_CONTENT  // [COMMENT]" >> "$REPORT_FILE"
                    ((COMMENT_ONLY_COUNT++)) || true
                else
                    echo "Line $LINE_NUM: $LINE_CONTENT  // ⚠️ [VIOLATION]" >> "$REPORT_FILE"
                    ((VIOLATION_COUNT++)) || true
                fi
            done <<< "$MATCHES"
            
            echo '```' >> "$REPORT_FILE"
            echo "" >> "$REPORT_FILE"
        fi
    done <<< "$SRC_FILES"
    
    if [ "$FOUND" = false ]; then
        echo "✅ No occurrences found." >> "$REPORT_FILE"
        echo "" >> "$REPORT_FILE"
    fi
    
    echo "---" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
done

echo -e "\n${YELLOW}[3/4] SHA3使用確認...${NC}"

echo "## SHA3-256 Usage (Required)" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

SHA3_COUNT=0
while IFS= read -r file; do
    [ -z "$file" ] && continue
    
    SHA3_MATCHES=$(grep -c "SHA3_256\|SHA3Hasher" "$file" 2>/dev/null || echo "0")
    if [ "$SHA3_MATCHES" -gt 0 ]; then
        echo "- \`$file\`: $SHA3_MATCHES references" >> "$REPORT_FILE"
        SHA3_COUNT=$((SHA3_COUNT + SHA3_MATCHES))
    fi
done <<< "$SRC_FILES"

echo "" >> "$REPORT_FILE"
echo "**Total SHA3-256 references:** $SHA3_COUNT" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

echo -e "  SHA3-256 参照数: $SHA3_COUNT"

echo -e "\n${YELLOW}[4/4] サマリー生成...${NC}"

# サマリー
cat >> "$REPORT_FILE" << EOF
---

## Summary

| Metric | Count |
|--------|-------|
| 🔴 Violations (actual code) | $VIOLATION_COUNT |
| 🟡 Comments mentioning prohibited | $COMMENT_ONLY_COUNT |
| 🟢 SHA3-256 references | $SHA3_COUNT |

EOF

if [ "$VIOLATION_COUNT" -gt 0 ]; then
    cat >> "$REPORT_FILE" << EOF

## ⚠️ ACTION REQUIRED

$VIOLATION_COUNT CP-1 violations detected. These must be fixed before production deployment.

### Remediation Steps:
1. Replace all \`keccak256()\` with \`SHA3_256.hash()\`
2. Replace all \`sha256()\` with \`SHA3_256.hash()\`
3. Replace all \`ecrecover()\` with SPHINCS+ verification
4. Run tests to ensure functionality is preserved
EOF
else
    cat >> "$REPORT_FILE" << EOF

## ✅ COMPLIANT

No CP-1 violations detected in active code.
EOF
fi

# 結果表示
echo -e "\n${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                    スキャン完了                            ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"

echo -e "\n${BLUE}レポート: ${NC}$REPORT_FILE"
echo -e "\n${BLUE}サマリー:${NC}"
echo -e "  🔴 違反（実コード）:    $VIOLATION_COUNT"
echo -e "  🟡 コメント内の言及:    $COMMENT_ONLY_COUNT"
echo -e "  🟢 SHA3-256 参照:       $SHA3_COUNT"

if [ "$VIOLATION_COUNT" -gt 0 ]; then
    echo -e "\n${RED}⚠️  CP-1違反が検出されました！修正が必要です。${NC}"
    exit 1
else
    echo -e "\n${GREEN}✅ CP-1準拠: 違反なし${NC}"
    exit 0
fi
