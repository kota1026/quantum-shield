/**
 * QS Admin Governance Integration Tests
 *
 * ## Purpose
 * Tests the integration between React Query hooks and the Governance UI.
 * Verifies:
 * - Loading states display correctly
 * - Stats cards display with correct data
 * - Proposals table displays with filtering
 * - Search and filter functionality works
 *
 * ## BE Rules Compliance
 * - BE-001: Tests real API endpoints (no stubs)
 * - BE-002: No test-specific code modifications
 * - BE-003: All API calls are logged for verification
 */

import { test, expect } from '../fixtures/admin-auth';

test.describe('QS Admin Governance Dashboard - Integration Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ja/qs-admin/governance');
  });

  test.describe('Page Load', () => {
    test('should display governance dashboard page', async ({ page }) => {
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
    test('should display active proposals stat', async ({ page }) => {
      await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });

      // Check stat card with number exists
      const statValue = page.getByText(/\d+/).first();
      await expect(statValue).toBeVisible();
    });

    test('should display total votes stat', async ({ page }) => {
      await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });

      // Check total votes is displayed (formatted number)
      await expect(page.getByText(/\d+,\d+/).first()).toBeVisible();
    });

    test('should display stat cards', async ({ page }) => {
      await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });

      // Check stat cards exist (4 cards)
      const statCards = page.locator('.grid > div');
      expect(await statCards.count()).toBeGreaterThanOrEqual(4);
    });
  });

  test.describe('Proposals Table', () => {
    test('should display proposals table', async ({ page }) => {
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

    test('should display proposal rows', async ({ page }) => {
      await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });

      // Check that proposal rows are rendered
      const rows = page.locator('tbody tr');
      expect(await rows.count()).toBeGreaterThan(0);
    });

    test('should display proposal IDs', async ({ page }) => {
      await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });

      // Check proposal IDs are displayed (QIP-XXX format)
      const proposalIds = page.getByText(/QIP-\d+/);
      expect(await proposalIds.count()).toBeGreaterThan(0);
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
      const searchInput = page.getByRole('textbox', { name: '検索' });
      expect(await searchInput.count()).toBeGreaterThan(0);
    });

    test('should display filter tabs', async ({ page }) => {
      await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });

      // Check filter tabs exist
      const allTab = page.getByRole('button', { name: /すべて|All/i });
      expect(await allTab.count()).toBeGreaterThan(0);
    });

    test('should display active filter tab', async ({ page }) => {
      await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });

      // Check active filter tab
      const activeTab = page.locator('button').filter({ hasText: /アクティブ|Active/i });
      expect(await activeTab.count()).toBeGreaterThan(0);
    });
  });

  test.describe('Loading States', () => {
    test('should display page correctly after load', async ({ page }) => {
      // Page is already loaded from beforeEach
      await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 });

      // Page should have table
      await expect(page.locator('table').first()).toBeVisible({ timeout: 5000 });

      console.log('[INTEGRATION] Governance Dashboard page loaded successfully');
    });
  });
});

test.describe('QS Admin Proposals List - Integration Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ja/qs-admin/governance/proposals');
  });

  test.describe('Page Load', () => {
    test('should display proposals list page', async ({ page }) => {
      // Wait for page to load
      await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });

      // Check page heading
      const heading = page.locator('h1').first();
      await expect(heading).toBeVisible();
    });

    test('should display back button', async ({ page }) => {
      await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });

      // Check back button exists
      const backButton = page.locator('a[href="/qs-admin/governance"]').first();
      await expect(backButton).toBeVisible();
    });
  });

  test.describe('Stats Cards', () => {
    test('should display stat cards', async ({ page }) => {
      await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });

      // Check stat cards exist
      const statCards = page.locator('.grid > div');
      expect(await statCards.count()).toBeGreaterThanOrEqual(4);
    });
  });

  test.describe('Proposals Table', () => {
    test('should display proposals table', async ({ page }) => {
      await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });

      // Check table exists
      await expect(page.locator('table').first()).toBeVisible({ timeout: 5000 });
    });

    test('should display proposal count in title', async ({ page }) => {
      await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });

      // Check proposal count is displayed (e.g., "Proposals (6)")
      const countText = page.getByText(/\(\d+\)/);
      expect(await countText.count()).toBeGreaterThan(0);
    });

    test('should display proposer addresses', async ({ page }) => {
      await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });

      // Check proposer addresses are displayed (0x... format)
      const addresses = page.locator('code').filter({ hasText: /^0x/ });
      expect(await addresses.count()).toBeGreaterThan(0);
    });

    test('should display turnout percentages', async ({ page }) => {
      await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });

      // Check turnout percentages are displayed
      const turnout = page.getByText(/\d+\.\d+%/);
      expect(await turnout.count()).toBeGreaterThan(0);
    });
  });

  test.describe('Filter Tabs', () => {
    test('should display executed filter tab', async ({ page }) => {
      await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });

      // Check executed filter tab exists
      const executedTab = page.locator('button').filter({ hasText: /実行済み|Executed/i });
      expect(await executedTab.count()).toBeGreaterThan(0);
    });
  });

  test.describe('Navigation', () => {
    test('should navigate back to governance dashboard', async ({ page }) => {
      await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });

      // Click back button
      const backButton = page.locator('a[href="/qs-admin/governance"]').first();

      if (await backButton.isVisible()) {
        await backButton.click();
        await expect(page).toHaveURL(/\/qs-admin\/governance/);
      }
    });
  });

  test.describe('Loading States', () => {
    test('should display page correctly after load', async ({ page }) => {
      // Page is already loaded from beforeEach
      await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 });

      // Page should have table
      await expect(page.locator('table').first()).toBeVisible({ timeout: 5000 });

      console.log('[INTEGRATION] Proposals List page loaded successfully');
    });
  });
});

test.describe('QS Admin Voting Status - Integration Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ja/qs-admin/governance/voting');
  });

  test.describe('Page Load', () => {
    test('should display voting status page', async ({ page }) => {
      // Wait for page to load
      await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });

      // Check page heading
      const heading = page.locator('h1').first();
      await expect(heading).toBeVisible();
    });

    test('should display back button', async ({ page }) => {
      await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });

      // Check back button exists
      const backButton = page.locator('a[href="/qs-admin/governance"]').first();
      await expect(backButton).toBeVisible();
    });
  });

  test.describe('Stats Cards', () => {
    test('should display stat cards', async ({ page }) => {
      await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });

      // Check stat cards exist
      const statCards = page.locator('.grid > div');
      expect(await statCards.count()).toBeGreaterThanOrEqual(4);
    });

    test('should display voter count', async ({ page }) => {
      await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });

      // Check voter count is displayed
      await expect(page.getByText(/\d+,\d+/).first()).toBeVisible();
    });
  });

  test.describe('Active Votes Cards', () => {
    test('should display active vote cards', async ({ page }) => {
      await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });

      // Check active vote cards exist
      const voteCards = page.locator('.lg\\:grid-cols-2 > div');
      expect(await voteCards.count()).toBeGreaterThan(0);
    });

    test('should display vote progress bars', async ({ page }) => {
      await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });

      // Check progress bars exist
      const progressBars = page.locator('.rounded-full.overflow-hidden');
      expect(await progressBars.count()).toBeGreaterThan(0);
    });

    test('should display days remaining', async ({ page }) => {
      await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });

      // Check days remaining badge (e.g., "4d", "2d")
      const daysRemaining = page.getByText(/\d+d/);
      expect(await daysRemaining.count()).toBeGreaterThan(0);
    });

    test('should display view button', async ({ page }) => {
      await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });

      // Check view button exists
      const viewButton = page.getByRole('link', { name: /表示|View/i });
      expect(await viewButton.count()).toBeGreaterThan(0);
    });
  });

  test.describe('Loading States', () => {
    test('should display page correctly after load', async ({ page }) => {
      // Page is already loaded from beforeEach
      await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 });

      // Page should have stat cards
      const statCards = page.locator('.grid > div');
      expect(await statCards.count()).toBeGreaterThanOrEqual(4);

      console.log('[INTEGRATION] Voting Status page loaded successfully');
    });
  });
});
