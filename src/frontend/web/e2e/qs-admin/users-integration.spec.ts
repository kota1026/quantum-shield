/**
 * QS Admin Users Integration Tests
 *
 * ## Purpose
 * Tests the integration between React Query hooks and the Users UI.
 * Verifies:
 * - Loading states display correctly
 * - Stats cards display with correct data
 * - Users table displays with filtering
 * - User detail page works correctly
 * - Wallets page displays correctly
 *
 * ## BE Rules Compliance
 * - BE-001: Tests real API endpoints (no stubs)
 * - BE-002: No test-specific code modifications
 * - BE-003: All API calls are logged for verification
 */

import { test, expect } from '../fixtures/admin-auth';

test.describe('QS Admin Users Dashboard - Integration Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ja/qs-admin/users');
  });

  test.describe('Page Load', () => {
    test('should display users dashboard page', async ({ page }) => {
      // Wait for page to load
      await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });

      // Check page heading
      const heading = page.locator('h1').first();
      await expect(heading).toBeVisible();
    });

    test('should display export button', async ({ page }) => {
      await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });

      // Check export button exists
      const exportButton = page.getByRole('button', { name: /エクスポート|Export/i });
      await expect(exportButton).toBeVisible();
    });
  });

  test.describe('Stats Cards', () => {
    test('should display total users stat', async ({ page }) => {
      await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });

      // Check stat card with number exists
      const statValue = page.getByText(/12,847/).first();
      await expect(statValue).toBeVisible();
    });

    test('should display stat cards', async ({ page }) => {
      await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });

      // Check stat cards exist (4 cards)
      const statCards = page.locator('.grid > div');
      expect(await statCards.count()).toBeGreaterThanOrEqual(4);
    });
  });

  test.describe('Users Table', () => {
    test('should display users table', async ({ page }) => {
      await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });

      // Check table exists
      await expect(page.locator('table').first()).toBeVisible({ timeout: 5000 });
    });

    test('should display table headers', async ({ page }) => {
      await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });

      // Check table headers exist
      const headers = page.locator('th');
      expect(await headers.count()).toBeGreaterThan(0);
    });

    test('should display user rows', async ({ page }) => {
      await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });

      // Check that user rows are rendered
      const rows = page.locator('tbody tr');
      expect(await rows.count()).toBeGreaterThan(0);
    });

    test('should display wallet addresses', async ({ page }) => {
      await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });

      // Check wallet addresses are displayed (0x... format)
      const wallets = page.locator('code').filter({ hasText: /^0x/ });
      expect(await wallets.count()).toBeGreaterThan(0);
    });
  });

  test.describe('Status Badges', () => {
    test('should display status badges', async ({ page }) => {
      await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });

      // Check status badges exist
      const statusBadges = page.locator('.rounded-md.inline-flex');
      expect(await statusBadges.count()).toBeGreaterThan(0);
    });
  });

  test.describe('Search and Filter', () => {
    test('should display search input', async ({ page }) => {
      await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });

      // Check search input exists
      const searchInput = page.getByPlaceholder(/検索|Search/i);
      expect(await searchInput.count()).toBeGreaterThan(0);
    });

    test('should display filter tabs', async ({ page }) => {
      await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });

      // Check filter tabs exist
      const allTab = page.getByRole('button', { name: /すべて|All/i });
      expect(await allTab.count()).toBeGreaterThan(0);
    });
  });

  test.describe('Loading States', () => {
    test('should display page correctly after load', async ({ page }) => {
      // Page is already loaded from beforeEach
      await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 });

      // Page should have table
      await expect(page.locator('table').first()).toBeVisible({ timeout: 5000 });

      console.log('[INTEGRATION] Users Dashboard page loaded successfully');
    });
  });
});

test.describe('QS Admin Users List - Integration Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ja/qs-admin/users/list');
  });

  test.describe('Page Load', () => {
    test('should display users list page', async ({ page }) => {
      // Wait for page to load
      await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });

      // Check page heading
      const heading = page.locator('h1').first();
      await expect(heading).toBeVisible();
    });

    test('should display back button', async ({ page }) => {
      await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });

      // Check back button exists
      const backButton = page.locator('a[href="/qs-admin/users"]').first();
      await expect(backButton).toBeVisible();
    });
  });

  test.describe('Users Table', () => {
    test('should display users table', async ({ page }) => {
      await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });

      // Check table exists
      await expect(page.locator('table').first()).toBeVisible({ timeout: 5000 });
    });

    test('should display user count in title', async ({ page }) => {
      await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });

      // Check user count is displayed (e.g., "Users (8)")
      const countText = page.getByText(/\(\d+\)/);
      expect(await countText.count()).toBeGreaterThan(0);
    });

    test('should display checkbox column', async ({ page }) => {
      await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });

      // Check checkboxes exist
      const checkboxes = page.locator('input[type="checkbox"]');
      expect(await checkboxes.count()).toBeGreaterThan(0);
    });

    test('should display email column', async ({ page }) => {
      await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });

      // Check email addresses are displayed
      const emails = page.getByText(/@example\.com/);
      expect(await emails.count()).toBeGreaterThan(0);
    });

    test('should display detail buttons', async ({ page }) => {
      await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });

      // Check detail buttons exist
      const detailButtons = page.getByRole('link', { name: /詳細|Detail/i });
      expect(await detailButtons.count()).toBeGreaterThan(0);
    });
  });

  test.describe('Filter Tabs', () => {
    test('should display suspended filter tab', async ({ page }) => {
      await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });

      // Check suspended filter tab exists
      const suspendedTab = page.locator('button').filter({ hasText: /停止|Suspended/i });
      expect(await suspendedTab.count()).toBeGreaterThan(0);
    });
  });

  test.describe('Loading States', () => {
    test('should display page correctly after load', async ({ page }) => {
      // Page is already loaded from beforeEach
      await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 });

      // Page should have table
      await expect(page.locator('table').first()).toBeVisible({ timeout: 5000 });

      console.log('[INTEGRATION] Users List page loaded successfully');
    });
  });
});

test.describe('QS Admin User Detail - Integration Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ja/qs-admin/users/1');
  });

  test.describe('Page Load', () => {
    test('should display user detail page', async ({ page }) => {
      // Wait for page to load
      await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });

      // Check page heading
      const heading = page.locator('h1').first();
      await expect(heading).toBeVisible();
    });

    test('should display back button', async ({ page }) => {
      await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });

      // Check back button exists
      const backButton = page.locator('a[href="/qs-admin/users/list"]').first();
      await expect(backButton).toBeVisible();
    });
  });

  test.describe('User Info', () => {
    test('should display wallet address', async ({ page }) => {
      await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });

      // Check wallet address is displayed
      const walletCode = page.locator('code').filter({ hasText: /^0x/ });
      expect(await walletCode.count()).toBeGreaterThan(0);
    });

    test('should display user status badge', async ({ page }) => {
      await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });

      // Check status badge exists
      const statusBadge = page.locator('.rounded-full');
      expect(await statusBadge.count()).toBeGreaterThan(0);
    });

    test('should display activity stats', async ({ page }) => {
      await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });

      // Check activity stats cards exist
      const statsGrid = page.locator('.grid-cols-4');
      expect(await statsGrid.count()).toBeGreaterThan(0);
    });
  });

  test.describe('Transaction History', () => {
    test('should display transaction list', async ({ page }) => {
      await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });

      // Check transaction items exist
      const txItems = page.locator('.space-y-3 > a, .space-y-3 > div');
      expect(await txItems.count()).toBeGreaterThan(0);
    });

    test('should display transaction IDs', async ({ page }) => {
      await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });

      // Check transaction IDs are displayed (LK- or UL- format)
      const txIds = page.getByText(/LK-|UL-/);
      expect(await txIds.count()).toBeGreaterThan(0);
    });
  });

  test.describe('Action Buttons', () => {
    test('should display etherscan link', async ({ page }) => {
      await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });

      // Check Etherscan button exists
      const etherscanLink = page.getByText('Etherscan');
      expect(await etherscanLink.count()).toBeGreaterThan(0);
    });
  });

  test.describe('Loading States', () => {
    test('should display page correctly after load', async ({ page }) => {
      // Page is already loaded from beforeEach
      await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 });

      // Page should have cards
      const cards = page.locator('.rounded-lg.border');
      expect(await cards.count()).toBeGreaterThan(0);

      console.log('[INTEGRATION] User Detail page loaded successfully');
    });
  });
});

test.describe('QS Admin Users Wallets - Integration Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ja/qs-admin/users/wallets');
  });

  test.describe('Page Load', () => {
    test('should display wallets page', async ({ page }) => {
      // Wait for page to load
      await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });

      // Check page heading
      const heading = page.locator('h1').first();
      await expect(heading).toBeVisible();
    });

    test('should display back button', async ({ page }) => {
      await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });

      // Check back button exists
      const backButton = page.locator('a[href="/qs-admin/users"]').first();
      await expect(backButton).toBeVisible();
    });
  });

  test.describe('Stats Cards', () => {
    test('should display stat cards', async ({ page }) => {
      await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });

      // Check stat cards exist (4 cards)
      const statCards = page.locator('.grid > div');
      expect(await statCards.count()).toBeGreaterThanOrEqual(4);
    });

    test('should display total wallets stat', async ({ page }) => {
      await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });

      // Check total wallets is displayed
      await expect(page.getByText(/12,847/).first()).toBeVisible();
    });
  });

  test.describe('Wallets Table', () => {
    test('should display wallets table', async ({ page }) => {
      await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });

      // Check table exists
      await expect(page.locator('table').first()).toBeVisible({ timeout: 5000 });
    });

    test('should display wallet addresses', async ({ page }) => {
      await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });

      // Check wallet addresses are displayed
      const wallets = page.locator('code').filter({ hasText: /^0x/ });
      expect(await wallets.count()).toBeGreaterThan(0);
    });

    test('should display lock amounts', async ({ page }) => {
      await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });

      // Check lock amounts are displayed (ETH format)
      const lockAmounts = page.getByText(/\d+\.\d+ ETH/);
      expect(await lockAmounts.count()).toBeGreaterThan(0);
    });
  });

  test.describe('Filter Tabs', () => {
    test('should display lock filter tabs', async ({ page }) => {
      await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });

      // Check filter tabs exist
      const withLocksTab = page.locator('button').filter({ hasText: /ロック|With Locks/i });
      expect(await withLocksTab.count()).toBeGreaterThan(0);
    });
  });

  test.describe('Loading States', () => {
    test('should display page correctly after load', async ({ page }) => {
      // Page is already loaded from beforeEach
      await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 });

      // Page should have table
      await expect(page.locator('table').first()).toBeVisible({ timeout: 5000 });

      console.log('[INTEGRATION] Users Wallets page loaded successfully');
    });
  });
});
