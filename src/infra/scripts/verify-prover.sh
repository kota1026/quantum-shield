#!/bin/bash
# Phase 1: Prover App Layer Integration Verification
# Layer Integration Framework v1.0

set -e
APP="prover"

echo "=========================================="
echo "Layer Integration Verification: $APP"
echo "=========================================="
echo ""

PASS=true

# ===== Layer 2-3: Hooks Connection =====
echo "🔍 Layer 2-3: Hooks Connection"

# Check 1: DEMO_ patterns
DEMO_COUNT=$(grep -r "DEMO_" apps/web/src/components/$APP --include="*.tsx" 2>/dev/null | wc -l | tr -d ' ')
if [ "$DEMO_COUNT" -eq 0 ]; then
  echo "  ✅ DEMO_ patterns: 0"
else
  echo "  ❌ DEMO_ patterns: $DEMO_COUNT (must be 0)"
  grep -rn "DEMO_" apps/web/src/components/$APP --include="*.tsx" 2>/dev/null | head -5
  PASS=false
fi

# Check 2: Hook imports (useQuery is called inside hooks)
HOOK_IMPORTS=$(grep -r "from '@/hooks/" apps/web/src/components/$APP --include="*.tsx" 2>/dev/null | wc -l | tr -d ' ')
DIRECT_QUERY=$(grep -r "useQuery\|useMutation" apps/web/src/components/$APP --include="*.tsx" 2>/dev/null | wc -l | tr -d ' ')
TOTAL_HOOKS=$((HOOK_IMPORTS + DIRECT_QUERY))
if [ "$TOTAL_HOOKS" -gt 0 ]; then
  echo "  ✅ Hook usage: $HOOK_IMPORTS imports, $DIRECT_QUERY direct calls"
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

echo ""

# ===== Layer 4: Backend Integration =====
echo "🔍 Layer 4: Backend API"

# Check if API client exists
if [ -f "apps/web/src/lib/api/$APP/client.ts" ]; then
  echo "  ✅ API Client exists"
elif [ -f "apps/web/src/lib/api/client.ts" ]; then
  echo "  ✅ Shared API Client exists"
else
  echo "  ⚠️ Dedicated API Client not found (may use shared client)"
fi

# Check API types
if [ -f "apps/web/src/lib/api/$APP/types.ts" ]; then
  echo "  ✅ API Types exist"
else
  echo "  ⚠️ Dedicated API Types not found"
fi

echo ""

# ===== Component Check =====
echo "🔍 Component Files"

COMPONENTS=$(find apps/web/src/components/$APP -name "*.tsx" 2>/dev/null | wc -l | tr -d ' ')
echo "  📁 Total components: $COMPONENTS"

# Key components for Prover
KEY_COMPONENTS=("Apply" "Dashboard" "ProverRequests")
for comp in "${KEY_COMPONENTS[@]}"; do
  if find apps/web/src/components/$APP -name "*${comp}*" 2>/dev/null | grep -q .; then
    echo "  ✅ $comp component exists"
  else
    echo "  ⚠️ $comp component not found"
  fi
done

echo ""

# ===== Summary =====
echo "=========================================="
if [ "$PASS" = true ]; then
  echo "✅ VERIFICATION PASSED: $APP"
  exit 0
else
  echo "❌ VERIFICATION FAILED: $APP"
  exit 1
fi
