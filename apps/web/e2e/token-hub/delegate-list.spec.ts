import { test, expect } from '@playwright/test';
import { gotoAndWaitForApp } from '../helpers/wait-for-app';

test.setTimeout(90000);

test.describe('Token Hub Delegate List', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAndWaitForApp(page, '/ja/token-hub/delegate-list');
  });

  test.describe('Page Load & Layout', () => {
    test('should display main content area', async ({ page }) => {
      await expect(page.getByRole('main')).toBeVisible();
    });

    test('should display page title', async ({ page }) => {
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    });

    test('should display page subtitle', async ({ page }) => {
      await expect(page.getByText('信頼できるデリゲートにveQSを委任して投票力を活用')).toBeVisible();
    });

    test('should display header with navigation', async ({ page }) => {
      await expect(page.getByText('Quantum Shield').first()).toBeVisible();
      const nav = page.getByRole('navigation', { name: 'Token Hub ナビゲーション' });
      await expect(nav).toBeVisible();
    });
  });

  test.describe('My Delegation Summary', () => {
    test('should display delegation summary region', async ({ page }) => {
      const summaryRegion = page.locator('[role="region"]').first();
      await expect(summaryRegion).toBeVisible();
    });

    test('should display delegated veQS label', async ({ page }) => {
      await expect(page.getByText('委任済みveQS')).toBeVisible();
    });
  });

  test.describe('Total Statistics', () => {
    test('should display total stats region', async ({ page }) => {
      const statsRegion = page.locator('[aria-label="デリゲート全体の統計"]');
      await expect(statsRegion).toBeVisible();
    });

    test('should display total veQS label', async ({ page }) => {
      await expect(page.getByText('総veQS')).toBeVisible();
    });

    test('should display total delegators label', async ({ page }) => {
      await expect(page.getByText('総委任者数')).toBeVisible();
    });

    test('should display average participation label', async ({ page }) => {
      await expect(page.getByText('平均投票率')).toBeVisible();
    });
  });

  test.describe('Search & Filters', () => {
    test('should display search input', async ({ page }) => {
      const searchInput = page.locator('input[type="search"]');
      await expect(searchInput).toBeVisible();
    });

    test('should display filter buttons', async ({ page }) => {
      const filterGroup = page.locator('[role="group"]');
      await expect(filterGroup).toBeVisible();
      await expect(page.getByText('すべて').first()).toBeVisible();
      await expect(page.getByText('トップ10')).toBeVisible();
      await expect(page.getByText('最も活発')).toBeVisible();
      await expect(page.getByText('セキュリティ委員会')).toBeVisible();
    });

    test('should have "All" filter active by default', async ({ page }) => {
      const allButton = page.getByRole('button', { name: 'すべて' });
      await expect(allButton).toHaveAttribute('aria-pressed', 'true');
    });
  });

  test.describe('Delegate Cards', () => {
    test('should display delegate list', async ({ page }) => {
      const list = page.locator('[role="list"][aria-label="デリゲート一覧"]');
      await expect(list).toBeVisible();
    });

    test('should display delegate cards', async ({ page }) => {
      const listItems = page.locator('[role="listitem"]');
      const count = await listItems.count();
      expect(count).toBeGreaterThanOrEqual(1);
    });

    test('should display delegate tags', async ({ page }) => {
      await expect(page.getByText('セキュリティ委員会').first()).toBeVisible();
    });

    test('should display view profile action', async ({ page }) => {
      await expect(page.getByText('プロフィールを見る').first()).toBeVisible();
    });
  });

  test.describe('Footer', () => {
    test('should display footer navigation', async ({ page }) => {
      const footerNav = page.getByRole('navigation', { name: 'フッターナビゲーション' });
      await expect(footerNav).toBeVisible();
    });

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
      await expect(page.getByRole('navigation', { name: 'Token Hub ナビゲーション' })).toBeVisible();
    });

    test('should have filter group with aria-label', async ({ page }) => {
      const filterGroup = page.locator('[role="group"][aria-label="デリゲートフィルター"]');
      await expect(filterGroup).toBeVisible();
    });

    test('should have delegate list with aria-label', async ({ page }) => {
      const list = page.locator('[role="list"][aria-label="デリゲート一覧"]');
      await expect(list).toBeVisible();
    });

    test('should have screen reader announcement', async ({ page }) => {
      const announcement = page.locator('[role="status"][aria-live="polite"]');
      await expect(announcement).toBeAttached();
    });
  });
});
