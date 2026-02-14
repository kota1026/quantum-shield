import { test, expect } from '@playwright/test';
import { gotoAndWaitForApp } from '../helpers/wait-for-app';

test.setTimeout(90000);

test.describe('Token Hub FAQ', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAndWaitForApp(page, '/ja/token-hub/faq');
  });

  test.describe('Page Load & Layout', () => {
    test('should display main content area', async ({ page }) => {
      await expect(page.getByRole('main')).toBeVisible();
    });

    test('should display page title', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'よくある質問' })).toBeVisible();
    });

    test('should display header badge', async ({ page }) => {
      await expect(page.getByText('ヘルプセンター')).toBeVisible();
    });

    test('should display header with navigation', async ({ page }) => {
      await expect(page.getByText('Quantum Shield').first()).toBeVisible();
    });
  });

  test.describe('Breadcrumb', () => {
    test('should display breadcrumb navigation', async ({ page }) => {
      const breadcrumb = page.getByRole('navigation', { name: 'パンくずリストナビゲーション' });
      await expect(breadcrumb).toBeVisible();
    });

    test('should display dashboard link in breadcrumb', async ({ page }) => {
      await expect(page.getByText('ダッシュボード').first()).toBeVisible();
    });

    test('should display current page in breadcrumb', async ({ page }) => {
      const current = page.locator('[aria-current="page"]');
      await expect(current).toBeVisible();
    });
  });

  test.describe('Category Tabs', () => {
    test('should display category tablist', async ({ page }) => {
      const tablist = page.getByRole('tablist', { name: 'FAQカテゴリー' });
      await expect(tablist).toBeVisible();
    });

    test('should display all category tabs', async ({ page }) => {
      await expect(page.getByRole('tab', { name: '一般' })).toBeVisible();
      await expect(page.getByRole('tab', { name: 'ロック' })).toBeVisible();
      await expect(page.getByRole('tab', { name: 'veQS' })).toBeVisible();
      await expect(page.getByRole('tab', { name: 'ガバナンス' })).toBeVisible();
      await expect(page.getByRole('tab', { name: '報酬' })).toBeVisible();
    });

    test('should have general tab selected by default', async ({ page }) => {
      const generalTab = page.getByRole('tab', { name: '一般' });
      await expect(generalTab).toHaveAttribute('aria-selected', 'true');
    });
  });

  test.describe('FAQ Items', () => {
    test('should display FAQ questions for general category', async ({ page }) => {
      await expect(page.getByText('Token Hubとは何ですか？')).toBeVisible();
    });

    test('should expand FAQ item on click', async ({ page }) => {
      const questionButton = page.getByRole('button', { name: /Token Hubとは何ですか？/ });
      await questionButton.click();
      await expect(questionButton).toHaveAttribute('aria-expanded', 'true');
    });

    test('should collapse FAQ item on second click', async ({ page }) => {
      const questionButton = page.getByRole('button', { name: /Token Hubとは何ですか？/ });
      await questionButton.click();
      await expect(questionButton).toHaveAttribute('aria-expanded', 'true');
      await questionButton.click();
      await expect(questionButton).toHaveAttribute('aria-expanded', 'false');
    });
  });

  test.describe('Important Notice', () => {
    test('should display notice alert', async ({ page }) => {
      const alert = page.getByRole('alert');
      await expect(alert).toBeVisible();
    });

    test('should display notice title', async ({ page }) => {
      await expect(page.getByText('重要なお知らせ')).toBeVisible();
    });
  });

  test.describe('Quick Links', () => {
    test('should display quick link to onboarding', async ({ page }) => {
      await expect(page.getByText('トークノミクスを学ぶ')).toBeVisible();
    });

    test('should display quick link to lock', async ({ page }) => {
      await expect(page.getByText('QSをロック').first()).toBeVisible();
    });

    test('should display quick link to get QS', async ({ page }) => {
      await expect(page.getByText('QSトークンを入手')).toBeVisible();
    });
  });

  test.describe('Footer', () => {
    test('should display footer links', async ({ page }) => {
      await expect(page.getByText('利用規約')).toBeVisible();
      await expect(page.getByText('プライバシーポリシー')).toBeVisible();
    });

    test('should display disclaimer', async ({ page }) => {
      await expect(page.getByText(/本サービスは投資助言ではありません/)).toBeVisible();
    });
  });

  test.describe('Responsive Design', () => {
    test('should work on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await expect(page.getByRole('main')).toBeVisible();
      await expect(page.getByRole('heading', { name: 'よくある質問' })).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper ARIA landmarks', async ({ page }) => {
      await expect(page.getByRole('main')).toBeVisible();
      await expect(page.getByRole('tablist')).toBeVisible();
    });

    test('should have expandable buttons with aria-expanded', async ({ page }) => {
      const questionButtons = page.locator('button[aria-expanded]');
      const count = await questionButtons.count();
      expect(count).toBeGreaterThanOrEqual(1);
    });

    test('should have tab panel with proper role', async ({ page }) => {
      const tabpanel = page.locator('[role="tabpanel"]');
      await expect(tabpanel).toBeVisible();
    });
  });
});
