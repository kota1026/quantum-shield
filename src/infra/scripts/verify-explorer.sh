#!/bin/bash
# scripts/verify-explorer.sh
# Layer Integration Verification for Explorer

set -e
APP="explorer"
PASS=true

echo "=========================================="
echo "Layer Integration Verification: $APP"
echo "=========================================="

# ===== Layer 2-3: Hooks Connection =====
echo ""
echo "🔍 Layer 2-3: Hooks Connection"

# Check 1: DEMO_ patterns
DEMO_COUNT=$(grep -r "DEMO_" apps/web/src/components/$APP --include="*.tsx" 2>/dev/null | wc -l | tr -d ' ')
if [ "$DEMO_COUNT" -eq 0 ]; then
  echo "  ✅ DEMO_ patterns: 0"
else
  echo "  ❌ DEMO_ patterns: $DEMO_COUNT (must be 0)"
  PASS=false
fi

# Check 2: useQuery usage (direct or via custom hooks)
USEQUERY=$(grep -r "useQuery\|useMutation" apps/web/src/components/$APP --include="*.tsx" 2>/dev/null | wc -l | tr -d ' ')
# Also check for custom hook usage (useExplorer*, useLocks, useProvers, etc.)
CUSTOM_HOOKS=$(grep -rE "use[A-Z][a-zA-Z]+\s*\(" apps/web/src/components/$APP --include="*.tsx" 2>/dev/null | grep -v "useState\|useEffect\|useCallback\|useMemo\|useRef\|useContext\|useRouter\|useTranslation\|useParams\|useSearchParams" | wc -l | tr -d ' ')
HOOK_TOTAL=$((USEQUERY + CUSTOM_HOOKS))
if [ "$HOOK_TOTAL" -gt 0 ]; then
  echo "  ✅ Hook usage: $USEQUERY direct + $CUSTOM_HOOKS custom = $HOOK_TOTAL total"
else
  echo "  ❌ Hook usage: 0 (must be > 0)"
  PASS=false
fi

# Check 3: Hooks files exist
HOOKS=$(ls apps/web/src/hooks/$APP/*.ts 2>/dev/null | wc -l | tr -d ' ')
if [ "$HOOKS" -gt 0 ]; then
  echo "  ✅ Hooks files: $HOOKS"
else
  echo "  ❌ Hooks files: 0 (must be > 0)"
  PASS=false
fi

# Check 4: Loading/Error states
LOADING=$(grep -r "isLoading\|Skeleton\|Loading" apps/web/src/components/$APP --include="*.tsx" 2>/dev/null | wc -l | tr -d ' ')
ERROR=$(grep -r "isError\|error\|ErrorState" apps/web/src/components/$APP --include="*.tsx" 2>/dev/null | wc -l | tr -d ' ')
if [ "$LOADING" -gt 0 ] && [ "$ERROR" -gt 0 ]; then
  echo "  ✅ Loading state: $LOADING, Error state: $ERROR"
else
  echo "  ⚠️ Loading: $LOADING, Error: $ERROR (both should be > 0)"
fi

# ===== Layer 4: Backend Integration =====
echo ""
echo "🔍 Layer 4: Backend API"

# Check if API client exists
if [ -f "apps/web/src/lib/api/$APP/client.ts" ]; then
  echo "  ✅ API Client exists"
else
  echo "  ❌ API Client missing: lib/api/$APP/client.ts"
  PASS=false
fi

# Check backend health
if curl -s http://localhost:8080/health 2>/dev/null | grep -q "ok\|healthy"; then
  echo "  ✅ Backend health: OK"
else
  echo "  ⚠️ Backend health: Not responding (may be expected)"
fi

# Check API endpoint
API_RESPONSE=$(curl -s http://localhost:8080/v1/explorer/overview 2>/dev/null | head -c 100)
if [ -n "$API_RESPONSE" ]; then
  echo "  ✅ API /v1/explorer/overview: Responding"
else
  echo "  ⚠️ API /v1/explorer/overview: Not responding"
fi

# ===== Summary =====
echo ""
echo "=========================================="
if [ "$PASS" = true ]; then
  echo "✅ VERIFICATION PASSED"
  exit 0
else
  echo "❌ VERIFICATION FAILED"
  exit 1
fi
