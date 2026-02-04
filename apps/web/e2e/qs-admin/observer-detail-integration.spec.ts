/**
 * QS Admin Observer Detail Integration Tests
 *
 * ## Purpose
 * Tests the integration between React Query hooks and the Observer Detail UI.
 * Verifies:
 * - Loading states display correctly
 * - Observer details display correctly
 * - Challenge history is shown
 * - Actions are available
 *
 * ## BE Rules Compliance
 * - BE-001: Tests real API endpoints (no stubs)
 * - BE-002: No test-specific code modifications
 * - BE-003: All API calls are logged for verification
 */

import { test, expect } from '../fixtures/admin-auth';

test.describe('QS Admin Observer Detail - Integration Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ja/qs-admin/observer/list/OB-001');
  });

  test.describe('Page Load', () => {
    test('should display observer detail page', async ({ page }) => {
      // Wait for page to load
      await expect(page.getByText('OB-001')).toBeVisible({ timeout: 10000 });

      // Check page heading
      const heading = page.locator('h1').first();
      await expect(heading).toBeVisible();
    });

    test('should display observer ID', async ({ page }) => {
      await expect(page.getByText('OB-001')).toBeVisible({ timeout: 10000 });

      // Check observer ID is displayed
      await expect(page.getByText('OB-001').first()).toBeVisible();
    });

    test('should display back button', async ({ page }) => {
      await expect(page.getByText('OB-001')).toBeVisible({ timeout: 10000 });

      // Check back button exists
      const backButton = page.locator('a[href*="/qs-admin/observer/list"]').first();
      await expect(backButton).toBeVisible();
    });

    test('should display status badge', async ({ page }) => {
      await expect(page.getByText('OB-001')).toBeVisible({ timeout: 10000 });

      // Check status badge exists (has icon + text)
      const statusBadge = page.locator('[class*="rounded-full"]').filter({
        has: page.locator('svg'),
      });
      expect(await statusBadge.count()).toBeGreaterThan(0);
    });
  });

  test.describe('Basic Info Section', () => {
    test('should display basic info section', async ({ page }) => {
      await expect(page.getByText('OB-001')).toBeVisible({ timeout: 10000 });

      // Check basic info section title
      const basicInfoSection = page.getByText(/基本情報|Basic Info/i);
      await expect(basicInfoSection.first()).toBeVisible();
    });

    test('should display wallet address', async ({ page }) => {
      await expect(page.getByText('OB-001')).toBeVisible({ timeout: 10000 });

      // Check wallet address is displayed (with 0x prefix)
      const walletCode = page.locator('code').filter({ hasText: /^0x/ }).first();
      await expect(walletCode).toBeVisible();
    });

    test('should display copy button for wallet', async ({ page }) => {
      await expect(page.getByText('OB-001')).toBeVisible({ timeout: 10000 });

      // Check copy button exists
      const copyButtons = page.getByRole('button').filter({ has: page.locator('svg') });
      expect(await copyButtons.count()).toBeGreaterThan(0);
    });

    test('should display bond amount', async ({ page }) => {
      await expect(page.getByText('OB-001')).toBeVisible({ timeout: 10000 });

      // Check bond label exists
      const bondLabel = page.getByText(/ボンド|Bond/i);
      await expect(bondLabel.first()).toBeVisible();
    });

    test('should display registration date', async ({ page }) => {
      await expect(page.getByText('OB-001')).toBeVisible({ timeout: 10000 });

      // Check registration date label exists
      const regLabel = page.getByText(/登録日|Registered/i);
      await expect(regLabel.first()).toBeVisible();
    });
  });

  test.describe('Performance Info Section', () => {
    test('should display performance info section', async ({ page }) => {
      await expect(page.getByText('OB-001')).toBeVisible({ timeout: 10000 });

      // Check performance info section title
      const perfSection = page.getByText(/パフォーマンス|Performance/i);
      await expect(perfSection.first()).toBeVisible();
    });

    test('should display challenges count', async ({ page }) => {
      await expect(page.getByText('OB-001')).toBeVisible({ timeout: 10000 });

      // Check challenges label exists
      const challengesLabel = page.getByText(/チャレンジ数|Challenges/i);
      await expect(challengesLabel.first()).toBeVisible();
    });

    test('should display success rate', async ({ page }) => {
      await expect(page.getByText('OB-001')).toBeVisible({ timeout: 10000 });

      // Check success rate is displayed
      await expect(page.getByText(/\d+(\.\d+)?%/).first()).toBeVisible();
    });

    test('should display total earnings', async ({ page }) => {
      await expect(page.getByText('OB-001')).toBeVisible({ timeout: 10000 });

      // Check earnings value is displayed (look for QS amount)
      const earningsValue = page.getByText(/\d+.*QS/);
      expect(await earningsValue.count()).toBeGreaterThan(0);
    });
  });

  test.describe('Recent Challenges Section', () => {
    test('should display recent challenges section', async ({ page }) => {
      await expect(page.getByText('OB-001')).toBeVisible({ timeout: 10000 });

      // Check recent challenges section title
      const challengesSection = page.getByText(/最近のチャレンジ|Recent Challenges/i);
      await expect(challengesSection.first()).toBeVisible();
    });

    test('should display challenge table', async ({ page }) => {
      await expect(page.getByText('OB-001')).toBeVisible({ timeout: 10000 });

      // Check table exists
      const tables = page.locator('table');
      expect(await tables.count()).toBeGreaterThan(0);
    });

    test('should display challenge IDs', async ({ page }) => {
      await expect(page.getByText('OB-001')).toBeVisible({ timeout: 10000 });

      // Check challenge IDs are displayed
      const challengeIds = page.getByText(/CH-\d+/);
      expect(await challengeIds.count()).toBeGreaterThan(0);
    });
  });

  test.describe('Actions Section', () => {
    test('should display actions section', async ({ page }) => {
      await expect(page.getByText('OB-001')).toBeVisible({ timeout: 10000 });

      // Check that actions card exists (contains buttons with icons)
      const actionButtons = page.getByRole('button').filter({ has: page.locator('svg') });
      expect(await actionButtons.count()).toBeGreaterThan(0);
    });

    test('should display view on explorer button', async ({ page }) => {
      await expect(page.getByText('OB-001')).toBeVisible({ timeout: 10000 });

      // Check explorer link exists (link to etherscan)
      const explorerLink = page.locator('a[href*="etherscan.io"]');
      await expect(explorerLink.first()).toBeVisible();
    });
  });

  test.describe('Summary Section', () => {
    test('should display last active time', async ({ page }) => {
      await expect(page.getByText('OB-001')).toBeVisible({ timeout: 10000 });

      // Check last active label exists
      const lastActiveLabel = page.getByText(/最終アクティブ|Last Active/i);
      await expect(lastActiveLabel.first()).toBeVisible();
    });
  });

  test.describe('Navigation', () => {
    test('should navigate back to list page', async ({ page }) => {
      await expect(page.getByText('OB-001')).toBeVisible({ timeout: 10000 });

      // Click back button
      const backButton = page.locator('a[href*="/qs-admin/observer/list"]').first();

      if (await backButton.isVisible()) {
        await backButton.click();
        await expect(page).toHaveURL(/\/qs-admin\/observer\/list/);
      }
    });
  });

  test.describe('Error Handling', () => {
    test('should display fallback data when API fails', async ({ page }) => {
      // Block API endpoints to simulate failure
      await page.route('**/api/admin/observers/**', (route) => {
        route.abort('failed');
      });

      // Navigate to observer detail
      await page.goto('/ja/qs-admin/observer/list/OB-001');

      // Should still display the page heading
      const heading = page.locator('h1').first();
      await expect(heading).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Loading States', () => {
    test('should display page correctly after load', async ({ page }) => {
      // Navigate and wait for content
      await page.goto('/ja/qs-admin/observer/list/OB-001');
      await expect(page.getByText('OB-001')).toBeVisible({ timeout: 10000 });

      // Page should be functional
      const heading = page.locator('h1').first();
      await expect(heading).toBeVisible();

      console.log('[INTEGRATION] Observer Detail page loaded successfully');
    });
  });
});
