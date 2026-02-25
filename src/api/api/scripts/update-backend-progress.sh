#!/bin/bash
# Phase 8-C: Backend Progress Update Script
# Usage: ./scripts/update-backend-progress.sh <endpoint_number> <status>
#
# Examples:
#   ./scripts/update-backend-progress.sh 06 done   # Mark endpoint 06 as Done
#   ./scripts/update-backend-progress.sh auth done  # Mark auth category as Done

set -e

PROGRESS_FILE="../../docs/phase8/PHASE8_PROGRESS.md"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Usage check
if [ $# -lt 2 ]; then
    echo "Usage: $0 <endpoint_number|category> <status>"
    echo ""
    echo "Examples:"
    echo "  $0 06 done     # Mark endpoint 06 as Done"
    echo "  $0 auth done   # Mark all auth endpoints as Done"
    echo ""
    echo "Categories: auth, dashboard, transactions, users, prover, observer,"
    echo "            treasury, governance, members, support, announcements,"
    echo "            analytics, system"
    exit 1
fi

TARGET=$1
STATUS=$2

echo "=========================================="
echo "Phase 8-C: Backend Progress Update"
echo "=========================================="
echo ""

# Check if progress file exists
if [ ! -f "$PROGRESS_FILE" ]; then
    echo -e "${RED}Error: Progress file not found: $PROGRESS_FILE${NC}"
    echo "Make sure you're running from services/api/ directory"
    exit 1
fi

# Function to count completed endpoints
count_completed() {
    grep -c "| Done |" "$PROGRESS_FILE" || echo "0"
}

# Function to count total endpoints
count_total() {
    grep -c "| Pending |" "$PROGRESS_FILE" || echo "0"
}

BEFORE_COUNT=$(count_completed)

if [ "$STATUS" = "done" ]; then
    # Check if TARGET is a number (endpoint) or string (category)
    if [[ "$TARGET" =~ ^[0-9]+$ ]]; then
        # Update specific endpoint by number
        echo "Marking endpoint #$TARGET as Done..."

        # Pattern to match: | XX | METHOD | path | ... | Pending |
        # Replace: | XX | METHOD | path | ✅ | - | ✅ | Done |
        sed -i '' "s/| $TARGET | \([A-Z]*\) | \([^|]*\) | ⬜ | ⬜ | ⬜ | Pending |/| $TARGET | \1 | \2 | ✅ | - | ✅ | Done |/g" "$PROGRESS_FILE"
    else
        # Update category
        echo "Marking category '$TARGET' as Done..."

        # This is more complex - would need category-aware logic
        echo -e "${YELLOW}Category update not yet implemented. Please update manually.${NC}"
    fi
fi

AFTER_COUNT=$(count_completed)
DIFF=$((AFTER_COUNT - BEFORE_COUNT))

echo ""
echo "=========================================="
echo "Summary"
echo "=========================================="

if [ "$DIFF" -gt 0 ]; then
    echo -e "${GREEN}✅ Updated $DIFF endpoint(s)${NC}"
    echo "Completed: $BEFORE_COUNT → $AFTER_COUNT"
else
    echo -e "${YELLOW}⚠️ No changes made${NC}"
    echo "The endpoint may already be Done or the pattern didn't match."
fi

# Calculate overall progress
TOTAL_DONE=$(grep -c "| Done |" "$PROGRESS_FILE" 2>/dev/null || echo "0")
echo ""
echo "Overall Progress: $TOTAL_DONE/55 endpoints"

echo ""
echo "=========================================="
