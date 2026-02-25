/**
 * Enterprise App Layer Integration Tests
 */
import { test, expect } from '@playwright/test';

test.describe('Enterprise Layer Integration', () => {

  test('loads dashboard from API', async ({ page }) => {
    let apiCalled = false;

    await page.route('**/v1/enterprise/**', async (route) => {
      apiCalled = true;
      await route.continue();
    });

    await page.goto('/ja/enterprise/dashboard');
    await page.waitForLoadState('networkidle');

    expect(apiCalled).toBe(true);
  });

  test('shows loading state while fetching data', async ({ page }) => {
    await page.route('**/v1/enterprise/**', async (route) => {
      await new Promise(r => setTimeout(r, 1000));
      await route.continue();
    });

    await page.goto('/ja/enterprise/dashboard');

    const loadingIndicator = page.locator('[class*="animate-pulse"], [class*="skeleton"], [class*="Skeleton"]').first();
    await expect(loadingIndicator).toBeVisible({ timeout: 2000 });
  });

  test('shows error state on API failure', async ({ page }) => {
    await page.route('**/v1/enterprise/**', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' })
      });
    });

    await page.goto('/ja/enterprise/dashboard');
    await page.waitForLoadState('networkidle');

    const errorIndicator = page.getByText(/error|エラー|失敗/i);
    await expect(errorIndicator).toBeVisible({ timeout: 5000 });
  });

  test('dashboard endpoint returns valid data', async ({ request }) => {
    const response = await request.get('http://localhost:8080/v1/enterprise/dashboard');

    expect(response.status()).toBeLessThan(500);

    if (response.ok()) {
      const data = await response.json();
      expect(data).toBeDefined();
    }
  });

  test('tvl endpoint works', async ({ request }) => {
    const response = await request.get('http://localhost:8080/v1/enterprise/tvl');

    expect(response.status()).toBeLessThan(500);
  });

  test('provers endpoint works', async ({ request }) => {
    const response = await request.get('http://localhost:8080/v1/enterprise/provers');

    expect(response.status()).toBeLessThan(500);
  });

  test('status endpoint works', async ({ request }) => {
    const response = await request.get('http://localhost:8080/v1/enterprise/status');

    expect(response.status()).toBeLessThan(500);
  });
});
