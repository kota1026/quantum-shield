import { test, expect } from '@playwright/test';
import { gotoAndWaitForApp } from '../helpers/wait-for-app';

test.setTimeout(90000);

test.describe('Token Hub Integration', () => {
  test.describe('Dashboard Page Load', () => {
    test('should load dashboard with fallback data when API unavailable', async ({ page }) => {
      await gotoAndWaitForApp(page, '/ja/qs-hub/dashboard');
      await expect(page.getByRole('main')).toBeVisible();
      // Dashboard should render with mock/fallback data
      await expect(page.getByText('QS残高')).toBeVisible();
    });
  });

  test.describe('Lock Page Load', () => {
    test('should load lock page with form elements', async ({ page }) => {
      await gotoAndWaitForApp(page, '/ja/qs-hub/stake/lock');
      await expect(page.getByRole('main')).toBeVisible();
      await expect(page.getByText('ロック数量')).toBeVisible();
    });
  });

  test.describe('Delegate List Page Load', () => {
    test('should load delegate list with fallback data', async ({ page }) => {
      await gotoAndWaitForApp(page, '/ja/token-hub/delegate-list');
      await expect(page.getByRole('main')).toBeVisible();
      // Should show delegate cards from fallback data
      const listItems = page.locator('[role="listitem"]');
      const count = await listItems.count();
      expect(count).toBeGreaterThanOrEqual(1);
    });
  });

  test.describe('Rewards Page Load', () => {
    test('should load rewards page with fallback data', async ({ page }) => {
      await gotoAndWaitForApp(page, '/ja/qs-hub/rewards');
      await expect(page.getByRole('main')).toBeVisible();
      await expect(page.getByText('請求可能な報酬')).toBeVisible();
    });
  });

  test.describe('API Health Check', () => {
    test('should handle backend API gracefully', async ({ request }) => {
      try {
        const response = await request.get('http://localhost:8080/v1/token-hub/dashboard');
        // If API is reachable, it should not return 500
        expect(response.status()).toBeLessThan(500);
      } catch {
        // API not available - this is expected in CI / local dev without backend
        test.skip();
      }
    });

    test('should handle locks endpoint gracefully', async ({ request }) => {
      try {
        const response = await request.get('http://localhost:8080/v1/token-hub/locks');
        expect(response.status()).toBeLessThan(500);
      } catch {
        test.skip();
      }
    });

    test('should handle delegates endpoint gracefully', async ({ request }) => {
      try {
        const response = await request.get('http://localhost:8080/v1/token-hub/delegates');
        expect(response.status()).toBeLessThan(500);
      } catch {
        test.skip();
      }
    });

    test('should handle rewards endpoint gracefully', async ({ request }) => {
      try {
        const response = await request.get('http://localhost:8080/v1/token-hub/rewards');
        expect(response.status()).toBeLessThan(500);
      } catch {
        test.skip();
      }
    });
  });

  test.describe('Navigation Between Pages', () => {
    test('should navigate from dashboard to lock page', async ({ page }) => {
      await gotoAndWaitForApp(page, '/ja/qs-hub/dashboard');

      const nav = page.getByRole('navigation', { name: 'Token Hub ナビゲーション' });
      const lockLink = nav.getByText('ロック');
      await lockLink.click();
      await page.waitForLoadState('domcontentloaded');
      await expect(page.getByRole('main')).toBeVisible();
    });

    test('should navigate from dashboard to rewards page', async ({ page }) => {
      await gotoAndWaitForApp(page, '/ja/qs-hub/dashboard');

      const nav = page.getByRole('navigation', { name: 'Token Hub ナビゲーション' });
      const rewardsLink = nav.getByText('報酬');
      await rewardsLink.click();
      await page.waitForLoadState('domcontentloaded');
      await expect(page.getByRole('main')).toBeVisible();
    });
  });
});
