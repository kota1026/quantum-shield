import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Observer Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ja/observer/dashboard');
  });

  test('should display the page title', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Observer Dashboard');
  });

  test('should display monitoring status badge', async ({ page }) => {
    const badge = page.locator('[role="status"]');
    await expect(badge).toBeVisible();
    await expect(badge).toContainText('監視中');
  });

  test('should display stats grid with 4 cards', async ({ page }) => {
    const statsRegion = page.locator('[role="region"][aria-label="Observer statistics"]');
    await expect(statsRegion).toBeVisible();

    // Check all 4 stat cards are visible
    await expect(statsRegion.locator('.rounded-qs-lg')).toHaveCount(4);
  });

  test('should display pending unlocks table', async ({ page }) => {
    const table = page.locator('table[role="grid"]');
    await expect(table).toBeVisible();

    // Check table headers
    await expect(page.getByRole('columnheader', { name: 'アドレス' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: '金額' })).toBeVisible();
  });

  test('should display suspicious transactions section', async ({ page }) => {
    await expect(page.getByText('疑わしい取引')).toBeVisible();
    await expect(page.getByText('高リスク検出')).toBeVisible();
  });

  test('should display sidebar sections', async ({ page }) => {
    // Claimable Earnings
    await expect(page.getByText('請求可能な報酬')).toBeVisible();
    await expect(page.getByText('1.24 ETH')).toBeVisible();

    // Challenge Stats
    await expect(page.getByText('あなたのChallenge統計')).toBeVisible();

    // Active Challenges
    await expect(page.getByText('進行中のChallenge')).toBeVisible();

    // Observer Stake
    await expect(page.getByText('あなたのObserverステーク')).toBeVisible();
  });

  test('should navigate to pending page when clicking View All', async ({ page }) => {
    await page.getByText('すべて見る').first().click();
    await expect(page).toHaveURL(/\/observer\/pending/);
  });

  test('should have working navigation', async ({ page }) => {
    const nav = page.locator('nav[role="navigation"]');
    await expect(nav).toBeVisible();

    // Check all nav items
    await expect(nav.getByText('Dashboard')).toBeVisible();
    await expect(nav.getByText('待機中')).toBeVisible();
    await expect(nav.getByText('疑わしい取引')).toBeVisible();
    await expect(nav.getByText('履歴')).toBeVisible();
    await expect(nav.getByText('報酬')).toBeVisible();
  });

  test('should be keyboard navigable', async ({ page }) => {
    // Tab through interactive elements
    await page.keyboard.press('Tab');

    // Verify focus is visible on interactive elements
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });

  test('should pass accessibility checks', async ({ page }) => {
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .exclude('[aria-hidden="true"]')
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test.describe('Responsive Design', () => {
    test('should display correctly on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/ja/observer/dashboard');

      // Stats should stack vertically
      const statsRegion = page.locator('[role="region"][aria-label="Observer statistics"]');
      await expect(statsRegion).toBeVisible();
    });

    test('should display correctly on tablet', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto('/ja/observer/dashboard');

      await expect(page.locator('h1')).toBeVisible();
    });
  });

  test.describe('English Locale', () => {
    test('should display English content', async ({ page }) => {
      await page.goto('/en/observer/dashboard');

      await expect(page.locator('h1')).toContainText('Observer Dashboard');
      await expect(page.getByText('Monitoring Active')).toBeVisible();
      await expect(page.getByText('Pending Unlocks')).toBeVisible();
    });
  });
});
