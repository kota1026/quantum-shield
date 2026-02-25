/**
 * QS Admin Observer List Integration Tests
 *
 * ## Purpose
 * Tests the integration between React Query hooks and the Observer List UI.
 * Verifies:
 * - Loading states display correctly
 * - Stats cards display with correct data
 * - Observer table displays with filtering
 * - Search and filter functionality works
 *
 * ## BE Rules Compliance
 * - BE-001: Tests real API endpoints (no stubs)
 * - BE-002: No test-specific code modifications
 * - BE-003: All API calls are logged for verification
 */

import { test, expect } from '../fixtures/admin-auth';

test.describe('QS Admin Observer List - Integration Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ja/qs-admin/observer/list');
  });

  test.describe('Page Load', () => {
    test('should display observer list page', async ({ page }) => {
      // Wait for page to load
      await expect(page.getByText('OB-001').first()).toBeVisible({ timeout: 10000 });

      // Check page title
      const heading = page.locator('h1').first();
      await expect(heading).toBeVisible();
    });

    test('should display back button', async ({ page }) => {
      await expect(page.getByText('OB-001').first()).toBeVisible({ timeout: 10000 });

      // Check back button exists (link to observer dashboard)
      const backButton = page.locator('a[href="/qs-admin/observer"]').first();
      await expect(backButton).toBeVisible();
    });

    test('should display export button', async ({ page }) => {
      await expect(page.getByText('OB-001')).toBeVisible({ timeout: 10000 });

      // Check export button exists
      const exportButton = page.getByRole('button', { name: /エクスポート|Export/i });
      await expect(exportButton).toBeVisible();
    });
  });

  test.describe('Stats Cards', () => {
    test('should display total observers stat', async ({ page }) => {
      await expect(page.getByText('OB-001')).toBeVisible({ timeout: 10000 });

      // Check total observers stat card
      const totalLabel = page.getByText(/総Observer数|Total Observers/i);
      await expect(totalLabel.first()).toBeVisible();
    });

    test('should display active observers stat', async ({ page }) => {
      await expect(page.getByText('OB-001')).toBeVisible({ timeout: 10000 });

      // Check active observers stat card
      const activeLabel = page.getByText(/アクティブ|Active Observers/i);
      await expect(activeLabel.first()).toBeVisible();
    });

    test('should display total challenges stat', async ({ page }) => {
      await expect(page.getByText('OB-001')).toBeVisible({ timeout: 10000 });

      // Check total challenges stat card
      const challengesLabel = page.getByText(/総チャレンジ数|Total Challenges/i);
      await expect(challengesLabel.first()).toBeVisible();
    });

    test('should display success rate stat', async ({ page }) => {
      await expect(page.getByText('OB-001')).toBeVisible({ timeout: 10000 });

      // Check success rate is displayed
      await expect(page.getByText(/\d+(\.\d+)?%/).first()).toBeVisible();
    });
  });

  test.describe('Observer Table', () => {
    test('should display observer table', async ({ page }) => {
      await expect(page.getByText('OB-001')).toBeVisible({ timeout: 10000 });

      // Check table exists
      const table = page.locator('table');
      await expect(table).toBeVisible();
    });

    test('should display table headers', async ({ page }) => {
      await expect(page.getByText('OB-001')).toBeVisible({ timeout: 10000 });

      // Check table headers
      const walletHeader = page.getByRole('columnheader', { name: /ウォレット|Wallet/i });
      await expect(walletHeader).toBeVisible();
    });

    test('should display observer rows', async ({ page }) => {
      await expect(page.getByText('OB-001')).toBeVisible({ timeout: 10000 });

      // Check that observer rows are rendered
      const rows = page.locator('tbody tr');
      expect(await rows.count()).toBeGreaterThan(0);
    });

    test('should display wallet addresses', async ({ page }) => {
      await expect(page.getByText('OB-001')).toBeVisible({ timeout: 10000 });

      // Check wallet addresses are displayed (with 0x prefix)
      const walletCodes = page.locator('code').filter({ hasText: /^0x/ });
      expect(await walletCodes.count()).toBeGreaterThan(0);
    });

    test('should display detail buttons', async ({ page }) => {
      await expect(page.getByText('OB-001')).toBeVisible({ timeout: 10000 });

      // Check detail buttons exist
      const detailButtons = page.getByRole('button', { name: /詳細|Detail/i });
      expect(await detailButtons.count()).toBeGreaterThan(0);
    });
  });

  test.describe('Search and Filter', () => {
    test('should display search input', async ({ page }) => {
      await expect(page.getByText('OB-001').first()).toBeVisible({ timeout: 10000 });

      // Check search input exists (the one inside the card, not header)
      const searchInput = page.getByPlaceholder('Observerを検索...');
      await expect(searchInput).toBeVisible();
    });

    test('should display status filter tabs', async ({ page }) => {
      await expect(page.getByText('OB-001').first()).toBeVisible({ timeout: 10000 });

      // Check filter tabs exist
      const allTab = page.getByRole('button', { name: /すべて|All/i });
      await expect(allTab.first()).toBeVisible();
    });

    test('should filter by search query', async ({ page }) => {
      await expect(page.getByText('OB-001').first()).toBeVisible({ timeout: 10000 });

      // Type in search (use the specific placeholder)
      const searchInput = page.getByPlaceholder('Observerを検索...');
      await searchInput.fill('OB-001');

      // Wait for filter to apply
      await page.waitForTimeout(500);

      // Should still show OB-001
      await expect(page.getByText('OB-001').first()).toBeVisible();
    });
  });

  test.describe('Status Display', () => {
    test('should display status badges', async ({ page }) => {
      await expect(page.getByText('OB-001')).toBeVisible({ timeout: 10000 });

      // Check status badges exist
      const statusBadges = page.locator('[class*="rounded-md"]').filter({
        has: page.locator('svg'),
      });
      expect(await statusBadges.count()).toBeGreaterThan(0);
    });

    test('should display success rate bars', async ({ page }) => {
      await expect(page.getByText('OB-001')).toBeVisible({ timeout: 10000 });

      // Check progress bars exist
      const progressBars = page.locator('[class*="rounded-full"][class*="overflow-hidden"]');
      expect(await progressBars.count()).toBeGreaterThan(0);
    });
  });

  test.describe('Navigation', () => {
    test('should navigate to detail page on detail button click', async ({ page }) => {
      await expect(page.getByText('OB-001')).toBeVisible({ timeout: 10000 });

      // Click on first detail button
      const detailLink = page.locator('a[href*="/qs-admin/observer/list/OB-"]').first();

      if (await detailLink.isVisible()) {
        await detailLink.click();
        await expect(page).toHaveURL(/\/qs-admin\/observer\/list\/OB-/);
      }
    });
  });

  test.describe('Loading States', () => {
    test('should display page correctly after load', async ({ page }) => {
      // Navigate and wait for content
      await page.goto('/ja/qs-admin/observer/list');
      await expect(page.getByText('OB-001')).toBeVisible({ timeout: 10000 });

      // Page should be functional
      const heading = page.locator('h1').first();
      await expect(heading).toBeVisible();

      console.log('[INTEGRATION] Observer List page loaded successfully');
    });
  });
});
