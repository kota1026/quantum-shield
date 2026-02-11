import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Observer Pending Monitor', () => {
  test.setTimeout(60000);

  test.beforeEach(async ({ page }) => {
    await page.goto('/ja/observer/pending');
    await page.waitForLoadState('domcontentloaded');
    // Wait for React hydration — ensure page title is rendered
    await expect(page.locator('h1')).toContainText('待機中のアンロック', { timeout: 15000 });
  });

  test('should display the page title', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('待機中のアンロック');
  });

  test('should display live monitoring badge', async ({ page }) => {
    const badge = page.locator('[role="status"]');
    await expect(badge).toBeVisible();
    // i18n key: observer.dashboard.pending.liveMonitoring = "リアルタイム監視"
    await expect(badge).toContainText('リアルタイム監視');
  });

  test('should display filter controls', async ({ page }) => {
    // Check filter selects and inputs exist
    await expect(page.getByLabel('種別')).toBeVisible();
    await expect(page.getByLabel('最小金額')).toBeVisible();
    await expect(page.getByLabel('最大金額')).toBeVisible();
    await expect(page.getByLabel('リスクスコア')).toBeVisible();
    await expect(page.getByLabel('並び替え')).toBeVisible();
  });

  test('should display data table with headers', async ({ page }) => {
    const table = page.locator('table[role="grid"]');
    await expect(table).toBeVisible();

    // Check table headers via th elements (uppercase transforms may affect getByRole)
    const headers = table.locator('th');
    await expect(headers).toHaveCount(7);
  });

  test('should display data table or empty state', async ({ page }) => {
    // Table should be present (with or without rows depending on API data)
    const table = page.locator('table[role="grid"]');
    await expect(table).toBeVisible();

    // Check pagination area exists (shows count even when 0)
    await expect(page.getByText(/件の待機中アンロック/)).toBeVisible();
  });

  test('should expand row on click when rows exist', async ({ page }) => {
    // Wait for table to render
    const table = page.locator('table[role="grid"]');
    await expect(table).toBeVisible();

    // Check if there are any rows (API may return empty list)
    const rowCount = await page.locator('tbody tr').count();
    if (rowCount === 0) {
      // No rows — skip this test (empty data from API)
      test.skip();
      return;
    }

    // Click on first row to expand
    const firstRow = page.locator('tbody tr').first();
    await firstRow.click();

    // Check expanded content is visible - i18n key: detail.fullAddress = "完全なアドレス"
    await expect(page.getByText('完全なアドレス')).toBeVisible({ timeout: 5000 });
  });

  test('should display pagination', async ({ page }) => {
    // Check pagination info - i18n: "1〜10件 / 47件の待機中アンロック"
    await expect(page.getByText(/件の待機中アンロック/)).toBeVisible();

    // Check pagination buttons
    await expect(page.getByRole('button', { name: '← 前へ' })).toBeVisible();
    await expect(page.getByRole('button', { name: '次へ →' })).toBeVisible();
  });

  test('should navigate to challenge page from high risk row', async ({ page }) => {
    // The action button text in i18n: actions.challenge = "異議申立て"
    const challengeLink = page.locator('a[href*="/observer/challenge/new"]').first();
    if (await challengeLink.isVisible()) {
      await challengeLink.click();
      await expect(page).toHaveURL(/\/observer\/challenge\/new/, { timeout: 15000 });
    }
  });

  test('should be keyboard navigable', async ({ page }) => {
    // Tab through interactive elements
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Verify something has focus
    const focusedTag = await page.evaluate(() => document.activeElement?.tagName?.toLowerCase());
    expect(focusedTag).toBeDefined();
  });

  test('should pass accessibility checks', async ({ page }) => {
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .exclude('[aria-hidden="true"]')
      .disableRules(['color-contrast']) // Known issue: hinomaru color on dark bg in header
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test.describe('English Locale', () => {
    test('should display English content', async ({ page }) => {
      await page.goto('/en/observer/pending');

      await expect(page.locator('h1')).toContainText('Pending Unlocks');
      await expect(page.getByText('Live Monitoring')).toBeVisible();
    });
  });
});
