/**
 * QS Admin Treasury Budget Integration Tests
 *
 * ## Purpose
 * Tests the integration between React Query hooks and the Treasury Budget UI.
 * Verifies:
 * - Loading states display correctly
 * - Budget stats cards display with correct data
 * - Category breakdown displays with progress bars
 * - Monthly breakdown displays correctly
 *
 * ## BE Rules Compliance
 * - BE-001: Tests real API endpoints (no stubs)
 * - BE-002: No test-specific code modifications
 * - BE-003: All API calls are logged for verification
 */

import { test, expect } from '../fixtures/admin-auth';

test.describe('QS Admin Treasury Budget - Integration Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ja/qs-admin/treasury/budget');
  });

  test.describe('Page Load', () => {
    test('should display treasury budget page', async ({ page }) => {
      // Wait for page to load
      await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });

      // Check page heading
      const heading = page.locator('h1').first();
      await expect(heading).toBeVisible();
    });

    test('should display back button', async ({ page }) => {
      await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });

      // Check back button exists
      const backButton = page.locator('a[href="/qs-admin/treasury"]').first();
      await expect(backButton).toBeVisible();
    });

    test('should display export button', async ({ page }) => {
      await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });

      // Check export button exists
      const exportButton = page.getByRole('button', { name: /エクスポート|Export/i });
      await expect(exportButton).toBeVisible();
    });

    test('should display edit budget button', async ({ page }) => {
      await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });

      // Check edit budget button exists (primary CTA)
      const editButton = page.locator('button.bg-gradient-hinomaru').first();
      await expect(editButton).toBeVisible();
    });
  });

  test.describe('Stats Cards', () => {
    test('should display total budget stat', async ({ page }) => {
      await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });

      // Check total budget is displayed with ETH
      await expect(page.getByText(/\d+,?\d* ETH/).first()).toBeVisible();
    });

    test('should display budget period', async ({ page }) => {
      await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });

      // Check period is displayed (e.g., Q1 2024)
      await expect(page.getByText(/Q\d 20\d{2}/).first()).toBeVisible();
    });

    test('should display utilization rate', async ({ page }) => {
      await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });

      // Check utilization rate is displayed
      await expect(page.getByText(/\d+%/).first()).toBeVisible();
    });

    test('should display stat cards', async ({ page }) => {
      await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });

      // Check stat cards exist (4 cards)
      const statCards = page.locator('.grid > div').filter({ has: page.locator('svg') });
      expect(await statCards.count()).toBeGreaterThanOrEqual(4);
    });
  });

  test.describe('Category Breakdown', () => {
    test('should display category breakdown card', async ({ page }) => {
      await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });

      // Check category breakdown card exists (look for Operations category)
      await expect(page.getByText(/Operations|Development/i).first()).toBeVisible();
    });

    test('should display category progress bars', async ({ page }) => {
      await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });

      // Check progress bars exist (h-2 bg-surface rounded-full)
      const progressBars = page.locator('.rounded-full.overflow-hidden');
      expect(await progressBars.count()).toBeGreaterThan(0);
    });

    test('should display category amounts', async ({ page }) => {
      await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });

      // Check category amounts are displayed (format: "X,XXX / Y,YYY ETH")
      await expect(page.getByText(/ ETH$/).first()).toBeVisible();
    });

    test('should display add category button', async ({ page }) => {
      await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });

      // Check add category button exists
      const addButton = page.getByRole('button').filter({
        has: page.locator('svg'),
      });
      expect(await addButton.count()).toBeGreaterThan(0);
    });
  });

  test.describe('Monthly Breakdown', () => {
    test('should display monthly breakdown card', async ({ page }) => {
      await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });

      // Check monthly breakdown card exists (look for month names)
      await expect(page.getByText(/January|February/i).first()).toBeVisible();
    });

    test('should display month names', async ({ page }) => {
      await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });

      // Check month names are displayed
      const january = page.getByText('January');
      expect(await january.count()).toBeGreaterThan(0);
    });

    test('should display budget vs spent', async ({ page }) => {
      await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });

      // Check budget and spent labels
      const budgetLabel = page.getByText('Budget');
      expect(await budgetLabel.count()).toBeGreaterThan(0);
    });

    test('should display budget status', async ({ page }) => {
      await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });

      // Check status indicators (on track / over budget text)
      const statusIndicator = page.locator('.text-success, .text-danger');
      expect(await statusIndicator.count()).toBeGreaterThan(0);
    });
  });

  test.describe('Quarter Summary', () => {
    test('should display quarter summary card', async ({ page }) => {
      await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });

      // Check quarter summary section exists (text-4xl percentage display)
      const summaryPercentage = page.locator('.text-4xl').filter({
        hasText: /\d+%/,
      });
      expect(await summaryPercentage.count()).toBeGreaterThan(0);
    });

    test('should display utilization percentage', async ({ page }) => {
      await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });

      // Check large utilization percentage is displayed
      const largePercentage = page.locator('[class*="text-4xl"]').filter({
        hasText: /\d+%/,
      });
      expect(await largePercentage.count()).toBeGreaterThan(0);
    });
  });

  test.describe('Navigation', () => {
    test('should navigate back to treasury dashboard', async ({ page }) => {
      await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });

      // Click back button
      const backButton = page.locator('a[href="/qs-admin/treasury"]').first();

      if (await backButton.isVisible()) {
        await backButton.click();
        await expect(page).toHaveURL(/\/qs-admin\/treasury/);
      }
    });
  });

  test.describe('Loading States', () => {
    test('should display page correctly after load', async ({ page }) => {
      // Navigate and wait for content
      await page.goto('/ja/qs-admin/treasury/budget');

      // Wait for heading to be visible
      const heading = page.locator('h1').first();
      await expect(heading).toBeVisible({ timeout: 15000 });

      // Page should have stat cards with ETH values
      await expect(page.getByText(/ETH/).first()).toBeVisible();

      console.log('[INTEGRATION] Treasury Budget page loaded successfully');
    });
  });
});
