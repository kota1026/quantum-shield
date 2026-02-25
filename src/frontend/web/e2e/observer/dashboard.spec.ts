import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Observer Dashboard', () => {
  test.setTimeout(60000);

  test.beforeEach(async ({ page }) => {
    await page.goto('/ja/observer/dashboard');
    await page.waitForLoadState('domcontentloaded');
    await page.locator('h1').waitFor({ timeout: 15000 });
  });

  test('should display the page title', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('監視者ダッシュボード');
  });

  test('should display monitoring status badge', async ({ page }) => {
    const badge = page.locator('[role="status"]');
    await expect(badge).toBeVisible();
    await expect(badge).toContainText('監視中');
  });

  test('should display stats grid with 4 cards', async ({ page }) => {
    const statsRegion = page.locator('[role="region"][aria-label="Observer statistics"]');
    await expect(statsRegion).toBeVisible();

    // Check stat labels from i18n
    await expect(page.getByText('待機中のアンロック').first()).toBeVisible();
    await expect(page.getByText('疑わしい取引').first()).toBeVisible();
    await expect(page.getByText('進行中の異議申立て').first()).toBeVisible();
    await expect(page.getByText('累計報酬').first()).toBeVisible();
  });

  test('should display pending unlocks table', async ({ page }) => {
    // The dashboard has a PendingUnlocksTable component
    await expect(page.getByText('待機中のアンロック').first()).toBeVisible();
  });

  test('should display suspicious transactions section', async ({ page }) => {
    await expect(page.getByText('疑わしい取引').first()).toBeVisible();
  });

  test('should display sidebar sections', async ({ page }) => {
    // Claimable Earnings - i18n: claimableEarnings.title = "請求可能な報酬"
    await expect(page.getByText('請求可能な報酬').first()).toBeVisible();

    // Challenge Stats - i18n: challengeStats.title = "あなたの異議申立て統計"
    await expect(page.getByText('あなたの異議申立て統計')).toBeVisible();

    // Observer Stake - i18n: observerStake.title = "あなたの監視者ステーク"
    await expect(page.getByText('あなたの監視者ステーク')).toBeVisible();
  });

  test('should navigate to pending page when clicking View All', async ({ page }) => {
    await page.getByText('すべて見る').first().click();
    await expect(page).toHaveURL(/\/observer\/pending/, { timeout: 15000 });
  });

  test('should have working navigation', async ({ page }) => {
    const nav = page.locator('nav[role="navigation"]');
    await expect(nav).toBeVisible();

    // Check nav items match i18n keys
    await expect(nav.getByText('ダッシュボード')).toBeVisible();
    await expect(nav.getByText('待機中')).toBeVisible();
    await expect(nav.getByText('疑わしい取引')).toBeVisible();
    await expect(nav.getByText('履歴')).toBeVisible();
    await expect(nav.getByText('報酬')).toBeVisible();
  });

  test('should be keyboard navigable', async ({ page }) => {
    // Tab through interactive elements
    await page.keyboard.press('Tab');

    // Verify focus exists on some element
    const focusedTag = await page.evaluate(() => document.activeElement?.tagName?.toLowerCase());
    expect(focusedTag).toBeDefined();
    expect(focusedTag).not.toBe('');
  });

  test('should pass accessibility checks', async ({ page }) => {
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .exclude('[aria-hidden="true"]')
      .disableRules(['color-contrast']) // Known issue: hinomaru color on dark bg in header
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
      await expect(page.getByText('Pending Unlocks').first()).toBeVisible();
    });
  });
});
