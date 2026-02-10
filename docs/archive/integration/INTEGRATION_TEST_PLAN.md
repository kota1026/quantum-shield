# 統合テスト・疎通テスト計画

> **Version**: 1.0
> **作成日**: 2026-02-03
> **目的**: Sepolia版サービスイン前の統合・疎通テスト実行計画

---

## 1. テスト実行環境

### 1.1 必要コンポーネント

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          Test Environment                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐              │
│  │   Frontend  │────▶│   Backend   │────▶│   Database  │              │
│  │  Next.js    │     │  Rust/Axum  │     │  PostgreSQL │              │
│  │  :3000      │     │  :3001      │     │  :5432      │              │
│  └─────────────┘     └─────────────┘     └─────────────┘              │
│         │                   │                                          │
│         │                   ▼                                          │
│         │            ┌─────────────┐     ┌─────────────┐              │
│         │            │    L3       │     │    L1       │              │
│         │            │  Anvil      │     │  Sepolia    │              │
│         │            │  :8545      │     │  (Remote)   │              │
│         │            └─────────────┘     └─────────────┘              │
│         │                                                              │
│         ▼                                                              │
│  ┌─────────────┐                                                       │
│  │  Playwright │                                                       │
│  │  Test Runner│                                                       │
│  └─────────────┘                                                       │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 1.2 起動コマンド

```bash
# Terminal 1: Infrastructure
docker-compose up -d postgres redis rabbitmq l3-node

# Terminal 2: Backend
cd services/api
cargo run

# Terminal 3: Frontend
cd apps/web
pnpm dev

# Terminal 4: Tests
cd apps/web
npx playwright test
```

---

## 2. テストフェーズ

### Phase 0: Infrastructure疎通テスト

**目的**: 各コンポーネントが正常に起動し、接続可能であることを確認

| # | Test | Command | Expected |
|---|------|---------|----------|
| 0.1 | PostgreSQL接続 | `psql $DATABASE_URL -c "SELECT 1"` | 1 |
| 0.2 | Redis接続 | `redis-cli ping` | PONG |
| 0.3 | L3ノード起動 | `curl localhost:8545 -X POST -d '{"jsonrpc":"2.0","method":"eth_blockNumber","id":1}'` | Block number |
| 0.4 | L1 Sepolia接続 | `curl $L1_RPC_URL -X POST -d '{"jsonrpc":"2.0","method":"eth_chainId","id":1}'` | 0xaa36a7 (11155111) |
| 0.5 | Backend起動 | `curl http://localhost:3001/health` | OK |
| 0.6 | Frontend起動 | `curl http://localhost:3000` | HTML |

**自動化スクリプト:**

```bash
#!/bin/bash
# scripts/smoke-test-infra.sh

echo "=== Infrastructure Smoke Test ==="

# PostgreSQL
echo -n "PostgreSQL: "
psql $DATABASE_URL -c "SELECT 1" > /dev/null 2>&1 && echo "✅ OK" || echo "❌ FAIL"

# Redis
echo -n "Redis: "
redis-cli ping > /dev/null 2>&1 && echo "✅ OK" || echo "❌ FAIL"

# L3 Node
echo -n "L3 Node: "
curl -s localhost:8545 -X POST -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' | \
  grep -q "result" && echo "✅ OK" || echo "❌ FAIL"

# L1 Sepolia
echo -n "L1 Sepolia: "
curl -s $L1_RPC_URL -X POST -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}' | \
  grep -q "0xaa36a7" && echo "✅ OK" || echo "❌ FAIL"

# Backend
echo -n "Backend: "
curl -s http://localhost:3001/health | grep -q "ok" && echo "✅ OK" || echo "❌ FAIL"

# Frontend
echo -n "Frontend: "
curl -s http://localhost:3000 | grep -q "html" && echo "✅ OK" || echo "❌ FAIL"

echo "=== Complete ==="
```

---

### Phase 1: API疎通テスト

**目的**: 各APIエンドポイントが正常に応答することを確認

#### 1.1 認証API

| # | Endpoint | Method | Body | Expected |
|---|----------|--------|------|----------|
| 1.1.1 | /v1/auth/siwe | POST | SIWE message + signature | JWT token |
| 1.1.2 | /v1/auth/refresh | POST | Refresh token | New JWT |
| 1.1.3 | /v1/auth/me | GET | - | User info |

```bash
# SIWE認証テスト
curl -X POST http://localhost:3001/v1/auth/siwe \
  -H "Content-Type: application/json" \
  -d '{
    "message": "quantum-shield.io wants you to sign in with your Ethereum account...",
    "signature": "0x..."
  }'
```

#### 1.2 Consumer API

| # | Endpoint | Method | Auth | Expected |
|---|----------|--------|:----:|----------|
| 1.2.1 | /v1/user/dashboard | GET | ✅ | Dashboard stats |
| 1.2.2 | /v1/user/transactions | GET | ✅ | Transaction list |
| 1.2.3 | /v1/lock | POST | ✅ | Lock created |
| 1.2.4 | /v1/unlock | POST | ✅ | Unlock requested |

#### 1.3 Prover API

| # | Endpoint | Method | Auth | Expected |
|---|----------|--------|:----:|----------|
| 1.3.1 | /v1/provers | GET | - | Prover list |
| 1.3.2 | /v1/prover/dashboard | GET | ✅ | Prover stats |
| 1.3.3 | /v1/prover/requests | GET | ✅ | Pending requests |
| 1.3.4 | /v1/prover/sign | POST | ✅ | Signature submitted |

#### 1.4 Observer API

| # | Endpoint | Method | Auth | Expected |
|---|----------|--------|:----:|----------|
| 1.4.1 | /v1/observers | GET | - | Observer list |
| 1.4.2 | /v1/observer/dashboard | GET | ✅ | Observer stats |
| 1.4.3 | /v1/observer/challenges | GET | ✅ | Challenge list |

#### 1.5 Explorer API

| # | Endpoint | Method | Auth | Expected |
|---|----------|--------|:----:|----------|
| 1.5.1 | /v1/explorer/stats | GET | - | Global stats |
| 1.5.2 | /v1/explorer/transactions | GET | - | Recent transactions |
| 1.5.3 | /v1/explorer/provers | GET | - | Active provers |

#### 1.6 Governance API

| # | Endpoint | Method | Auth | Expected |
|---|----------|--------|:----:|----------|
| 1.6.1 | /v1/governance/proposals | GET | - | Proposal list |
| 1.6.2 | /v1/governance/vote | POST | ✅ | Vote submitted |

#### 1.7 Admin API

| # | Endpoint | Method | Auth | Expected |
|---|----------|--------|:----:|----------|
| 1.7.1 | /api/admin/dashboard/overview | GET | ✅ | Dashboard data |
| 1.7.2 | /api/admin/transactions | GET | ✅ | Transaction list |
| 1.7.3 | /api/admin/provers | GET | ✅ | Prover management |

**自動化スクリプト:**

```bash
#!/bin/bash
# scripts/smoke-test-api.sh

TOKEN="your_jwt_token_here"

echo "=== API Smoke Test ==="

# Public endpoints
echo -n "GET /v1/provers: "
curl -s http://localhost:3001/v1/provers | grep -q "provers" && echo "✅ OK" || echo "❌ FAIL"

echo -n "GET /v1/explorer/stats: "
curl -s http://localhost:3001/v1/explorer/stats | grep -q "total" && echo "✅ OK" || echo "❌ FAIL"

# Authenticated endpoints
echo -n "GET /v1/user/dashboard: "
curl -s http://localhost:3001/v1/user/dashboard \
  -H "Authorization: Bearer $TOKEN" | grep -q "wallet" && echo "✅ OK" || echo "❌ FAIL"

echo -n "GET /v1/prover/dashboard: "
curl -s http://localhost:3001/v1/prover/dashboard \
  -H "Authorization: Bearer $TOKEN" | grep -q "metrics" && echo "✅ OK" || echo "❌ FAIL"

echo "=== Complete ==="
```

---

### Phase 2: E2Eシナリオテスト

**目的**: ユーザーフローが正常に動作することを確認

#### 2.1 Consumer Lock Flow

```typescript
// e2e/scenarios/lock-flow.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Consumer Lock Flow', () => {
  test('should complete lock flow', async ({ page }) => {
    // Step 1: Navigate to Consumer App
    await page.goto('/ja/consumer/landing');
    await expect(page.locator('h1')).toContainText('Quantum Shield');

    // Step 2: Connect Wallet (SIWE)
    await page.click('[data-testid="connect-wallet"]');
    // ... wallet connection mock

    // Step 3: Navigate to Dashboard
    await page.goto('/ja/consumer/dashboard');
    await expect(page.locator('[data-testid="total-balance"]')).toBeVisible();

    // Step 4: Navigate to Lock
    await page.click('[data-testid="lock-button"]');
    await expect(page).toHaveURL(/\/lock$/);

    // Step 5: Enter Lock Amount
    await page.fill('[data-testid="lock-amount"]', '1.0');

    // Step 6: Confirm Lock
    await page.click('[data-testid="confirm-lock"]');

    // Step 7: Verify Success
    await expect(page.locator('[data-testid="lock-success"]')).toBeVisible();
  });
});
```

#### 2.2 Prover Sign Flow

```typescript
// e2e/scenarios/prover-sign-flow.spec.ts

test.describe('Prover Sign Flow', () => {
  test('should sign unlock request', async ({ page }) => {
    // Step 1: Login as Prover
    await page.goto('/ja/prover/login');
    // ... authentication

    // Step 2: View Dashboard
    await page.goto('/ja/prover/dashboard');
    await expect(page.locator('[data-testid="pending-requests"]')).toBeVisible();

    // Step 3: View Pending Request
    await page.click('[data-testid="request-item"]');

    // Step 4: Sign Request
    await page.click('[data-testid="sign-button"]');

    // Step 5: Verify Success
    await expect(page.locator('[data-testid="sign-success"]')).toBeVisible();
  });
});
```

#### 2.3 Observer Challenge Flow

```typescript
// e2e/scenarios/observer-challenge-flow.spec.ts

test.describe('Observer Challenge Flow', () => {
  test('should submit challenge', async ({ page }) => {
    // Step 1: Login as Observer
    await page.goto('/ja/observer/login');
    // ... authentication

    // Step 2: View Dashboard
    await page.goto('/ja/observer/dashboard');

    // Step 3: View Suspicious Transaction
    await page.click('[data-testid="suspicious-tx"]');

    // Step 4: Submit Challenge
    await page.click('[data-testid="challenge-button"]');
    await page.fill('[data-testid="challenge-reason"]', 'Suspicious activity detected');
    await page.click('[data-testid="submit-challenge"]');

    // Step 5: Verify Success
    await expect(page.locator('[data-testid="challenge-submitted"]')).toBeVisible();
  });
});
```

#### 2.4 Governance Vote Flow

```typescript
// e2e/scenarios/governance-vote-flow.spec.ts

test.describe('Governance Vote Flow', () => {
  test('should vote on proposal', async ({ page }) => {
    // Step 1: Navigate to Governance
    await page.goto('/ja/governance/proposals');

    // Step 2: Select Proposal
    await page.click('[data-testid="proposal-item"]');

    // Step 3: Cast Vote
    await page.click('[data-testid="vote-for"]');

    // Step 4: Confirm
    await page.click('[data-testid="confirm-vote"]');

    // Step 5: Verify Success
    await expect(page.locator('[data-testid="vote-success"]')).toBeVisible();
  });
});
```

---

### Phase 3: L3/L1統合テスト

**目的**: ブロックチェーンとの統合が正常に動作することを確認

#### 3.1 L3 SMT証明生成

```rust
// tests/l3_integration.rs

#[tokio::test]
async fn test_smt_proof_generation() {
    let smt_service = SmtService::new();

    // Insert lock
    let lock_id = "lock_001";
    let leaf = SmtLeaf {
        lock_id: lock_id.to_string(),
        owner: "0x123...".to_string(),
        amount: 1000000000000000000u128,
        status: "locked".to_string(),
    };

    smt_service.insert(lock_id, leaf).await.unwrap();

    // Generate proof
    let proof = smt_service.generate_proof(lock_id).await.unwrap();

    assert!(!proof.siblings.is_empty());
    assert!(smt_service.verify_proof(lock_id, &proof).await.unwrap());
}
```

#### 3.2 L1 Transaction Verification

```rust
// tests/l1_integration.rs

#[tokio::test]
async fn test_l1_tx_status() {
    let l1_client = L1Client::new(&L1Config::from_env()).await.unwrap();

    // Known Sepolia transaction
    let tx_hash = "0x...";

    let status = l1_client.get_tx_status(tx_hash).await.unwrap();

    assert!(matches!(status, TxStatus::Confirmed | TxStatus::Pending));
}
```

#### 3.3 L3/L1 Bridge Flow

```rust
// tests/bridge_integration.rs

#[tokio::test]
async fn test_bridge_operation() {
    let bridge = L3L1BridgeService::new().await.unwrap();

    // Submit L3 transaction
    let l3_tx = bridge.submit_l3_tx(L3TxType::TreasuryTransfer, payload).await.unwrap();

    // Wait for L1 verification
    let l1_tx = bridge.wait_for_l1_verification(l3_tx).await.unwrap();

    assert_eq!(l1_tx.status, "confirmed");
}
```

---

## 3. テスト実行手順

### 3.1 Daily Smoke Test

```bash
#!/bin/bash
# scripts/daily-smoke.sh

echo "=== Daily Smoke Test $(date) ==="

# Phase 0: Infrastructure
./scripts/smoke-test-infra.sh

# Phase 1: API
./scripts/smoke-test-api.sh

# Phase 2: E2E (Quick)
cd apps/web
npx playwright test e2e/smoke/ --reporter=list

echo "=== Complete ==="
```

### 3.2 Full Integration Test

```bash
#!/bin/bash
# scripts/full-integration.sh

echo "=== Full Integration Test $(date) ==="

# Phase 0-2: All tests
./scripts/daily-smoke.sh

# Phase 3: L3/L1 Integration
cd services/api
cargo test integration -- --test-threads=1

# Phase 4: All E2E
cd apps/web
npx playwright test --reporter=html

echo "=== Complete ==="
echo "Report: apps/web/playwright-report/index.html"
```

### 3.3 Pre-Release Checklist

```bash
#!/bin/bash
# scripts/pre-release.sh

echo "=== Pre-Release Checklist ==="

# 1. All tests pass
./scripts/full-integration.sh
if [ $? -ne 0 ]; then
  echo "❌ Tests failed"
  exit 1
fi

# 2. No console errors
cd apps/web
pnpm build 2>&1 | grep -i "error" && echo "❌ Build errors" && exit 1

# 3. Type check
pnpm type-check 2>&1 | grep -i "error" && echo "❌ Type errors" && exit 1

# 4. Lint
pnpm lint 2>&1 | grep -i "error" && echo "❌ Lint errors" && exit 1

echo "✅ All checks passed - Ready for release"
```

---

## 4. テスト結果レポート

### 4.1 結果フォーマット

```markdown
# Integration Test Report

## Summary
- Date: YYYY-MM-DD HH:MM
- Environment: staging/production
- Duration: X minutes

## Results

| Phase | Tests | Passed | Failed | Skipped |
|-------|:-----:|:------:|:------:|:-------:|
| Phase 0: Infrastructure | 6 | 6 | 0 | 0 |
| Phase 1: API | 30 | 29 | 1 | 0 |
| Phase 2: E2E | 144 | 142 | 2 | 0 |
| Phase 3: L3/L1 | 10 | 10 | 0 | 0 |

## Failed Tests

### Phase 1.2.3: POST /v1/lock
- Error: Timeout after 30s
- Cause: L3 node not responding
- Resolution: Restart L3 node

### Phase 2.1.7: Lock Success
- Error: Element not found: [data-testid="lock-success"]
- Cause: UI changed
- Resolution: Update test selector

## Recommendations
1. Fix L3 node stability issue
2. Update E2E test selectors
```

### 4.2 CI/CD Integration

```yaml
# .github/workflows/integration-tests.yml

name: Integration Tests

on:
  push:
    branches: [main, dev/*]
  pull_request:
    branches: [main]

jobs:
  integration:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_PASSWORD: test
        ports:
          - 5432:5432

      redis:
        image: redis:7-alpine
        ports:
          - 6379:6379

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Setup Rust
        uses: actions-rs/toolchain@v1
        with:
          toolchain: stable

      - name: Install Playwright
        run: npx playwright install --with-deps

      - name: Run Infrastructure Tests
        run: ./scripts/smoke-test-infra.sh

      - name: Run API Tests
        run: ./scripts/smoke-test-api.sh

      - name: Run E2E Tests
        run: |
          cd apps/web
          npx playwright test --reporter=github

      - name: Upload Report
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: apps/web/playwright-report/
```

---

## 5. テスト優先度

### 5.1 P0（ローンチ前必須）

| # | Test | Status |
|---|------|:------:|
| 1 | Infrastructure疎通（全6項目） | ⬜ |
| 2 | SIWE認証フロー | ⬜ |
| 3 | Consumer Lock/Unlock | ⬜ |
| 4 | Prover署名フロー | ⬜ |
| 5 | SMT証明生成 | ⬜ |

### 5.2 P1（ローンチ時推奨）

| # | Test | Status |
|---|------|:------:|
| 1 | Observer Challengeフロー | ⬜ |
| 2 | Governance投票フロー | ⬜ |
| 3 | Explorer表示 | ⬜ |
| 4 | L1トランザクション検証 | ⬜ |

### 5.3 P2（ローンチ後可）

| # | Test | Status |
|---|------|:------:|
| 1 | Token Hub veQSロック | ⬜ |
| 2 | QS Hub機能 | ⬜ |
| 3 | Enterprise機能 | ⬜ |
| 4 | Admin機能 | ⬜ |

---

## Change Log

| Date | Version | Changes |
|------|---------|---------|
| 2026-02-03 | 1.0 | 初版作成: 4フェーズのテスト計画、自動化スクリプト、CI/CD統合 |
