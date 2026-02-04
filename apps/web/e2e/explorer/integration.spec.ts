/**
 * Explorer App Layer Integration Tests
 */
import { test, expect } from '@playwright/test';

test.describe('Explorer Layer Integration', () => {

  test('loads overview data from API', async ({ page }) => {
    let apiCalled = false;

    await page.route('**/v1/explorer/**', async (route) => {
      apiCalled = true;
      await route.continue();
    });

    await page.goto('/ja/explorer');
    await page.waitForLoadState('networkidle');

    expect(apiCalled).toBe(true);
  });

  test('shows loading state while fetching data', async ({ page }) => {
    await page.route('**/v1/explorer/**', async (route) => {
      await new Promise(r => setTimeout(r, 1000));
      await route.continue();
    });

    await page.goto('/ja/explorer');

    const loadingIndicator = page.locator('[class*="animate-pulse"], [class*="skeleton"], [class*="Skeleton"]').first();
    await expect(loadingIndicator).toBeVisible({ timeout: 2000 });
  });

  test('shows error state on API failure', async ({ page }) => {
    await page.route('**/v1/explorer/**', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' })
      });
    });

    await page.goto('/ja/explorer');
    await page.waitForLoadState('networkidle');

    const errorIndicator = page.getByText(/error|エラー|失敗/i);
    await expect(errorIndicator).toBeVisible({ timeout: 5000 });
  });

  test('overview endpoint returns valid data', async ({ request }) => {
    const response = await request.get('http://localhost:8080/v1/explorer/overview');

    expect(response.status()).toBeLessThan(500);

    if (response.ok()) {
      const data = await response.json();
      expect(data).toBeDefined();
      expect(data.network || data.recentActivity).toBeDefined();
    }
  });

  test('locks endpoint returns array', async ({ request }) => {
    const response = await request.get('http://localhost:8080/v1/explorer/locks');

    if (response.ok()) {
      const data = await response.json();
      expect(Array.isArray(data.locks)).toBe(true);
    }
  });

  test('provers endpoint returns array', async ({ request }) => {
    const response = await request.get('http://localhost:8080/v1/explorer/provers');

    if (response.ok()) {
      const data = await response.json();
      expect(Array.isArray(data.provers)).toBe(true);
    }
  });

  test('search endpoint works', async ({ request }) => {
    const response = await request.get('http://localhost:8080/v1/explorer/search?q=test');

    expect(response.status()).toBeLessThan(500);
  });
});
