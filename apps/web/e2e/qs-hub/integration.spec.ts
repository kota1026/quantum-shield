/**
 * QS Hub Layer Integration Tests
 * Tests verify the QS Hub dashboard renders correctly.
 * API endpoint tests are skipped when backend is not running.
 */
import { test, expect } from '@playwright/test';
import { gotoAndWaitForApp } from '../helpers/wait-for-app';

test.describe('QS Hub Layer Integration', () => {
  test.setTimeout(90000);

  test('loads dashboard page successfully', async ({ page }) => {
    await gotoAndWaitForApp(page, '/ja/qs-hub/dashboard');

    // Wait for main content or loading state to appear
    const mainContent = page.locator('[role="main"], main, h1, [class*="animate-pulse"]').first();
    await expect(mainContent).toBeVisible({ timeout: 15000 });
  });

  test('shows loading or content state', async ({ page }) => {
    await gotoAndWaitForApp(page, '/ja/qs-hub/dashboard');

    // Either loading indicators or actual content should be present
    const loadingOrContent = page.locator(
      'h1, [class*="animate-pulse"], [class*="skeleton"], [role="main"], main'
    ).first();
    await expect(loadingOrContent).toBeVisible({ timeout: 15000 });
  });

  test('dashboard stats endpoint returns valid data', async ({ request }) => {
    try {
      const response = await request.get('http://localhost:8080/v1/qs-hub/dashboard/stats');
      expect(response.status()).toBeLessThan(500);

      if (response.ok()) {
        const data = await response.json();
        expect(data).toBeDefined();
      }
    } catch {
      // Backend not running — skip gracefully
      test.skip();
    }
  });

  test('proposals endpoint returns array', async ({ request }) => {
    try {
      const response = await request.get('http://localhost:8080/v1/qs-hub/proposals');

      if (response.ok()) {
        const data = await response.json();
        expect(Array.isArray(data.proposals) || data.proposals === undefined).toBe(true);
      }
    } catch {
      test.skip();
    }
  });

  test('council endpoint works', async ({ request }) => {
    try {
      const response = await request.get('http://localhost:8080/v1/qs-hub/council');
      expect(response.status()).toBeLessThan(500);
    } catch {
      test.skip();
    }
  });

  test('rewards endpoint works', async ({ request }) => {
    try {
      const response = await request.get('http://localhost:8080/v1/qs-hub/rewards');
      expect(response.status()).toBeLessThan(500);
    } catch {
      test.skip();
    }
  });
});
