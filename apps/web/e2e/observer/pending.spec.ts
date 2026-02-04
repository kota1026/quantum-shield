import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Observer Pending Monitor', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ja/observer/pending');
  });

  test('should display the page title', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('待機中のアンロック');
  });

  test('should display live monitoring badge', async ({ page }) => {
    const badge = page.locator('[role="status"]');
    await expect(badge).toBeVisible();
    await expect(badge).toContainText('ライブ監視');
  });

  test('should display filter controls', async ({ page }) => {
    // Check filter selects and inputs
    await expect(page.getByLabel('種別')).toBeVisible();
    await expect(page.getByLabel('最小金額')).toBeVisible();
    await expect(page.getByLabel('最大金額')).toBeVisible();
    await expect(page.getByLabel('リスクスコア')).toBeVisible();
    await expect(page.getByLabel('並び替え')).toBeVisible();
  });

  test('should display data table with headers', async ({ page }) => {
    const table = page.locator('table[role="grid"]');
    await expect(table).toBeVisible();

    // Check table headers
    await expect(page.getByRole('columnheader', { name: 'ユーザーアドレス' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: '金額' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: '種別' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: '残り時間' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'リスク' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'ステータス' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'アクション' })).toBeVisible();
  });

  test('should display unlock rows', async ({ page }) => {
    // Check that rows are present
    const rows = page.locator('tbody tr[role="row"]');
    await expect(rows.first()).toBeVisible();
  });

  test('should expand row on click', async ({ page }) => {
    // Click on first row
    const firstRow = page.locator('tbody tr[role="row"]').first();
    await firstRow.click();

    // Check expanded content is visible
    await expect(page.getByText('完全なアドレス')).toBeVisible();
  });

  test('should display pagination', async ({ page }) => {
    // Check pagination info
    await expect(page.getByText(/件 \/ \d+件の待機中アンロック/)).toBeVisible();

    // Check pagination buttons
    await expect(page.getByRole('button', { name: '← 前へ' })).toBeVisible();
    await expect(page.getByRole('button', { name: '次へ →' })).toBeVisible();
  });

  test('should navigate to challenge page from high risk row', async ({ page }) => {
    // Find Challenge button and click
    const challengeButton = page.getByRole('link', { name: 'Challenge' }).first();
    await challengeButton.click();

    // Check navigation
    await expect(page).toHaveURL(/\/observer\/challenge\/new/);
  });

  test('should be keyboard navigable', async ({ page }) => {
    // Tab to first row
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Expand row with Enter
    const firstRow = page.locator('tbody tr[role="row"]').first();
    await firstRow.focus();
    await page.keyboard.press('Enter');

    // Check expanded
    await expect(firstRow).toHaveAttribute('aria-expanded', 'true');
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
      await page.goto('/en/observer/pending');

      await expect(page.locator('h1')).toContainText('Pending Unlocks');
      await expect(page.getByText('Live Monitoring')).toBeVisible();
    });
  });
});
