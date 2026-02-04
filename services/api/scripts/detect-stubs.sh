#!/bin/bash
# Phase 8-C: Stub Detection Script
# BE-001 Compliance Check
#
# Usage: ./scripts/detect-stubs.sh [path]
# Default path: src/routes/admin.rs

set -e

TARGET_PATH="${1:-src/routes/admin.rs}"

echo "=========================================="
echo "Phase 8-C: Stub Detection Scan"
echo "Target: $TARGET_PATH"
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ISSUES_FOUND=0

# Check 1: Empty array stubs
echo "🔍 Check 1: Empty array stubs (Json(vec![]))"
EMPTY_ARRAYS=$(grep -n "Json(vec!\[\])" "$TARGET_PATH" 2>/dev/null | wc -l | tr -d ' ')
if [ "$EMPTY_ARRAYS" -gt 0 ]; then
    echo -e "${RED}❌ Found $EMPTY_ARRAYS empty array returns${NC}"
    grep -n "Json(vec!\[\])" "$TARGET_PATH"
    ISSUES_FOUND=$((ISSUES_FOUND + EMPTY_ARRAYS))
else
    echo -e "${GREEN}✅ No empty array stubs found${NC}"
fi
echo ""

# Check 2: Always-success responses
echo "🔍 Check 2: Always-success responses"
ALWAYS_OK=$(grep -n "success: true" "$TARGET_PATH" 2>/dev/null | grep -v "//" | wc -l | tr -d ' ')
if [ "$ALWAYS_OK" -gt 0 ]; then
    echo -e "${YELLOW}⚠️ Found $ALWAYS_OK potential always-success patterns${NC}"
    grep -n "success: true" "$TARGET_PATH" | grep -v "//"
else
    echo -e "${GREEN}✅ No always-success patterns found${NC}"
fi
echo ""

# Check 3: Hardcoded mock data in handlers
echo "🔍 Check 3: Hardcoded mock data patterns"
MOCK_DATA=$(grep -n "// Mock\|// mock\|mock data\|Mock data\|hardcoded" "$TARGET_PATH" 2>/dev/null | wc -l | tr -d ' ')
if [ "$MOCK_DATA" -gt 0 ]; then
    echo -e "${YELLOW}⚠️ Found $MOCK_DATA mock data comments (may need review)${NC}"
    grep -n "// Mock\|// mock\|mock data\|Mock data\|hardcoded" "$TARGET_PATH"
else
    echo -e "${GREEN}✅ No mock data comments found${NC}"
fi
echo ""

# Check 4: Handlers without DB operations
echo "🔍 Check 4: Verifying DB operations in handlers"
HANDLERS=$(grep -c "pub async fn" "$TARGET_PATH" 2>/dev/null || echo 0)
DB_OPS=$(grep -c "Repository::\|sqlx::query\|pool\." "$TARGET_PATH" 2>/dev/null || echo 0)
echo "   Total handlers: $HANDLERS"
echo "   DB operation patterns: $DB_OPS"
if [ "$DB_OPS" -lt "$HANDLERS" ]; then
    echo -e "${YELLOW}⚠️ Some handlers may lack DB operations${NC}"
else
    echo -e "${GREEN}✅ DB operations found in handlers${NC}"
fi
echo ""

# Check 5: Logging compliance (BE-003)
echo "🔍 Check 5: Logging compliance (BE-003)"
LOGGING=$(grep -c "#\[instrument\]\|info!\|warn!\|tracing::" "$TARGET_PATH" 2>/dev/null || echo 0)
echo "   Logging patterns found: $LOGGING"
EXPECTED_LOGS=$((HANDLERS * 2))
if [ "$LOGGING" -lt "$EXPECTED_LOGS" ]; then
    echo -e "${YELLOW}⚠️ Some handlers may lack proper logging (expected ~$EXPECTED_LOGS)${NC}"
else
    echo -e "${GREEN}✅ Adequate logging found${NC}"
fi
echo ""

# Summary
echo "=========================================="
echo "Summary"
echo "=========================================="
if [ "$ISSUES_FOUND" -gt 0 ]; then
    echo -e "${RED}❌ BE-001 VIOLATION: $ISSUES_FOUND stub patterns detected${NC}"
    exit 1
else
    echo -e "${GREEN}✅ BE-001 PASS: No critical stub patterns detected${NC}"
    echo -e "${GREEN}✅ BE-003 CHECK: Logging patterns present${NC}"
fi
echo ""
