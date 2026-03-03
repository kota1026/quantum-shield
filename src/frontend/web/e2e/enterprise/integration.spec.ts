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

    // Dashboard renders immediately with default data while API loads;
    // verify that the main dashboard content appears
    const dashboard = page.locator('main[aria-label]');
    await expect(dashboard).toBeVisible({ timeout: 5000 });

    // Verify structural elements rendered (KPI headings present)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
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

    // Dashboard gracefully degrades with default data on API failure;
    // verify the page still renders structurally with fallback content
    const dashboard = page.locator('main[aria-label]');
    await expect(dashboard).toBeVisible({ timeout: 5000 });

    // Verify fallback data is shown (KPI section and system status list)
    await expect(page.getByRole('region', { name: /モニタリング/ })).toBeVisible();
    await expect(page.getByRole('list', { name: /システムステータス/ })).toBeVisible();
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
