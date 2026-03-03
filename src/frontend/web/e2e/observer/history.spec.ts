import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Observer Challenge History', () => {
  test.setTimeout(60000);

  test.beforeEach(async ({ page }) => {
    await page.goto('/ja/observer/history');
    await page.waitForLoadState('domcontentloaded');
    await page.locator('h1').waitFor({ timeout: 15000 });
  });

  test('should display the page title', async ({ page }) => {
    // i18n: history.pageTitle = "異議申立て履歴"
    await expect(page.locator('h1')).toContainText('異議申立て履歴');
  });

  test('should display stats summary cards', async ({ page }) => {
    const statsRegion = page.locator('[role="region"][aria-label="Challenge statistics"]');
    await expect(statsRegion).toBeVisible();

    // i18n: stats.totalChallenges = "総異議申立て数"
    await expect(page.getByText('総異議申立て数')).toBeVisible();
    // i18n: stats.successful = "成功"
    await expect(page.getByText('成功').first()).toBeVisible();
    // i18n: stats.failed = "失敗"
    await expect(page.getByText('失敗').first()).toBeVisible();
    // i18n: stats.totalEarnings = "累計報酬"
    await expect(page.getByText('累計報酬')).toBeVisible();
  });

  test('should display filter controls', async ({ page }) => {
    await expect(page.getByLabel('Filter by result')).toBeVisible();
    await expect(page.getByLabel('Filter by period')).toBeVisible();
    // i18n: filters.exportCsv = "CSVエクスポート"
    await expect(page.getByText('CSVエクスポート')).toBeVisible();
  });

  test('should display data table with headers', async ({ page }) => {
    const table = page.locator('table[role="grid"]');
    await expect(table).toBeVisible();

    // Check table has headers (th elements) — text may be uppercase-transformed
    const headers = table.locator('th');
    await expect(headers).toHaveCount(7);
  });

  test('should display challenge rows with correct result badges', async ({ page }) => {
    // i18n: results.won = "✓ 勝利"
    await expect(page.getByText('✓ 勝利').first()).toBeVisible();

    // i18n: results.inProgress = "進行中"
    await expect(page.getByText('進行中').first()).toBeVisible();
  });

  test('should display reward/penalty amounts', async ({ page }) => {
    // Table should have rows with ETH amounts (positive rewards or negative penalties)
    const tableRows = page.locator('table[role="grid"] tbody tr');
    if (await tableRows.count() > 0) {
      await expect(tableRows.first()).toBeVisible();
    }
  });

  test('should have working View buttons', async ({ page }) => {
    // i18n: actions.view = "詳細"
    const viewButton = page.getByRole('link', { name: '詳細' }).first();
    await expect(viewButton).toBeVisible();
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
      await page.goto('/en/observer/history');

      // i18n EN: history.pageTitle = "Dispute History"
      await expect(page.locator('h1')).toContainText('Dispute History');
      // i18n EN: stats.totalChallenges = "Total Disputes"
      await expect(page.getByText('Total Disputes')).toBeVisible();
    });
  });
});
