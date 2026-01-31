# Phase 8-E-2: Log Verification Prompt

> **Version**: 1.0
> **Trigger**: `Phase 8-E ログ検証 開始`
> **前提**: E2Eテスト実行完了

---

## Overview

E2Eテストの結果とバックエンドログを照合し、「テストは成功したがバックエンドが実際には処理していない」状況を検出する。

```
Input:  E2Eテスト結果 + バックエンドログ
Output: 整合性検証レポート
Gate:   不整合ゼロ
```

---

## 検証の目的

### 検出したい問題

```
┌─────────────────────────────────────────────────────────────────┐
│  NG Pattern: テストは通るがバックエンドが動いていない           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. スタブレスポンス                                            │
│     - APIが常に200 OKを返す                                     │
│     - DB操作なしで成功レスポンス                                │
│                                                                 │
│  2. フロントエンドモックの残存                                  │
│     - API呼び出しがモックにヒット                               │
│     - 実際のバックエンドに到達していない                        │
│                                                                 │
│  3. エラーの握りつぶし                                          │
│     - 500エラーをキャッチして200に変換                          │
│     - ログに出ていないエラー                                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 期待する状態

```
┌─────────────────────────────────────────────────────────────────┐
│  OK Pattern: テスト成功 = バックエンド処理完了                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  E2Eテスト                      バックエンドログ                │
│  ──────────                     ──────────────                  │
│                                                                 │
│  1. POST /admin/users           → "API request started"        │
│     ↓                           → "Executing query: INSERT"    │
│  2. Response 201                → "API request completed: 201" │
│     ↓                                                          │
│  3. Assert: ユーザー作成成功    → DB: 新規レコード確認          │
│                                                                 │
│  テストの期待値 ≡ ログの記録                                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 検証手順

### STEP 1: ログ収集開始

```bash
# バックエンドログを収集開始
docker compose logs -f api > /tmp/api-test-logs.txt 2>&1 &
LOG_PID=$!

# または直接ログファイル監視
tail -f services/api/logs/app.log > /tmp/api-test-logs.txt &
LOG_PID=$!
```

### STEP 2: E2Eテスト実行

```bash
# テスト実行（JSON出力）
cd apps/web
npx playwright test e2e/qs-admin/ \
  --reporter=json \
  > /tmp/e2e-results.json
```

### STEP 3: ログ収集終了

```bash
kill $LOG_PID 2>/dev/null
```

### STEP 4: 照合スクリプト実行

```javascript
// scripts/verify-test-logs.js

const fs = require('fs');

// テスト結果を読み込み
const testResults = JSON.parse(fs.readFileSync('/tmp/e2e-results.json', 'utf8'));
const logs = fs.readFileSync('/tmp/api-test-logs.txt', 'utf8');

// 各テストケースに対して期待されるログパターン
const expectedPatterns = {
  'should create new user': [
    /API request started.*POST.*\/admin\/users/,
    /Executing query.*INSERT INTO admin_users/,
    /API request completed.*201/
  ],
  'should list users': [
    /API request started.*GET.*\/admin\/users/,
    /Executing query.*SELECT.*FROM admin_users/,
    /API request completed.*200/
  ],
  'should create transfer request': [
    /API request started.*POST.*\/admin\/treasury\/transfers/,
    /Executing query.*INSERT INTO treasury_transactions/,
    /L3 signature requested/,
    /API request completed.*201/
  ],
  // ... 他のテストケース
};

// 検証
const results = [];

testResults.suites.forEach(suite => {
  suite.specs.forEach(spec => {
    const testName = spec.title;
    const patterns = expectedPatterns[testName];

    if (!patterns) {
      results.push({
        test: testName,
        status: 'SKIP',
        reason: 'No expected patterns defined'
      });
      return;
    }

    const missingPatterns = patterns.filter(pattern => !pattern.test(logs));

    if (missingPatterns.length === 0) {
      results.push({
        test: testName,
        status: 'PASS',
        reason: 'All expected logs found'
      });
    } else {
      results.push({
        test: testName,
        status: 'FAIL',
        reason: `Missing logs: ${missingPatterns.map(p => p.toString()).join(', ')}`
      });
    }
  });
});

// レポート出力
console.log('## Test-Log Verification Report\n');
console.log('| Test | Status | Detail |');
console.log('|------|:------:|--------|');

results.forEach(r => {
  const emoji = r.status === 'PASS' ? '✅' : r.status === 'FAIL' ? '❌' : '⏭️';
  console.log(`| ${r.test} | ${emoji} ${r.status} | ${r.reason} |`);
});

// 失敗があれば非ゼロ終了
const failures = results.filter(r => r.status === 'FAIL');
if (failures.length > 0) {
  console.log(`\n❌ ${failures.length} test(s) have log verification failures`);
  process.exit(1);
} else {
  console.log(`\n✅ All tests have matching logs`);
  process.exit(0);
}
```

---

## 期待ログパターン定義

### API別期待パターン

```yaml
# config/expected-log-patterns.yaml

patterns:
  # 認証
  "POST /admin/auth/login":
    - pattern: "API request started.*POST.*auth/login"
    - pattern: "Executing query.*SELECT.*FROM admin_users.*WHERE email"
    - pattern: "Login successful|Login failed"
    - pattern: "API request completed.*(200|401)"

  # ユーザー一覧
  "GET /admin/users":
    - pattern: "API request started.*GET.*users"
    - pattern: "Executing query.*SELECT.*FROM admin_users"
    - pattern: "API request completed.*200"

  # ユーザー作成
  "POST /admin/users":
    - pattern: "API request started.*POST.*users"
    - pattern: "Executing query.*INSERT INTO admin_users"
    - pattern: "API request completed.*201"

  # Treasury転送作成
  "POST /admin/treasury/transfers":
    - pattern: "API request started.*POST.*treasury/transfers"
    - pattern: "Executing query.*INSERT INTO treasury_transactions"
    - pattern: "L3 signature requested"
    - pattern: "API request completed.*201"

  # Treasury転送承認
  "POST /admin/treasury/transfers/:id/approve":
    - pattern: "API request started.*POST.*transfers/.*/approve"
    - pattern: "Executing query.*SELECT.*FROM treasury_transactions"
    - pattern: "Executing query.*INSERT INTO treasury_tx_signatures"
    - pattern: "L3 signature requested"
    - pattern: "(Required signatures collected|Signatures collected)"
    - pattern: "API request completed.*200"

  # Prover承認
  "POST /admin/prover/requests/:id/approve":
    - pattern: "API request started.*POST.*prover/requests/.*/approve"
    - pattern: "L3 signature requested"
    - pattern: "Signature verification"
    - pattern: "Executing query.*UPDATE prover_registrations"
    - pattern: "Executing query.*INSERT INTO provers"
    - pattern: "Prover approved and activated"
    - pattern: "API request completed.*200"
```

---

## 自動化スクリプト

### 完全版スクリプト

```bash
#!/bin/bash
# scripts/verify-test-logs.sh

set -e

echo "=== Test-Log Verification ==="
echo ""

# 設定
LOG_FILE="/tmp/api-test-logs-$(date +%s).txt"
RESULTS_FILE="/tmp/e2e-results-$(date +%s).json"
REPORT_FILE="/tmp/test-log-report-$(date +%s).md"

# 1. バックエンドログ収集開始
echo "📝 Starting log collection..."
docker compose logs -f api > "$LOG_FILE" 2>&1 &
LOG_PID=$!
sleep 2

# 2. E2Eテスト実行
echo "🧪 Running E2E tests..."
cd apps/web
npx playwright test e2e/qs-admin/ --reporter=json > "$RESULTS_FILE" 2>/dev/null || true

# 3. ログ収集終了
echo "⏹️  Stopping log collection..."
kill $LOG_PID 2>/dev/null || true
sleep 1

# 4. 照合実行
echo "🔍 Verifying test-log consistency..."
node scripts/verify-test-logs.js "$RESULTS_FILE" "$LOG_FILE" > "$REPORT_FILE"

# 5. 結果表示
echo ""
cat "$REPORT_FILE"

# 6. 終了コード
if grep -q "❌ FAIL" "$REPORT_FILE"; then
  echo ""
  echo "❌ Verification FAILED - Some tests don't have matching backend logs"
  exit 1
else
  echo ""
  echo "✅ Verification PASSED - All tests have matching backend logs"
  exit 0
fi
```

### CI統合

```yaml
# .github/workflows/e2e.yml

jobs:
  e2e-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup
        run: |
          pnpm install
          docker compose up -d api db

      - name: Run E2E with Log Verification
        run: ./scripts/verify-test-logs.sh

      - name: Upload Report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: test-log-report
          path: /tmp/test-log-report-*.md
```

---

## 検証レポートテンプレート

```markdown
## Test-Log Verification Report

### 実行日時
{timestamp}

### サマリー

| Status | Count |
|--------|:-----:|
| ✅ PASS | {n} |
| ❌ FAIL | {n} |
| ⏭️ SKIP | {n} |

### 詳細

| Test Case | Status | Expected Log | Found |
|-----------|:------:|--------------|:-----:|
| should create user | ✅ PASS | INSERT INTO admin_users | ✅ |
| should list users | ✅ PASS | SELECT FROM admin_users | ✅ |
| should create transfer | ❌ FAIL | L3 signature requested | ❌ |
| ... | ... | ... | ... |

### 失敗詳細

#### Test: should create transfer

**期待ログ:**
```
API request started.*POST.*treasury/transfers
Executing query.*INSERT INTO treasury_transactions
L3 signature requested
API request completed.*201
```

**実際のログ:**
```
API request started method="POST" path="/admin/treasury/transfers"
API request completed status=201 duration_ms=5
```

**不足:**
- `Executing query.*INSERT INTO treasury_transactions` が見つからない
- `L3 signature requested` が見つからない

**推定原因:**
- バックエンドがスタブレスポンスを返している可能性
- DB操作がスキップされている可能性

**対応:**
- `services/api/src/handlers/admin/treasury.rs` を確認
- BE-001違反の可能性を調査

### 判定
**{PASS/FAIL}**

### 次のアクション
- PASS: Gate 8-E通過、Phase 8完了
- FAIL: 上記の失敗を修正し、再検証
```

---

## Gate 8-E 通過条件

```yaml
必須条件:
  - E2Eテスト全通過
  - ログ整合性検証: 不整合ゼロ

検証コマンド:
  ./scripts/verify-test-logs.sh

判定:
  - exit 0: PASS
  - exit 1: FAIL
```

---

**Document End**
