/**
 * QS Admin Layer Integration Tests
 */
import { test, expect } from '@playwright/test';

test.describe('QS Admin Layer Integration', () => {

  test('loads dashboard from API', async ({ page }) => {
    let apiCalled = false;

    await page.route('**/api/admin/**', async (route) => {
      apiCalled = true;
      await route.continue();
    });

    await page.goto('/ja/qs-admin/dashboard');
    await page.waitForLoadState('networkidle');

    expect(apiCalled).toBe(true);
  });

  test('shows loading state while fetching data', async ({ page }) => {
    await page.route('**/api/admin/**', async (route) => {
      await new Promise(r => setTimeout(r, 1000));
      await route.continue();
    });

    await page.goto('/ja/qs-admin/dashboard');

    const loadingIndicator = page.locator('[class*="animate-pulse"], [class*="skeleton"], [class*="Skeleton"]').first();
    await expect(loadingIndicator).toBeVisible({ timeout: 2000 });
  });

  test('shows error state on API failure', async ({ page }) => {
    await page.route('**/api/admin/**', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' })
      });
    });

    await page.goto('/ja/qs-admin/dashboard');
    await page.waitForLoadState('networkidle');

    const errorIndicator = page.getByText(/error|エラー|失敗/i);
    await expect(errorIndicator).toBeVisible({ timeout: 5000 });
  });

  test('dashboard endpoint returns valid data', async ({ request }) => {
    const response = await request.get('http://localhost:8080/api/admin/dashboard');

    expect(response.status()).toBeLessThan(500);

    if (response.ok()) {
      const data = await response.json();
      expect(data).toBeDefined();
    }
  });

  test('transactions endpoint works', async ({ request }) => {
    const response = await request.get('http://localhost:8080/api/admin/transactions/locks');

    expect(response.status()).toBeLessThan(500);
  });

  test('provers endpoint works', async ({ request }) => {
    const response = await request.get('http://localhost:8080/api/admin/prover/list');

    expect(response.status()).toBeLessThan(500);
  });

  test('system status endpoint works', async ({ request }) => {
    const response = await request.get('http://localhost:8080/api/admin/system/status');

    expect(response.status()).toBeLessThan(500);
  });
});
