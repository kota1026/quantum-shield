import { test, expect } from '@playwright/test';
import { gotoAndWaitForApp } from '../helpers/wait-for-app';

test.setTimeout(90000);

test.describe('Token Hub Rewards History', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAndWaitForApp(page, '/ja/token-hub/rewards/history');
  });

  test.describe('Page Load & Layout', () => {
    test('should display main content area', async ({ page }) => {
      await expect(page.getByRole('main')).toBeVisible();
    });

    test('should display page title', async ({ page }) => {
      await expect(page.getByRole('heading', { name: '報酬履歴' })).toBeVisible();
    });

    test('should display page subtitle', async ({ page }) => {
      await expect(page.getByText('過去の報酬履歴を確認・分析')).toBeVisible();
    });
  });

  test.describe('Breadcrumb', () => {
    test('should display breadcrumb navigation', async ({ page }) => {
      const breadcrumb = page.getByRole('navigation', { name: 'パンくずリストナビゲーション' });
      await expect(breadcrumb).toBeVisible();
    });

    test('should display rewards link in breadcrumb', async ({ page }) => {
      await expect(page.getByText('報酬').first()).toBeVisible();
    });

    test('should display current page in breadcrumb', async ({ page }) => {
      const current = page.locator('[aria-current="page"]');
      await expect(current).toBeVisible();
    });
  });

  test.describe('Export', () => {
    test('should display export button', async ({ page }) => {
      await expect(page.getByText('エクスポート')).toBeVisible();
    });
  });

  test.describe('Stats Summary', () => {
    test('should display stats section', async ({ page }) => {
      const statsSection = page.locator('[aria-label="報酬統計サマリー"]');
      await expect(statsSection).toBeVisible();
    });

    test('should display claimed total label', async ({ page }) => {
      await expect(page.getByText('請求済み合計')).toBeVisible();
    });

    test('should display pending label', async ({ page }) => {
      await expect(page.getByText('未請求')).toBeVisible();
    });

    test('should display weekly average label', async ({ page }) => {
      await expect(page.getByText('週平均')).toBeVisible();
    });

    test('should display participation epochs label', async ({ page }) => {
      await expect(page.getByText('参加エポック数')).toBeVisible();
    });
  });

  test.describe('Chart', () => {
    test('should display chart heading', async ({ page }) => {
      await expect(page.getByText('報酬推移')).toBeVisible();
    });

    test('should display time view toggle', async ({ page }) => {
      await expect(page.getByText('週次')).toBeVisible();
      await expect(page.getByText('月次')).toBeVisible();
    });
  });

  test.describe('Rewards List', () => {
    test('should display list heading', async ({ page }) => {
      await expect(page.getByText('報酬明細')).toBeVisible();
    });

    test('should display filter buttons', async ({ page }) => {
      await expect(page.getByText('すべて').first()).toBeVisible();
      await expect(page.getByText('保有報酬')).toBeVisible();
      await expect(page.getByText('投票報酬')).toBeVisible();
      await expect(page.getByText('委任報酬')).toBeVisible();
    });

    test('should display rewards history list', async ({ page }) => {
      const list = page.getByRole('list', { name: '報酬履歴リスト' });
      await expect(list).toBeVisible();
    });
  });

  test.describe('Pagination', () => {
    test('should display pagination controls', async ({ page }) => {
      await expect(page.getByText(/ページ/)).toBeVisible();
    });
  });

  test.describe('Back Link', () => {
    test('should display back to rewards link', async ({ page }) => {
      await expect(page.getByText('報酬ページに戻る')).toBeVisible();
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
      await expect(page.getByRole('navigation', { name: 'パンくずリストナビゲーション' })).toBeVisible();
    });

    test('should have accessible stats section', async ({ page }) => {
      await expect(page.locator('[aria-label="報酬統計サマリー"]')).toBeVisible();
    });
  });
});
