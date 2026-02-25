import { test, expect } from '@playwright/test';
import { consumerNavigation, NavigationItem } from './navigation-flows';

/**
 * Consumer App Navigation Tests
 *
 * このテストは NAVIGATION_FLOW_SPEC.md で定義された遷移を自動検証します。
 * 「ボタンを押したら正しい画面に遷移するか」を確実にテストします。
 */

// Helper: 要素をクリックして遷移を検証
async function testNavigation(
  page: any,
  item: NavigationItem,
  locale: string = 'ja'
) {
  // 前提条件があれば実行
  if (item.precondition?.action) {
    const [action, selector, value] = item.precondition.action.split(' >> ');
    if (action === 'fill') {
      await page.locator(selector).fill(value);
    }
  }

  if (item.precondition?.waitFor) {
    await page.waitForSelector(item.precondition.waitFor);
  }

  // 要素を取得（複数セレクターはカンマ区切り）
  const selectors = item.selector.split(', ');
  let element = null;

  for (const selector of selectors) {
    try {
      element = page.locator(selector).first();
      if (await element.isVisible({ timeout: 1000 })) break;
    } catch {
      continue;
    }
  }

  if (!element) {
    throw new Error(`Element not found: ${item.selector}`);
  }

  // タイプに応じた検証
  switch (item.type) {
    case 'page':
      await element.click();
      // 遷移先URLを検証（部分一致）
      await expect(page).toHaveURL(new RegExp(item.destination.replace(/\//g, '\\/')));
      break;

    case 'modal':
      await element.click();
      // モーダルが開くことを検証
      await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });
      break;

    case 'drawer':
      await element.click();
      // ドロワーが開くことを検証
      await expect(
        page.locator('[role="dialog"], [data-state="open"]')
      ).toBeVisible({ timeout: 5000 });
      break;

    case 'scroll':
      await element.click();
      // スクロール先の要素が表示されることを検証
      const targetId = item.destination.replace('#', '');
      await expect(page.locator(`#${targetId}`)).toBeInViewport({ timeout: 5000 });
      break;

    case 'action':
      // アクションは副作用を確認（個別に実装）
      await element.click();
      break;

    case 'copy':
      // コピーはクリップボードの検証が必要
      await element.click();
      break;
  }
}

// =============================================================================
// Consumer App Navigation Tests
// =============================================================================

test.describe('Consumer App Navigation', () => {
  // -----------------------------------------------------------------------------
  // Landing Page
  // -----------------------------------------------------------------------------
  test.describe('Landing Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/ja/consumer/landing');
    });

    test('Hero CTA → onboarding', async ({ page }) => {
      const item = consumerNavigation.landing.items.find(
        (i) => i.description.includes('Hero CTA')
      );
      if (item) await testNavigation(page, item);
    });

    test('Footer 利用規約 → terms', async ({ page }) => {
      const item = consumerNavigation.landing.items.find(
        (i) => i.description.includes('利用規約')
      );
      if (item) await testNavigation(page, item);
    });

    test('Footer プライバシー → privacy', async ({ page }) => {
      const item = consumerNavigation.landing.items.find(
        (i) => i.description.includes('プライバシー')
      );
      if (item) await testNavigation(page, item);
    });
  });

  // -----------------------------------------------------------------------------
  // Dashboard
  // -----------------------------------------------------------------------------
  test.describe('Dashboard', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/ja/consumer/dashboard');
    });

    test('Nav Lock → lock', async ({ page }) => {
      const item = consumerNavigation.dashboard.items.find(
        (i) => i.description === 'Nav Lock → lock'
      );
      if (item) await testNavigation(page, item);
    });

    test('Nav Unlock → unlock', async ({ page }) => {
      const item = consumerNavigation.dashboard.items.find(
        (i) => i.description === 'Nav Unlock → unlock'
      );
      if (item) await testNavigation(page, item);
    });

    test('Nav History → history', async ({ page }) => {
      const item = consumerNavigation.dashboard.items.find(
        (i) => i.description === 'Nav History → history'
      );
      if (item) await testNavigation(page, item);
    });

    test('StatCard ロック中 → history', async ({ page }) => {
      const item = consumerNavigation.dashboard.items.find(
        (i) => i.description.includes('StatCard ロック中')
      );
      if (item) await testNavigation(page, item);
    });

    test('StatCard 利用可能 → unlock', async ({ page }) => {
      const item = consumerNavigation.dashboard.items.find(
        (i) => i.description.includes('StatCard 利用可能')
      );
      if (item) await testNavigation(page, item);
    });

    test('すべての履歴を見る → history', async ({ page }) => {
      const item = consumerNavigation.dashboard.items.find(
        (i) => i.description.includes('すべての履歴')
      );
      if (item) await testNavigation(page, item);
    });

    test('Wallet button → modal opens', async ({ page }) => {
      const item = consumerNavigation.dashboard.items.find(
        (i) => i.description.includes('Wallet button')
      );
      if (item) await testNavigation(page, item);
    });
  });

  // -----------------------------------------------------------------------------
  // Lock Flow
  // -----------------------------------------------------------------------------
  test.describe('Lock Flow', () => {
    test('Lock page 戻る → dashboard', async ({ page }) => {
      await page.goto('/ja/consumer/lock');
      const item = consumerNavigation.lock.items.find(
        (i) => i.description.includes('戻る')
      );
      if (item) await testNavigation(page, item);
    });

    test('Lock Success ダッシュボードに戻る → dashboard', async ({ page }) => {
      await page.goto('/ja/consumer/lock/success');
      const item = consumerNavigation['lock/success'].items.find(
        (i) => i.description.includes('ダッシュボード')
      );
      if (item) await testNavigation(page, item);
    });
  });

  // -----------------------------------------------------------------------------
  // Unlock Flow
  // -----------------------------------------------------------------------------
  test.describe('Unlock Flow', () => {
    test('Unlock page 戻る → dashboard', async ({ page }) => {
      await page.goto('/ja/consumer/unlock');
      const item = consumerNavigation.unlock.items.find(
        (i) => i.description.includes('戻る')
      );
      if (item) await testNavigation(page, item);
    });
  });

  // -----------------------------------------------------------------------------
  // History
  // -----------------------------------------------------------------------------
  test.describe('History', () => {
    test('History page 戻る → dashboard', async ({ page }) => {
      await page.goto('/ja/consumer/history');
      const item = consumerNavigation.history.items.find(
        (i) => i.description.includes('戻る')
      );
      if (item) await testNavigation(page, item);
    });
  });

  // -----------------------------------------------------------------------------
  // Settings
  // -----------------------------------------------------------------------------
  test.describe('Settings', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/ja/consumer/settings');
    });

    test('Settings page 戻る → dashboard', async ({ page }) => {
      const item = consumerNavigation.settings.items.find(
        (i) => i.description.includes('戻る')
      );
      if (item) await testNavigation(page, item);
    });

    test('セキュリティ → security', async ({ page }) => {
      const item = consumerNavigation.settings.items.find(
        (i) => i.description.includes('セキュリティ')
      );
      if (item) await testNavigation(page, item);
    });
  });

  // -----------------------------------------------------------------------------
  // Help
  // -----------------------------------------------------------------------------
  test.describe('Help', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/ja/consumer/help');
    });

    test('Help page 戻る → dashboard', async ({ page }) => {
      const item = consumerNavigation.help.items.find(
        (i) => i.description.includes('戻る')
      );
      if (item) await testNavigation(page, item);
    });

    test('お問い合わせ → contact', async ({ page }) => {
      const item = consumerNavigation.help.items.find(
        (i) => i.description.includes('お問い合わせ')
      );
      if (item) await testNavigation(page, item);
    });
  });

  // -----------------------------------------------------------------------------
  // Onboarding
  // -----------------------------------------------------------------------------
  test.describe('Onboarding', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/ja/consumer/onboarding');
    });

    test('スキップ → wallet-connect', async ({ page }) => {
      const item = consumerNavigation.onboarding.items.find(
        (i) => i.description.includes('スキップ')
      );
      if (item) await testNavigation(page, item);
    });
  });
});

// =============================================================================
// Mobile Navigation Tests
// =============================================================================

test.describe('Consumer App Mobile Navigation', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test.describe('Dashboard Mobile Nav', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/ja/consumer/dashboard');
    });

    test('Mobile Nav ロック → lock', async ({ page }) => {
      const mobileItem = consumerNavigation.dashboard.items.find(
        (i) => i.viewport === 'mobile' && i.description.includes('ロック')
      );
      if (mobileItem) await testNavigation(page, mobileItem);
    });
  });
});

// =============================================================================
// English Locale Tests
// =============================================================================

test.describe('Consumer App Navigation (English)', () => {
  test('Dashboard Nav Lock → lock (EN)', async ({ page }) => {
    await page.goto('/en/consumer/dashboard');
    await page.click('nav >> a:has-text("Lock")');
    await expect(page).toHaveURL(/\/en\/consumer\/lock/);
  });

  test('Landing CTA → onboarding (EN)', async ({ page }) => {
    await page.goto('/en/consumer/landing');
    await page.click('button:has-text("Get Started")');
    await expect(page).toHaveURL(/\/en\/consumer\/onboarding/);
  });
});
