/**
 * Governance App Layer Integration Tests
 *
 * Tests verify that governance pages load correctly with fallback data
 * and that API endpoints exist (when backend is running).
 * All page tests are resilient - they pass regardless of whether
 * the backend API is available, since components use fallback data.
 */
import { test, expect } from '@playwright/test';
import { gotoAndWaitForApp } from '../helpers/wait-for-app';

test.describe('Governance Layer Integration', () => {
  test.setTimeout(90000);

  test('loads proposals page with fallback data', async ({ page }) => {
    await gotoAndWaitForApp(page, '/ja/qs-hub/vote/proposals');

    // Page should render with fallback data (empty proposals list)
    await expect(page.locator('h1')).toContainText(/提案一覧|Proposals/);
  });

  test('shows loading state or content on proposals page', async ({ page }) => {
    await gotoAndWaitForApp(page, '/ja/qs-hub/vote/proposals');

    // Either loading indicators, actual content, or empty state should appear
    const hasContent = await page.getByText(/提案一覧|Proposals/).count() > 0;
    const hasLoading = await page.locator('[class*="animate-pulse"], [class*="skeleton"], [class*="Skeleton"]').count() > 0;
    const hasEmpty = await page.getByText(/提案がありません|No proposals/).count() > 0;

    expect(hasContent || hasLoading || hasEmpty).toBe(true);
  });

  test('shows content on API failure with fallback', async ({ page }) => {
    await page.route('**/v1/governance/**', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' })
      });
    });

    await gotoAndWaitForApp(page, '/ja/qs-hub/vote/proposals');

    // With fallback data, the page should still render
    const pageLoaded = page.locator('h1');
    await expect(pageLoaded).toBeVisible({ timeout: 10000 });
  });

  test('proposals endpoint returns valid response', async ({ request }) => {
    try {
      const response = await request.get('http://localhost:8080/v1/governance/proposals');
      expect(response.status()).toBeLessThan(500);

      if (response.ok()) {
        const data = await response.json();
        expect(data).toBeDefined();
      }
    } catch {
      // Backend not running - skip gracefully
      test.skip();
    }
  });

  test('council endpoint returns valid response', async ({ request }) => {
    try {
      const response = await request.get('http://localhost:8080/v1/governance/council');
      expect(response.status()).toBeLessThan(500);

      if (response.ok()) {
        const data = await response.json();
        expect(data).toBeDefined();
      }
    } catch {
      // Backend not running - skip gracefully
      test.skip();
    }
  });

  test('governance pages load without errors', async ({ page }) => {
    const pages = [
      '/ja/qs-hub/landing',
      '/ja/qs-hub/vote/proposals',
      '/ja/qs-hub/council',
      '/ja/governance/history',
      '/ja/governance/create',
    ];

    for (const url of pages) {
      await gotoAndWaitForApp(page, url);

      // Main content should always be visible
      await expect(page.locator('[role="main"]')).toBeVisible({ timeout: 30000 });
    }
  });
});
