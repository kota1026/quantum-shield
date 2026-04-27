#!/bin/bash
# Quantum Shield — SessionStart Hook
# Checks project state on session start

echo "=== Quantum Shield Status ==="

echo ""
echo "--- Recent Changes ---"
git log --oneline -5 2>/dev/null

echo ""
echo "--- Site Health ---"
SITE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 3 https://quantum-shield.xyz 2>/dev/null)
echo "quantum-shield.xyz: HTTP $SITE_STATUS"

echo ""
echo "--- Code Quality ---"
VIOLATIONS=$(grep -rn "MOCK_\|FALLBACK_" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v mock.ts | grep -v .test. | grep -v .spec. | grep -v node_modules | wc -l)
echo "MOCK/FALLBACK violations: $VIOLATIONS"

echo "=== Done ==="
