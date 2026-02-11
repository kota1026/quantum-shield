# 37_e2e_test.md - E2E Testing Prompt

## Phase 6: E2Eテスト実装

> **Version**: 1.0
> **Date**: 2026-01-14
> **Purpose**: 8システム98画面のE2Eテスト作成
> **Structure**: Anthropic Claude 4.x XML Best Practices準拠

---

## 1. Overview

<purpose>
Playwrightを使用して8システム98画面のE2Eテストを実装する。
ユーザージャーニーベースのテストシナリオで品質を保証。
</purpose>

<test_framework>
  <tool>Playwright</tool>
  <version>^1.40.0</version>
  <features>
    <feature>Cross-browser testing (Chrome, Firefox, Safari)</feature>
    <feature>Mobile viewport testing</feature>
    <feature>Visual regression testing</feature>
    <feature>Accessibility testing (axe-core)</feature>
  </features>
</test_framework>

---

## 2. Required Context

<required_context>
  <core_specs priority="MUST_READ">
    <path>docs_new/01_phase/02_phase2/SEQUENCES.md</path>
    <purpose>ユーザーフロー定義</purpose>
  </core_specs>
  <design_guidelines priority="MUST_READ">
    <path>docs_new/01_phase/04_phase4/01_design/UI_DESIGN_GUIDELINES.md</path>
    <purpose>UIコンポーネント仕様</purpose>
  </design_guidelines>
  <phase4_mocks priority="SHOULD_READ">
    <path>docs_new/01_phase/04_phase4/01_design/system_{01-08}/</path>
    <purpose>画面構成の確認</purpose>
  </phase4_mocks>
</required_context>

---

## 3. Test Configuration

### 3.1 playwright.config.ts

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
  ],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    // Desktop
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    // Mobile
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 13'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

### 3.2 Test Fixtures

```typescript
// e2e/fixtures.ts

import { test as base, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

type Fixtures = {
  a11y: AxeBuilder;
  mockWallet: {
    address: string;
    connect: () => Promise<void>;
  };
};

export const test = base.extend<Fixtures>({
  a11y: async ({ page }, use) => {
    const axe = new AxeBuilder({ page }).withTags([
      'wcag2a',
      'wcag2aa',
      'wcag21aa',
    ]);
    await use(axe);
  },
  mockWallet: async ({ page }, use) => {
    const wallet = {
      address: '0x1234567890abcdef1234567890abcdef12345678',
      connect: async () => {
        await page.evaluate((addr) => {
          window.localStorage.setItem('mockWalletAddress', addr);
        }, wallet.address);
      },
    };
    await use(wallet);
  },
});

export { expect };
```

---

## 4. Test Scenarios by System

### 4.1 System 01: Consumer App (19 Screens)

<test_scenarios system="consumer">

```typescript
// e2e/consumer/lock-flow.spec.ts

import { test, expect } from '../fixtures';

test.describe('Consumer App - Lock Flow', () => {
  test.beforeEach(async ({ page, mockWallet }) => {
    await mockWallet.connect();
    await page.goto('/consumer');
  });

  test('should complete lock journey', async ({ page, a11y }) => {
    // Dashboard表示
    await expect(page.getByRole('heading', { name: /Dashboard/i })).toBeVisible();

    // アクセシビリティチェック
    const a11yResults = await a11y.analyze();
    expect(a11yResults.violations).toEqual([]);

    // Lock Wizardへ
    await page.getByRole('button', { name: /Lock Assets/i }).click();
    await expect(page).toHaveURL(/\/consumer\/lock/);

    // Step 1: 金額入力
    await page.getByLabel(/Amount/i).fill('1.5');
    await page.getByRole('button', { name: /Next/i }).click();

    // Step 2: 鍵生成
    await page.getByRole('button', { name: /Generate Keys/i }).click();
    await expect(page.getByText(/Key generated/i)).toBeVisible({ timeout: 10000 });
    await page.getByRole('button', { name: /Next/i }).click();

    // Step 3: 確認
    await expect(page.getByText(/1.5 ETH/i)).toBeVisible();
    await page.getByRole('button', { name: /Confirm Lock/i }).click();

    // 完了
    await expect(page.getByRole('heading', { name: /Lock Complete/i })).toBeVisible();
  });

  test('should display error on insufficient balance', async ({ page }) => {
    await page.goto('/consumer/lock');
    await page.getByLabel(/Amount/i).fill('999999');
    await page.getByRole('button', { name: /Next/i }).click();

    await expect(page.getByRole('alert')).toContainText(/Insufficient balance/i);
  });
});
```

```typescript
// e2e/consumer/unlock-flow.spec.ts

import { test, expect } from '../fixtures';

test.describe('Consumer App - Unlock Flow', () => {
  test('should request unlock with Dilithium signature', async ({ page, mockWallet }) => {
    await mockWallet.connect();
    await page.goto('/consumer/unlock');

    // ロック選択
    await page.getByRole('row', { name: /Active Lock/i }).click();

    // 署名生成
    await page.getByRole('button', { name: /Sign with Dilithium/i }).click();
    await expect(page.getByText(/Signature verified/i)).toBeVisible({ timeout: 5000 });

    // アンロック申請
    await page.getByRole('button', { name: /Submit Request/i }).click();
    await expect(page.getByText(/Unlock requested/i)).toBeVisible();
  });
});
```

</test_scenarios>

### 4.2 System 02: Token Hub (10 Screens)

<test_scenarios system="token_hub">

```typescript
// e2e/token-hub/staking.spec.ts

import { test, expect } from '../fixtures';

test.describe('Token Hub - Staking', () => {
  test('should stake QS tokens', async ({ page, mockWallet }) => {
    await mockWallet.connect();
    await page.goto('/token-hub/stake');

    // ステーキング量入力
    await page.getByLabel(/Amount to stake/i).fill('1000');

    // 期間選択
    await page.getByRole('combobox', { name: /Lock Period/i }).selectOption('90');

    // APY確認
    await expect(page.getByText(/Estimated APY/i)).toContainText(/8.5%/);

    // ステーキング実行
    await page.getByRole('button', { name: /Stake/i }).click();
    await expect(page.getByText(/Successfully staked/i)).toBeVisible();
  });

  test('should delegate to prover', async ({ page, mockWallet }) => {
    await mockWallet.connect();
    await page.goto('/token-hub/delegate');

    // Prover選択
    await page.getByRole('row', { name: /Prover Alpha/i }).click();

    // 委任量入力
    await page.getByLabel(/Amount/i).fill('500');

    // 委任実行
    await page.getByRole('button', { name: /Delegate/i }).click();
    await expect(page.getByText(/Delegation successful/i)).toBeVisible();
  });
});
```

</test_scenarios>

### 4.3 System 03: Governance (6 Screens)

<test_scenarios system="governance">

```typescript
// e2e/governance/proposal.spec.ts

import { test, expect } from '../fixtures';

test.describe('Governance - Proposals', () => {
  test('should view proposal list', async ({ page }) => {
    await page.goto('/governance');

    await expect(page.getByRole('heading', { name: /Active Proposals/i })).toBeVisible();
    await expect(page.getByRole('table')).toBeVisible();
  });

  test('should vote on proposal', async ({ page, mockWallet }) => {
    await mockWallet.connect();
    await page.goto('/governance/proposals/1');

    // 投票ボタン
    await page.getByRole('button', { name: /Vote For/i }).click();

    // 確認モーダル
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByRole('button', { name: /Confirm Vote/i }).click();

    // 成功
    await expect(page.getByText(/Vote submitted/i)).toBeVisible();
  });
});
```

</test_scenarios>

### 4.4 System 04: Prover Portal (11 Screens)

<test_scenarios system="prover">

```typescript
// e2e/prover/application.spec.ts

import { test, expect } from '../fixtures';

test.describe('Prover Portal - Application', () => {
  test('should submit prover application', async ({ page, mockWallet }) => {
    await mockWallet.connect();
    await page.goto('/prover/apply');

    // フォーム入力
    await page.getByLabel(/Node URL/i).fill('https://prover.example.com');
    await page.getByLabel(/Stake Amount/i).fill('10000');
    await page.getByLabel(/Description/i).fill('High-performance prover node');

    // ファイルアップロード
    const fileInput = page.getByLabel(/Upload Certificate/i);
    await fileInput.setInputFiles('fixtures/certificate.pem');

    // 送信
    await page.getByRole('button', { name: /Submit Application/i }).click();
    await expect(page.getByText(/Application submitted/i)).toBeVisible();
  });

  test('should display prover dashboard', async ({ page, mockWallet }) => {
    await mockWallet.connect();
    await page.goto('/prover/dashboard');

    await expect(page.getByText(/Verification Tasks/i)).toBeVisible();
    await expect(page.getByText(/Earnings/i)).toBeVisible();
    await expect(page.getByText(/Uptime/i)).toBeVisible();
  });
});
```

</test_scenarios>

### 4.5 System 05: Observer (7 Screens)

<test_scenarios system="observer">

```typescript
// e2e/observer/monitor.spec.ts

import { test, expect } from '../fixtures';

test.describe('Observer - Real-time Monitoring', () => {
  test('should display live network status', async ({ page }) => {
    await page.goto('/observer');

    // リアルタイムデータ
    await expect(page.getByTestId('network-status')).toBeVisible();
    await expect(page.getByText(/Active Provers/i)).toBeVisible();
    await expect(page.getByText(/Total Locked/i)).toBeVisible();

    // チャート表示
    await expect(page.locator('canvas').first()).toBeVisible();
  });
});
```

</test_scenarios>

### 4.6 System 06: Explorer (8 Screens)

<test_scenarios system="explorer">

```typescript
// e2e/explorer/search.spec.ts

import { test, expect } from '../fixtures';

test.describe('Explorer - Search', () => {
  test('should search by transaction hash', async ({ page }) => {
    await page.goto('/explorer');

    const txHash = '0xabc123...';
    await page.getByPlaceholder(/Search/i).fill(txHash);
    await page.getByRole('button', { name: /Search/i }).click();

    await expect(page).toHaveURL(/\/explorer\/tx\//);
    await expect(page.getByText(/Transaction Details/i)).toBeVisible();
  });

  test('should search by address', async ({ page }) => {
    await page.goto('/explorer');

    const address = '0x1234...';
    await page.getByPlaceholder(/Search/i).fill(address);
    await page.getByRole('button', { name: /Search/i }).click();

    await expect(page).toHaveURL(/\/explorer\/address\//);
    await expect(page.getByText(/Address Details/i)).toBeVisible();
  });
});
```

</test_scenarios>

### 4.7 System 07: Enterprise Admin (25 Screens)

<test_scenarios system="enterprise">

```typescript
// e2e/enterprise/org-management.spec.ts

import { test, expect } from '../fixtures';

test.describe('Enterprise Admin - Organization Management', () => {
  test.beforeEach(async ({ page }) => {
    // Enterprise admin login
    await page.goto('/enterprise/login');
    await page.getByLabel(/Email/i).fill('admin@corp.example.com');
    await page.getByLabel(/Password/i).fill('SecureP@ss123');
    await page.getByRole('button', { name: /Sign In/i }).click();
    await expect(page).toHaveURL('/enterprise/dashboard');
  });

  test('should manage team members', async ({ page }) => {
    await page.goto('/enterprise/team');

    // メンバー追加
    await page.getByRole('button', { name: /Add Member/i }).click();
    await page.getByLabel(/Email/i).fill('new.member@corp.example.com');
    await page.getByRole('combobox', { name: /Role/i }).selectOption('viewer');
    await page.getByRole('button', { name: /Invite/i }).click();

    await expect(page.getByText(/Invitation sent/i)).toBeVisible();
  });

  test('should configure API keys', async ({ page }) => {
    await page.goto('/enterprise/api-keys');

    await page.getByRole('button', { name: /Generate Key/i }).click();
    await page.getByLabel(/Key Name/i).fill('Production API');
    await page.getByRole('button', { name: /Create/i }).click();

    await expect(page.getByText(/API key created/i)).toBeVisible();
    await expect(page.getByTestId('api-key-value')).toBeVisible();
  });
});
```

</test_scenarios>

### 4.8 System 08: QS Admin (12 Screens)

<test_scenarios system="qs_admin">

```typescript
// e2e/admin/system-management.spec.ts

import { test, expect } from '../fixtures';

test.describe('QS Admin - System Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/login');
    await page.getByLabel(/Admin Key/i).fill(process.env.ADMIN_KEY!);
    await page.getByRole('button', { name: /Authenticate/i }).click();
  });

  test('should view system metrics', async ({ page }) => {
    await page.goto('/admin/metrics');

    await expect(page.getByText(/Total Users/i)).toBeVisible();
    await expect(page.getByText(/Active Locks/i)).toBeVisible();
    await expect(page.getByText(/Network Health/i)).toBeVisible();
  });

  test('should manage prover applications', async ({ page }) => {
    await page.goto('/admin/provers/applications');

    // 申請一覧
    await expect(page.getByRole('table')).toBeVisible();

    // 承認
    await page.getByRole('row', { name: /Pending/i }).first()
      .getByRole('button', { name: /Approve/i }).click();

    await expect(page.getByText(/Application approved/i)).toBeVisible();
  });
});
```

</test_scenarios>

---

## 5. Visual Regression Testing

```typescript
// e2e/visual/snapshots.spec.ts

import { test, expect } from '@playwright/test';

const SYSTEMS = [
  { name: 'consumer', paths: ['/', '/lock', '/unlock', '/history'] },
  { name: 'token-hub', paths: ['/', '/stake', '/delegate', '/rewards'] },
  { name: 'governance', paths: ['/', '/proposals/1', '/council'] },
  { name: 'prover', paths: ['/', '/dashboard', '/apply'] },
  { name: 'observer', paths: ['/'] },
  { name: 'explorer', paths: ['/', '/tx/0x123', '/address/0x456'] },
  { name: 'enterprise', paths: ['/dashboard', '/team', '/settings'] },
  { name: 'admin', paths: ['/dashboard', '/provers', '/metrics'] },
];

for (const system of SYSTEMS) {
  test.describe(`Visual - ${system.name}`, () => {
    for (const path of system.paths) {
      test(`should match snapshot: ${path}`, async ({ page }) => {
        await page.goto(`/${system.name}${path}`);
        await page.waitForLoadState('networkidle');

        await expect(page).toHaveScreenshot(`${system.name}${path.replace(/\//g, '-')}.png`, {
          maxDiffPixels: 100,
        });
      });
    }
  });
}
```

---

## 6. i18n Testing

```typescript
// e2e/i18n/language-switch.spec.ts

import { test, expect } from '@playwright/test';

test.describe('i18n - Language Switching', () => {
  const pages = [
    '/consumer',
    '/token-hub',
    '/governance',
    '/prover',
    '/observer',
    '/explorer',
    '/enterprise/dashboard',
    '/admin/dashboard',
  ];

  for (const path of pages) {
    test(`should switch language on ${path}`, async ({ page }) => {
      // 日本語
      await page.goto(`/ja${path}`);
      await expect(page.locator('html')).toHaveAttribute('lang', 'ja');
      const jaText = await page.getByRole('heading').first().textContent();

      // 英語に切り替え
      await page.getByRole('button', { name: /Language/i }).click();
      await page.getByRole('menuitem', { name: /English/i }).click();

      await expect(page).toHaveURL(`/en${path}`);
      await expect(page.locator('html')).toHaveAttribute('lang', 'en');
      const enText = await page.getByRole('heading').first().textContent();

      // テキストが異なることを確認
      expect(jaText).not.toEqual(enText);
    });
  }
});
```

---

## 7. CI/CD Integration

```yaml
# .github/workflows/e2e.yml

name: E2E Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  e2e:
    runs-on: ubuntu-latest
    timeout-minutes: 30

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps

      - name: Build application
        run: npm run build

      - name: Start test server
        run: npm run start &
        env:
          DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}

      - name: Wait for server
        run: npx wait-on http://localhost:3000

      - name: Run E2E tests
        run: npx playwright test
        env:
          BASE_URL: http://localhost:3000

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 7

      - name: Upload screenshots
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: screenshots
          path: test-results/
```

---

## 8. Output Checklist

```markdown
## E2E Test Implementation Checklist

### By System
| System | Screens | Tests | Coverage |
|--------|:-------:|:-----:|:--------:|
| Consumer | 19 | | ⬜ |
| Token Hub | 10 | | ⬜ |
| Governance | 6 | | ⬜ |
| Prover | 11 | | ⬜ |
| Observer | 7 | | ⬜ |
| Explorer | 8 | | ⬜ |
| Enterprise | 25 | | ⬜ |
| QS Admin | 12 | | ⬜ |
| **Total** | **98** | | |

### Test Types
- [ ] User journey tests (critical paths)
- [ ] Accessibility tests (axe-core)
- [ ] Visual regression tests
- [ ] i18n tests (ja/en switching)
- [ ] Mobile viewport tests
- [ ] Cross-browser tests

### CI/CD
- [ ] GitHub Actions workflow
- [ ] Test artifacts upload
- [ ] PR status checks

### Judgment
- [ ] ✅ **PASS** - All tests passing
- [ ] ⚠️ **PARTIAL** - Some tests failing
- [ ] ❌ **FAIL** - Critical tests failing
```

---

**END OF PROMPT**
