#!/bin/bash
# Layer Integration - All Apps Verification
# Layer Integration Framework v1.0

# Get the directory where the script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "======================================================"
echo "LAYER INTEGRATION - ALL APPS VERIFICATION"
echo "======================================================"
echo ""

TOTAL_PASS=0
TOTAL_FAIL=0

for app in prover observer consumer governance explorer token-hub qs-hub qs-admin enterprise; do
  DEMO=$(grep -r "DEMO_" "$PROJECT_ROOT/apps/web/src/components/$app" --include="*.tsx" 2>/dev/null | wc -l | tr -d ' ')
  HOOK_IMPORTS=$(grep -r "from '@/hooks/" "$PROJECT_ROOT/apps/web/src/components/$app" --include="*.tsx" 2>/dev/null | wc -l | tr -d ' ')
  HOOK_FILES=$(ls "$PROJECT_ROOT/apps/web/src/hooks/$app"/*.ts 2>/dev/null | wc -l | tr -d ' ')
  COMPONENTS=$(find "$PROJECT_ROOT/apps/web/src/components/$app" -name "*.tsx" 2>/dev/null | wc -l | tr -d ' ')

  if [ "$DEMO" -eq 0 ]; then
    STATUS="✅ PASS"
    ((TOTAL_PASS++))
  else
    STATUS="❌ FAIL"
    ((TOTAL_FAIL++))
  fi

  printf "%s %-12s DEMO_=%s Hooks=%s/%s Components=%s\n" "$STATUS" "$app" "$DEMO" "$HOOK_IMPORTS" "$HOOK_FILES" "$COMPONENTS"
done

echo ""
echo "======================================================"
echo "Summary: $TOTAL_PASS passed, $TOTAL_FAIL failed"
echo ""

# Infrastructure check
echo "=== Infrastructure Status ==="
if docker ps 2>/dev/null | grep -q postgres; then
  echo "  ✅ PostgreSQL running"
else
  echo "  ❌ PostgreSQL not running"
fi

if docker ps 2>/dev/null | grep -q redis; then
  echo "  ✅ Redis running"
else
  echo "  ❌ Redis not running"
fi

if curl -s http://localhost:8080/v1/health 2>/dev/null | grep -q "ok\|healthy"; then
  echo "  ✅ Backend healthy"
else
  echo "  ⚠️ Backend not responding (may be building)"
fi

if curl -s http://localhost:3000 2>/dev/null | head -1 | grep -q html; then
  echo "  ✅ Frontend running"
else
  echo "  ⚠️ Frontend not running"
fi

echo "======================================================"
