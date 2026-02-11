# Phase 8 Gate Check Prompt

> **Version**: 1.0
> **Trigger**: `Phase 8 ゲートチェック` or `Phase 8-{X} ゲートチェック`

---

## Overview

各Phaseの完了条件を自動検証し、次Phaseへの進行可否を判定する。

```
Input:  現在Phase + 成果物
Output: Gate判定結果（PASS/FAIL）
Gate:   全チェック項目PASS
```

---

## Gate Check Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    Gate Check Execution                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. 対象Phase特定                                               │
│     └─→ Phase 8-A / 8-B / 8-C / 8-D / 8-E                      │
│                                                                 │
│  2. チェック項目読み込み                                        │
│     └─→ 該当Phaseのチェックリスト取得                          │
│                                                                 │
│  3. 自動検証実行                                                │
│     ├─→ コマンド実行                                           │
│     ├─→ ファイル存在確認                                       │
│     └─→ ログ解析                                               │
│                                                                 │
│  4. 結果判定                                                    │
│     ├─→ 全PASS → 次Phaseへ進行許可                            │
│     └─→ FAIL   → 問題リスト + 修正ガイド                      │
│                                                                 │
│  5. 進捗ファイル更新                                            │
│     └─→ PHASE8_PROGRESS.md のGate列更新                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Phase別チェック項目

### Gate 8-A: Screen Implementation

```yaml
checks:
  - id: 8A-01
    name: "TypeScript Compile"
    command: "cd apps/web && pnpm tsc --noEmit"
    expected_exit: 0
    critical: true

  - id: 8A-02
    name: "ESLint"
    command: "cd apps/web && pnpm lint"
    expected_exit: 0
    critical: true

  - id: 8A-03
    name: "Screen Count"
    command: "find apps/web/src/app/*/qs-admin -name 'page.tsx' | wc -l"
    expected_output: "38"
    critical: true

  - id: 8A-04
    name: "i18n Keys (ja)"
    command: "node scripts/verify-i18n.js qs-admin ja"
    expected_exit: 0
    critical: true

  - id: 8A-05
    name: "i18n Keys (en)"
    command: "node scripts/verify-i18n.js qs-admin en"
    expected_exit: 0
    critical: true

  - id: 8A-06
    name: "Storybook Build"
    command: "cd apps/web && pnpm storybook build --quiet"
    expected_exit: 0
    critical: false  # ビルドエラーは警告のみ

pass_criteria:
  critical_all_pass: true
  non_critical_min: 0
```

### Gate 8-B: Screen Verification

```yaml
checks:
  - id: 8B-01
    name: "Review Tracker Complete"
    command: "grep -c '✅' docs/phase8/SCREEN_REVIEW_TRACKER.md"
    expected_output: "38"  # 全38画面に✅
    critical: true

  - id: 8B-02
    name: "No Critical Issues"
    command: "grep -c '❌ Critical' docs/phase8/SCREEN_REVIEW_TRACKER.md"
    expected_output: "0"
    critical: true

  - id: 8B-03
    name: "Major Issues Resolved"
    command: "grep -c '⚠️ Major.*未解決' docs/phase8/SCREEN_REVIEW_TRACKER.md"
    expected_output: "0"
    critical: true

pass_criteria:
  critical_all_pass: true
```

### Gate 8-C: Backend Implementation

```yaml
checks:
  - id: 8C-01
    name: "Rust Compile"
    command: "cd services/api && cargo build --release"
    expected_exit: 0
    critical: true

  - id: 8C-02
    name: "Unit Tests"
    command: "cd services/api && cargo test --package api"
    expected_exit: 0
    critical: true

  - id: 8C-03
    name: "Stub Detection (BE-001)"
    command: "node scripts/detect-stubs.js services/api/src/handlers/admin/"
    expected_output: "Violations: 0"
    critical: true

  - id: 8C-04
    name: "Log Output Count (BE-003)"
    command: |
      count=$(grep -r "tracing::" services/api/src/handlers/admin/ | wc -l)
      if [ $count -ge 165 ]; then echo "OK: $count"; else echo "FAIL: $count"; fi
    expected_output_contains: "OK:"
    critical: true

  - id: 8C-05
    name: "Prisma Migration"
    command: "cd apps/api && npx prisma migrate status"
    expected_output_contains: "All migrations have been applied"
    critical: true

pass_criteria:
  critical_all_pass: true
```

### Gate 8-D: L3/L1 Integration

```yaml
checks:
  - id: 8D-01
    name: "L3 Health Check"
    command: "curl -s http://localhost:8545/health | jq -r '.status'"
    expected_output: "healthy"
    critical: true

  - id: 8D-02
    name: "L3 Signature Test"
    command: "cd services/api && cargo test --test l3_integration test_l3_signature"
    expected_exit: 0
    critical: true

  - id: 8D-03
    name: "L1 Connection"
    command: "cast chain-id --rpc-url $SEPOLIA_RPC_URL"
    expected_output: "11155111"  # Sepolia chain ID
    critical: true

  - id: 8D-04
    name: "L3-L1 Integration Test"
    command: "cd services/api && cargo test --test l3_l1_integration"
    expected_exit: 0
    critical: true

pass_criteria:
  critical_all_pass: true
```

### Gate 8-E: Integration Testing

```yaml
checks:
  - id: 8E-01
    name: "E2E Test Pass Rate"
    command: |
      result=$(npx playwright test e2e/qs-admin/ --reporter=json 2>/dev/null | jq '.stats.expected == .stats.passed')
      echo $result
    expected_output: "true"
    critical: true

  - id: 8E-02
    name: "Log Verification"
    command: "./scripts/verify-test-logs.sh"
    expected_exit: 0
    critical: true

  - id: 8E-03
    name: "L3 State Verification"
    command: "curl -s http://localhost:8545/state/verify | jq -r '.valid'"
    expected_output: "true"
    critical: true

pass_criteria:
  critical_all_pass: true
```

---

## 実行スクリプト

```bash
#!/bin/bash
# scripts/gate-check.sh

PHASE=$1

if [ -z "$PHASE" ]; then
  echo "Usage: ./scripts/gate-check.sh 8-A|8-B|8-C|8-D|8-E"
  exit 1
fi

echo "=== Gate Check: Phase $PHASE ==="
echo ""

# チェック定義読み込み
CHECKS_FILE="config/gate-checks-${PHASE}.yaml"

if [ ! -f "$CHECKS_FILE" ]; then
  echo "❌ Check definition not found: $CHECKS_FILE"
  exit 1
fi

# 結果格納
RESULTS=()
FAILED=0

# 各チェック実行
while IFS= read -r check; do
  id=$(echo "$check" | yq '.id')
  name=$(echo "$check" | yq '.name')
  command=$(echo "$check" | yq '.command')
  expected_exit=$(echo "$check" | yq '.expected_exit // empty')
  expected_output=$(echo "$check" | yq '.expected_output // empty')
  critical=$(echo "$check" | yq '.critical')

  echo "🔍 [$id] $name"

  # コマンド実行
  output=$(eval "$command" 2>&1)
  exit_code=$?

  # 判定
  passed=false

  if [ -n "$expected_exit" ]; then
    if [ "$exit_code" -eq "$expected_exit" ]; then
      passed=true
    fi
  elif [ -n "$expected_output" ]; then
    if [ "$output" = "$expected_output" ]; then
      passed=true
    fi
  fi

  if $passed; then
    echo "   ✅ PASS"
    RESULTS+=("✅|$id|$name|PASS")
  else
    echo "   ❌ FAIL"
    echo "   Expected: $expected_exit $expected_output"
    echo "   Actual: exit=$exit_code, output=$output"
    RESULTS+=("❌|$id|$name|FAIL|$output")

    if [ "$critical" = "true" ]; then
      FAILED=$((FAILED + 1))
    fi
  fi

  echo ""

done < <(yq -o=json '.checks[]' "$CHECKS_FILE")

# 結果サマリー
echo "=== Gate Check Result ==="
echo ""
echo "| Status | ID | Check | Result |"
echo "|:------:|-------|-------|--------|"

for result in "${RESULTS[@]}"; do
  echo "| $result |" | tr '|' '|'
done

echo ""

if [ $FAILED -eq 0 ]; then
  echo "✅ Gate $PHASE: PASSED"
  echo ""
  echo "→ 次のPhaseに進行できます"
  exit 0
else
  echo "❌ Gate $PHASE: FAILED ($FAILED critical check(s) failed)"
  echo ""
  echo "→ 上記の問題を修正してから再度ゲートチェックを実行してください"
  exit 1
fi
```

---

## Gate結果テンプレート

```markdown
## Gate Check Result: Phase 8-{X}

### 検証日時
{timestamp}

### 検証結果

| Status | ID | Check | Result | Detail |
|:------:|:---|-------|:------:|--------|
| ✅ | 8X-01 | {check_name} | PASS | - |
| ❌ | 8X-02 | {check_name} | FAIL | {detail} |
| ✅ | 8X-03 | {check_name} | PASS | - |

### サマリー

| Category | Count |
|----------|:-----:|
| Total Checks | {n} |
| ✅ Passed | {n} |
| ❌ Failed (Critical) | {n} |
| ⚠️ Failed (Non-Critical) | {n} |

### 総合判定

**{PASS / FAIL}**

### 次のアクション

#### PASSの場合
- Phase 8-{X+1} に進行
- PHASE8_PROGRESS.md の Gate列を ✅ に更新

#### FAILの場合
以下を修正:
1. {issue_1}
2. {issue_2}

修正後、再度ゲートチェック:
```bash
./scripts/gate-check.sh 8-{X}
```
```

---

## 進捗ファイル更新

Gate通過時、自動的にPHASE8_PROGRESS.mdを更新:

```bash
# Gate通過時の更新
sed -i "s/| 8-$PHASE | .* | .* | - |/| 8-$PHASE | 🟢 Complete | 38\/38 | ✅ |/" \
  docs/phase8/PHASE8_PROGRESS.md

# コミット
git add docs/phase8/PHASE8_PROGRESS.md
git commit -m "chore: Gate 8-$PHASE passed"
```

---

**Document End**
