/**
 * QS Admin Users E2E Tests (Phase 8-E)
 *
 * ## Coverage
 * - Screen 12-15: Users Dashboard, List, Wallets, Detail
 *
 * ## BE Rules Compliance
 * - BE-001: Real API endpoints (no stubs)
 * - BE-002: No test-specific modifications
 * - BE-003: All API calls logged
 */

import { test, expect } from '../fixtures/admin-auth';

test.describe('QS Admin Users', () => {
  test.describe('Users Dashboard', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/ja/qs-admin/users');
    });

    test('should display users dashboard', async ({ page, apiLogs }) => {
      await expect(page.getByRole('heading', { name: /Users|ユーザー/i, level: 1 })).toBeVisible();

      console.log(`[TEST LOG] Users dashboard loaded, API calls: ${apiLogs.length}`);
    });

    test('should display user stats', async ({ page }) => {
      await expect(page.getByText(/Total Users|総ユーザー/i)).toBeVisible();
      await expect(page.getByText(/Active Users|アクティブ/i)).toBeVisible();
    });

    test('should navigate to users list', async ({ page }) => {
      const viewAllLink = page.getByRole('link', { name: /View All|すべて表示/i });
      await viewAllLink.click();
      await expect(page).toHaveURL(/\/qs-admin\/users\/list/);
    });
  });

  test.describe('Users List', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/ja/qs-admin/users/list');
    });

    test('should display users list', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /Users List|ユーザー一覧/i, level: 1 })).toBeVisible();

      const userRows = page.locator('tbody tr');
      if (await userRows.count() > 0) {
        await expect(userRows.first()).toBeVisible();
      }
    });

    test('should display user table columns', async ({ page }) => {
      await expect(page.getByText(/Wallet Address|ウォレットアドレス/i)).toBeVisible();
      await expect(page.getByText(/Status|ステータス/i)).toBeVisible();
      await expect(page.getByText(/Total Locked|総ロック額/i)).toBeVisible();
    });

    test('should search users', async ({ page }) => {
      const searchInput = page.getByPlaceholder(/Search|検索/i);
      if (await searchInput.isVisible()) {
        await searchInput.fill('0x1234');
        await page.keyboard.press('Enter');
      }
    });

    test('should filter by status', async ({ page }) => {
      const statusFilter = page.getByRole('combobox', { name: /Status|ステータス/i });
      if (await statusFilter.isVisible()) {
        await statusFilter.selectOption('active');
      }
    });

    test('should navigate to user detail', async ({ page }) => {
      const userRow = page.locator('tbody tr').first();
      if (await userRow.isVisible()) {
        await userRow.click();
        await expect(page).toHaveURL(/\/qs-admin\/users\/[\w-]+/);
      }
    });
  });

  test.describe('User Detail', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/ja/qs-admin/users/0x1234567890abcdef');
    });

    test('should display user detail page', async ({ page }) => {
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await expect(page.getByText(/Wallet Address|ウォレットアドレス/i)).toBeVisible();
    });

    test('should display user balances', async ({ page }) => {
      await expect(page.getByText(/Locked Balance|ロック残高/i)).toBeVisible();
      await expect(page.getByText(/Available Balance|利用可能残高/i)).toBeVisible();
    });

    test('should display transaction history', async ({ page }) => {
      await expect(page.getByText(/Transaction History|取引履歴/i)).toBeVisible();
    });

    test('should display action buttons', async ({ page }) => {
      await expect(page.getByRole('button', { name: /Suspend|停止/i })).toBeVisible();
    });

    test('should suspend user', async ({ page }) => {
      const suspendButton = page.getByRole('button', { name: /Suspend|停止/i });
      await suspendButton.click();

      await expect(page.getByRole('dialog')).toBeVisible();
      await expect(page.getByLabel(/Reason|理由/i)).toBeVisible();
    });
  });

  test.describe('Users Wallets', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/ja/qs-admin/users/wallets');
    });

    test('should display wallets overview', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /Wallets|ウォレット/i, level: 1 })).toBeVisible();
    });

    test('should display wallet stats', async ({ page }) => {
      await expect(page.getByText(/Total Wallets|総ウォレット/i)).toBeVisible();
      await expect(page.getByText(/Active Wallets|アクティブ/i)).toBeVisible();
    });

    test('should display wallet list', async ({ page }) => {
      const walletRows = page.locator('tbody tr');
      if (await walletRows.count() > 0) {
        await expect(walletRows.first()).toBeVisible();
      }
    });
  });

  test.describe('English Locale', () => {
    test('should display English content', async ({ page }) => {
      await page.goto('/en/qs-admin/users');
      await expect(page.getByRole('heading', { name: /Users/i, level: 1 })).toBeVisible();
    });
  });
});
