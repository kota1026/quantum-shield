import { test, expect } from '@playwright/test';
import { gotoAndWaitForApp } from '../helpers/wait-for-app';

test.setTimeout(90000);

test.describe('Token Hub Unlock', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAndWaitForApp(page, '/ja/qs-hub/stake/unlock');
  });

  test.describe('Page Load & Layout', () => {
    test('should display main content area', async ({ page }) => {
      await expect(page.getByRole('main')).toBeVisible();
    });

    test('should display page title', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'ロック解除' })).toBeVisible();
    });

    test('should display page subtitle', async ({ page }) => {
      await expect(page.getByText('ロック期間が終了したQSトークンを引き出せます')).toBeVisible();
    });

    test('should display header with navigation', async ({ page }) => {
      await expect(page.getByText('Quantum Shield').first()).toBeVisible();
    });
  });

  test.describe('Summary Stats', () => {
    test('should display stats section', async ({ page }) => {
      const statsSection = page.locator('[aria-label="ロック統計"]');
      await expect(statsSection).toBeVisible();
    });

    test('should display total locked label', async ({ page }) => {
      await expect(page.getByText('総ロック量')).toBeVisible();
    });

    test('should display current veQS label', async ({ page }) => {
      await expect(page.getByText('現在のveQS').first()).toBeVisible();
    });

    test('should display positions count label', async ({ page }) => {
      await expect(page.getByText('ポジション数')).toBeVisible();
    });

    test('should display unlockable label', async ({ page }) => {
      await expect(page.getByText('解除可能')).toBeVisible();
    });
  });

  test.describe('Info Notice', () => {
    test('should display no early unlock notice', async ({ page }) => {
      await expect(page.getByText(/ロック期間中はトークンを引き出すことができません/)).toBeVisible();
    });

    test('should display FAQ link', async ({ page }) => {
      await expect(page.getByText('詳しくはFAQをご覧ください')).toBeVisible();
    });
  });

  test.describe('Locked Positions', () => {
    test('should display positions heading', async ({ page }) => {
      await expect(page.getByText('ロックポジション')).toBeVisible();
    });

    test('should display positions list', async ({ page }) => {
      const list = page.getByRole('list', { name: 'ロックポジション一覧' });
      await expect(list).toBeVisible();
    });

    test('should display position detail labels', async ({ page }) => {
      await expect(page.getByText('ロック日').first()).toBeVisible();
      await expect(page.getByText('解除可能日').first()).toBeVisible();
    });

    test('should display locked status', async ({ page }) => {
      await expect(page.getByText('ロック中').first()).toBeVisible();
    });

    test('should display progress bar for active positions', async ({ page }) => {
      const progressBars = page.getByRole('progressbar');
      const count = await progressBars.count();
      expect(count).toBeGreaterThanOrEqual(1);
    });
  });

  test.describe('Unlock Tooltip', () => {
    test('should display tooltip button', async ({ page }) => {
      const tooltipBtn = page.getByRole('button', { name: /ロック解除について/ });
      await expect(tooltipBtn).toBeVisible();
    });
  });

  test.describe('CTA Section', () => {
    test('should display CTA heading', async ({ page }) => {
      await expect(page.getByText('もっとロックしますか？')).toBeVisible();
    });

    test('should display lock more link', async ({ page }) => {
      await expect(page.getByText('追加でロック')).toBeVisible();
    });

    test('should display view dashboard link', async ({ page }) => {
      await expect(page.getByText('ダッシュボードを見る')).toBeVisible();
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
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper ARIA landmarks', async ({ page }) => {
      await expect(page.getByRole('main')).toBeVisible();
    });

    test('should have accessible stats section', async ({ page }) => {
      const statsSection = page.locator('[aria-label="ロック統計"]');
      await expect(statsSection).toBeVisible();
    });

    test('should have accessible positions list', async ({ page }) => {
      const list = page.getByRole('list', { name: 'ロックポジション一覧' });
      await expect(list).toBeVisible();
    });
  });
});
