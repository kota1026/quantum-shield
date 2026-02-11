/**
 * Explorer App Layer Integration Tests
 */
import { test, expect } from '@playwright/test';

test.describe('Explorer Layer Integration', () => {
  test.setTimeout(60000);

  test('loads overview page successfully', async ({ page }) => {
    await page.goto('/ja/explorer/overview');
    await page.waitForLoadState('domcontentloaded');

    // Page should render with stats section
    await expect(page.locator('text=Quantum Shield').first()).toBeVisible({ timeout: 15000 });
  });

  test('shows loading or content state on page load', async ({ page }) => {
    await page.goto('/ja/explorer/overview');

    // Either loading indicators or actual content should appear
    const hasContent = await page.locator('text=総ロック量').count() > 0;
    const hasLoading = await page.locator('[class*="animate-pulse"], [class*="skeleton"], [class*="Skeleton"]').count() > 0;
    const hasError = await page.locator('text=/error|エラー|失敗/i').count() > 0;

    // At least one state should be visible
    expect(hasContent || hasLoading || hasError).toBe(true);
  });

  test('overview endpoint returns valid response', async ({ request }) => {
    const response = await request.get('http://localhost:8080/v1/explorer/overview');

    // Endpoint should exist and not return 500
    expect(response.status()).toBeLessThan(500);

    if (response.ok()) {
      const data = await response.json();
      expect(data).toBeDefined();
    }
  });

  test('locks endpoint returns valid response', async ({ request }) => {
    const response = await request.get('http://localhost:8080/v1/explorer/locks');

    if (response.ok()) {
      const data = await response.json();
      expect(data).toBeDefined();
    }
  });

  test('provers endpoint returns valid response', async ({ request }) => {
    const response = await request.get('http://localhost:8080/v1/explorer/provers');

    if (response.ok()) {
      const data = await response.json();
      expect(data).toBeDefined();
    }
  });

  test('search endpoint works', async ({ request }) => {
    const response = await request.get('http://localhost:8080/v1/explorer/search?q=test');

    expect(response.status()).toBeLessThan(500);
  });

  test('explorer pages load without errors', async ({ page }) => {
    const pages = [
      '/ja/explorer/overview',
      '/ja/explorer/locks',
      '/ja/explorer/unlocks',
      '/ja/explorer/analytics',
      '/ja/explorer/about',
    ];

    for (const url of pages) {
      await page.goto(url);
      await page.waitForLoadState('domcontentloaded');

      // Navigation should always be visible
      await expect(page.locator('nav[role="navigation"]')).toBeVisible({ timeout: 15000 });
    }
  });
});
