/**
 * Observer App Layer Integration Tests
 */
import { test, expect } from '@playwright/test';

test.describe('Observer Layer Integration', () => {

  test('loads dashboard data from API', async ({ page }) => {
    let apiCalled = false;

    await page.route('**/v1/observer/**', async (route) => {
      apiCalled = true;
      await route.continue();
    });

    await page.goto('/ja/observer/dashboard');
    await page.waitForLoadState('networkidle');

    expect(apiCalled).toBe(true);
  });

  test('shows loading state while fetching data', async ({ page }) => {
    await page.route('**/v1/observer/**', async (route) => {
      await new Promise(r => setTimeout(r, 1000));
      await route.continue();
    });

    await page.goto('/ja/observer/dashboard');

    const loadingIndicator = page.locator('[class*="animate-pulse"], [class*="skeleton"], [class*="Skeleton"]').first();
    await expect(loadingIndicator).toBeVisible({ timeout: 2000 });
  });

  test('shows error state on API failure', async ({ page }) => {
    await page.route('**/v1/observer/**', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' })
      });
    });

    await page.goto('/ja/observer/dashboard');
    await page.waitForLoadState('networkidle');

    const errorIndicator = page.getByText(/error|エラー|失敗/i);
    await expect(errorIndicator).toBeVisible({ timeout: 5000 });
  });

  test('backend API returns valid response', async ({ request }) => {
    const response = await request.get('http://localhost:8080/v1/observer/list');

    expect(response.status()).toBeLessThan(500);

    if (response.ok()) {
      const data = await response.json();
      expect(data).toBeDefined();
    }
  });

  test('observer registration endpoint exists', async ({ request }) => {
    const response = await request.post('http://localhost:8080/v1/observer/register', {
      data: { endpoint: 'http://test.example.com' }
    });

    expect([200, 201, 400, 401, 403]).toContain(response.status());
  });
});
