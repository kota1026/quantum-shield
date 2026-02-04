import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Observer Challenge History', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ja/observer/history');
  });

  test('should display the page title', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Challenge履歴');
  });

  test('should display stats summary cards', async ({ page }) => {
    const statsRegion = page.locator('[role="region"][aria-label="Challenge statistics"]');
    await expect(statsRegion).toBeVisible();

    // Check all stat labels
    await expect(page.getByText('総Challenge数')).toBeVisible();
    await expect(page.getByText('成功')).toBeVisible();
    await expect(page.getByText('失敗')).toBeVisible();
    await expect(page.getByText('累計報酬')).toBeVisible();
  });

  test('should display filter controls', async ({ page }) => {
    await expect(page.getByLabel('Filter by result')).toBeVisible();
    await expect(page.getByLabel('Filter by period')).toBeVisible();
    await expect(page.getByText('CSVエクスポート')).toBeVisible();
  });

  test('should display data table with headers', async ({ page }) => {
    const table = page.locator('table[role="grid"]');
    await expect(table).toBeVisible();

    // Check table headers
    await expect(page.getByRole('columnheader', { name: 'Challenge ID' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: '対象アドレス' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: '金額' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: '結果' })).toBeVisible();
  });

  test('should display challenge rows with correct result badges', async ({ page }) => {
    // Check Won badge
    await expect(page.getByText('✓ 勝利').first()).toBeVisible();

    // Check Lost badge (if visible)
    const lostBadge = page.getByText('✗ 敗北');
    if (await lostBadge.count() > 0) {
      await expect(lostBadge.first()).toBeVisible();
    }

    // Check In Progress badge
    await expect(page.getByText('進行中').first()).toBeVisible();
  });

  test('should display reward/penalty amounts', async ({ page }) => {
    // Check positive reward
    await expect(page.getByText('+0.65 ETH')).toBeVisible();

    // Check negative penalty
    await expect(page.getByText('-0.10 ETH')).toBeVisible();
  });

  test('should have working View buttons', async ({ page }) => {
    const viewButton = page.getByRole('link', { name: '詳細' }).first();
    await expect(viewButton).toBeVisible();
  });

  test('should pass accessibility checks', async ({ page }) => {
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .exclude('[aria-hidden="true"]')
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test.describe('English Locale', () => {
    test('should display English content', async ({ page }) => {
      await page.goto('/en/observer/history');

      await expect(page.locator('h1')).toContainText('Challenge History');
      await expect(page.getByText('Total Challenges')).toBeVisible();
    });
  });
});
