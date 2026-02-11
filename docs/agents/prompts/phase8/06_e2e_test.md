# Phase 8-E-1: E2E Test Prompt

> **Version**: 1.0
> **Trigger**: `Phase 8-E E2E 開始`
> **前提**: Phase 8-D Gate通過

---

## Overview

QS Admin全38画面のE2Eテストを作成・実行。

```
Input:  実装済み画面 + バックエンドAPI
Output: E2Eテストファイル + テスト結果
Gate:   全テスト通過
```

---

## テスト構成

```
apps/web/e2e/
├── qs-admin/
│   ├── auth/
│   │   ├── login.spec.ts
│   │   └── logout.spec.ts
│   ├── dashboard/
│   │   └── dashboard.spec.ts
│   ├── transactions/
│   │   ├── dashboard.spec.ts
│   │   ├── lock.spec.ts
│   │   ├── unlock.spec.ts
│   │   ├── emergency.spec.ts
│   │   └── challenge.spec.ts
│   ├── users/
│   │   ├── dashboard.spec.ts
│   │   ├── list.spec.ts
│   │   └── detail.spec.ts
│   ├── prover/
│   │   ├── dashboard.spec.ts
│   │   ├── requests.spec.ts
│   │   └── list.spec.ts
│   ├── observer/
│   │   ├── dashboard.spec.ts
│   │   └── list.spec.ts
│   ├── treasury/
│   │   ├── dashboard.spec.ts
│   │   ├── wallets.spec.ts
│   │   ├── transfers.spec.ts
│   │   ├── budget.spec.ts
│   │   └── audit.spec.ts
│   ├── governance/
│   │   ├── dashboard.spec.ts
│   │   ├── proposals.spec.ts
│   │   └── voting.spec.ts
│   ├── members/
│   │   ├── list.spec.ts
│   │   └── roles.spec.ts
│   ├── support/
│   │   ├── dashboard.spec.ts
│   │   ├── tickets.spec.ts
│   │   └── faq.spec.ts
│   ├── announcements/
│   │   ├── list.spec.ts
│   │   └── edit.spec.ts
│   ├── analytics/
│   │   ├── overview.spec.ts
│   │   ├── users.spec.ts
│   │   ├── revenue.spec.ts
│   │   └── reports.spec.ts
│   └── system/
│       ├── settings.spec.ts
│       ├── alerts.spec.ts
│       ├── logs.spec.ts
│       └── maintenance.spec.ts
├── fixtures/
│   └── admin-auth.ts
└── helpers/
    └── api-mock.ts
```

---

## テストテンプレート

### 認証フィクスチャ

```typescript
// e2e/fixtures/admin-auth.ts
import { test as base, expect } from '@playwright/test';

type AdminFixtures = {
  adminPage: Page;
  apiContext: APIRequestContext;
};

export const test = base.extend<AdminFixtures>({
  adminPage: async ({ page, context }, use) => {
    // 認証済み状態をセットアップ
    await page.goto('/ja/qs-admin/auth/login');

    await page.fill('[data-testid="email"]', 'admin@example.com');
    await page.fill('[data-testid="password"]', 'testpassword123');
    await page.click('[data-testid="login-button"]');

    // ダッシュボードにリダイレクトされるのを待つ
    await page.waitForURL('**/qs-admin/dashboard');

    await use(page);
  },

  apiContext: async ({ playwright }, use) => {
    const context = await playwright.request.newContext({
      baseURL: process.env.API_URL || 'http://localhost:3001',
      extraHTTPHeaders: {
        'Authorization': `Bearer ${process.env.TEST_ADMIN_TOKEN}`,
      },
    });
    await use(context);
    await context.dispose();
  },
});

export { expect };
```

### 画面テストテンプレート

```typescript
// e2e/qs-admin/dashboard/dashboard.spec.ts
import { test, expect } from '../../fixtures/admin-auth';

test.describe('QS Admin Dashboard', () => {
  test.beforeEach(async ({ adminPage }) => {
    await adminPage.goto('/ja/qs-admin/dashboard');
  });

  test('should display dashboard with all sections', async ({ adminPage }) => {
    // タイトル確認
    await expect(adminPage.locator('h1')).toContainText('ダッシュボード');

    // 統計カード確認
    await expect(adminPage.locator('[data-testid="stat-total-users"]')).toBeVisible();
    await expect(adminPage.locator('[data-testid="stat-total-locks"]')).toBeVisible();
    await expect(adminPage.locator('[data-testid="stat-total-volume"]')).toBeVisible();

    // 最近のアクティビティ確認
    await expect(adminPage.locator('[data-testid="recent-activity"]')).toBeVisible();

    // アラート確認
    await expect(adminPage.locator('[data-testid="alerts-section"]')).toBeVisible();
  });

  test('should navigate to transactions from dashboard', async ({ adminPage }) => {
    await adminPage.click('[data-testid="nav-transactions"]');
    await expect(adminPage).toHaveURL(/.*\/qs-admin\/transactions/);
  });

  test('should display real data from API', async ({ adminPage, apiContext }) => {
    // API直接呼び出しで期待値取得
    const response = await apiContext.get('/admin/dashboard/stats');
    const stats = await response.json();

    // 画面表示と一致確認
    const totalUsers = await adminPage.locator('[data-testid="stat-total-users"] .value').textContent();
    expect(parseInt(totalUsers || '0')).toBe(stats.totalUsers);
  });
});
```

### CRUD操作テスト

```typescript
// e2e/qs-admin/treasury/transfers.spec.ts
import { test, expect } from '../../fixtures/admin-auth';

test.describe('Treasury Transfers', () => {
  test('should create new transfer request', async ({ adminPage }) => {
    await adminPage.goto('/ja/qs-admin/treasury/transfers');

    // 新規転送ボタンクリック
    await adminPage.click('[data-testid="new-transfer-button"]');

    // フォーム入力
    await adminPage.selectOption('[data-testid="from-wallet"]', 'operational');
    await adminPage.selectOption('[data-testid="to-wallet"]', 'grants');
    await adminPage.fill('[data-testid="amount"]', '1000');
    await adminPage.fill('[data-testid="description"]', 'Test transfer');

    // 送信
    await adminPage.click('[data-testid="submit-button"]');

    // 確認ダイアログ
    await expect(adminPage.locator('[data-testid="confirm-dialog"]')).toBeVisible();
    await adminPage.click('[data-testid="confirm-button"]');

    // 成功メッセージ
    await expect(adminPage.locator('[data-testid="success-toast"]')).toBeVisible();

    // 一覧に表示されることを確認
    await expect(adminPage.locator('table tbody tr').first()).toContainText('Test transfer');
  });

  test('should approve transfer with multisig', async ({ adminPage }) => {
    await adminPage.goto('/ja/qs-admin/treasury/transfers');

    // 承認待ちの転送をクリック
    await adminPage.click('[data-testid="pending-transfer-row"]');

    // 詳細モーダル表示
    await expect(adminPage.locator('[data-testid="transfer-detail-modal"]')).toBeVisible();

    // 署名数確認
    const sigCount = await adminPage.locator('[data-testid="signature-count"]').textContent();
    expect(sigCount).toMatch(/\d+\/\d+/);

    // 承認ボタンクリック
    await adminPage.click('[data-testid="approve-button"]');

    // L3署名リクエスト（モーダル）
    await expect(adminPage.locator('[data-testid="l3-signing-modal"]')).toBeVisible();
    await adminPage.click('[data-testid="confirm-sign"]');

    // 成功
    await expect(adminPage.locator('[data-testid="success-toast"]')).toBeVisible();
  });
});
```

### エラーケーステスト

```typescript
// e2e/qs-admin/users/list.spec.ts
import { test, expect } from '../../fixtures/admin-auth';

test.describe('Users List - Error Cases', () => {
  test('should handle API error gracefully', async ({ adminPage, page }) => {
    // APIエラーをモック
    await page.route('**/admin/users', (route) => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Internal Server Error' }),
      });
    });

    await adminPage.goto('/ja/qs-admin/users');

    // エラーメッセージ表示
    await expect(adminPage.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(adminPage.locator('[data-testid="error-message"]')).toContainText('エラーが発生しました');

    // リトライボタン
    await expect(adminPage.locator('[data-testid="retry-button"]')).toBeVisible();
  });

  test('should handle empty state', async ({ adminPage, page }) => {
    // 空配列を返すようモック
    await page.route('**/admin/users', (route) => {
      route.fulfill({
        status: 200,
        body: JSON.stringify([]),
      });
    });

    await adminPage.goto('/ja/qs-admin/users');

    // 空状態メッセージ
    await expect(adminPage.locator('[data-testid="empty-state"]')).toBeVisible();
    await expect(adminPage.locator('[data-testid="empty-state"]')).toContainText('ユーザーが見つかりません');
  });
});
```

---

## テスト実行

### 全テスト実行

```bash
cd apps/web

# 開発サーバー起動（別ターミナル）
pnpm dev

# APIサーバー起動（別ターミナル）
cd services/api && cargo run

# E2Eテスト実行
npx playwright test e2e/qs-admin/

# レポート確認
npx playwright show-report
```

### 特定テスト実行

```bash
# ダッシュボードのみ
npx playwright test e2e/qs-admin/dashboard/

# Treasuryのみ
npx playwright test e2e/qs-admin/treasury/

# 特定ファイル
npx playwright test e2e/qs-admin/treasury/transfers.spec.ts
```

### CI用実行

```bash
# ヘッドレスモード
npx playwright test e2e/qs-admin/ --reporter=json > test-results.json

# 並列実行
npx playwright test e2e/qs-admin/ --workers=4
```

---

## テスト品質基準

### 各画面に必要なテスト

| テスト種別 | 必須 | 内容 |
|-----------|:----:|------|
| 表示テスト | ✅ | 画面要素の存在確認 |
| ナビゲーション | ✅ | リンク/ボタンの遷移確認 |
| データ表示 | ✅ | APIデータが正しく表示されるか |
| CRUD操作 | 該当時 | 作成/読取/更新/削除 |
| エラー処理 | ✅ | APIエラー時の振る舞い |
| 空状態 | ✅ | データがない場合の表示 |
| 権限確認 | 該当時 | 権限不足時の振る舞い |

### カバレッジ目標

```yaml
目標:
  - 画面カバレッジ: 100% (38/38画面)
  - 操作カバレッジ: 90%以上
  - エラーケース: 各画面1つ以上

計測:
  npx playwright test --reporter=html
  # → playwwright-report/index.html で確認
```

---

## 完了レポートテンプレート

```markdown
## E2E Test Report

### 実行日時
{timestamp}

### テスト結果サマリー

| Category | Tests | Passed | Failed | Skipped |
|----------|:-----:|:------:|:------:|:-------:|
| Dashboard | {n} | {n} | {n} | {n} |
| Transactions | {n} | {n} | {n} | {n} |
| Users | {n} | {n} | {n} | {n} |
| Prover | {n} | {n} | {n} | {n} |
| Observer | {n} | {n} | {n} | {n} |
| Treasury | {n} | {n} | {n} | {n} |
| Governance | {n} | {n} | {n} | {n} |
| Members | {n} | {n} | {n} | {n} |
| Support | {n} | {n} | {n} | {n} |
| Announcements | {n} | {n} | {n} | {n} |
| Analytics | {n} | {n} | {n} | {n} |
| System | {n} | {n} | {n} | {n} |
| **Total** | **{n}** | **{n}** | **{n}** | **{n}** |

### 画面カバレッジ

| Screen | Tests | Status |
|--------|:-----:|:------:|
| Dashboard | {n} | ✅ |
| Transactions Dashboard | {n} | ✅ |
| ... | ... | ... |

### 失敗テスト詳細

| Test | Error | Screenshot |
|------|-------|------------|
| {test_name} | {error} | [link] |

### 次のステップ
→ Log Verification (07_log_verification.md)
```

---

**Document End**
