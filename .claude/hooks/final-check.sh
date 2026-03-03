#!/bin/bash
# Stop hook: Check for newly introduced mock/fallback patterns
# Runs at session end to warn about any remaining issues

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}"

echo "=== Final Session Check ==="

# Check for MOCK_ in non-test frontend files
MOCK_COUNT=$(grep -rn "MOCK_[A-Z]" "$PROJECT_DIR/src/" --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v mock.ts | grep -v '.test.' | grep -v '.spec.' | grep -v '.stories.' | wc -l | tr -d ' ')

# Check for FALLBACK_ in frontend files
FALLBACK_COUNT=$(grep -rn "FALLBACK_[A-Z]" "$PROJECT_DIR/src/" --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l | tr -d ' ')

# Check for DEMO_ in frontend files
DEMO_COUNT=$(grep -rn "DEMO_[A-Z]" "$PROJECT_DIR/src/" --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v '.test.' | grep -v '.spec.' | grep -v '.stories.' | wc -l | tr -d ' ')

# Check for todo!/unimplemented! in backend routes
STUB_COUNT=$(grep -rn "todo!\|unimplemented!" "$PROJECT_DIR/src/api/" --include="*.rs" 2>/dev/null | grep -v test | wc -l | tr -d ' ')

echo ""
echo "Mock/Fallback Audit:"
echo "  MOCK_ in non-test files:     $MOCK_COUNT"
echo "  FALLBACK_ in frontend:       $FALLBACK_COUNT"
echo "  DEMO_ in non-test files:     $DEMO_COUNT"
echo "  todo!/unimplemented! in BE:  $STUB_COUNT"
echo ""

TOTAL=$((MOCK_COUNT + FALLBACK_COUNT + DEMO_COUNT + STUB_COUNT))
if [ "$TOTAL" -gt 0 ]; then
    echo "WARNING: $TOTAL mock/stub patterns found. Run cleanup before next session."
else
    echo "CLEAN: No mock/stub patterns detected."
fi

echo "==========================="
# Always exit 0 - this is informational only
exit 0
