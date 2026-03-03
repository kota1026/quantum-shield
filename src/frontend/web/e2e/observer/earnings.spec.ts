import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Observer Earnings', () => {
  test.setTimeout(60000);

  test.beforeEach(async ({ page }) => {
    await page.goto('/ja/observer/earnings');
    await page.waitForLoadState('domcontentloaded');
    await page.locator('h1').waitFor({ timeout: 15000 });
  });

  test('should display the page title', async ({ page }) => {
    // i18n: earnings.pageTitle = "報酬管理"
    await expect(page.locator('h1')).toContainText('報酬管理');
  });

  test('should display claimable amount card', async ({ page }) => {
    // i18n: claim.available = "請求可能"
    await expect(page.getByText('請求可能').first()).toBeVisible();
    // Should show a QS amount
    await expect(page.getByText(/\d+\.?\d*\s*QS/).first()).toBeVisible();
  });

  test('should display claim button', async ({ page }) => {
    // i18n: claim.claimButton = "報酬を請求"
    const claimButton = page.getByRole('button', { name: /報酬を請求/ });
    await expect(claimButton).toBeVisible();
  });

  test('should display stats grid', async ({ page }) => {
    // i18n: summary.totalEarnings = "累計報酬"
    await expect(page.getByText('累計報酬')).toBeVisible();
    // i18n: summary.claimed = "請求済み"
    await expect(page.getByText('請求済み').first()).toBeVisible();
  });

  test('should display claimable breakdown', async ({ page }) => {
    // i18n: claim.title = "請求可能な報酬"
    await expect(page.getByText('請求可能な報酬').first()).toBeVisible();
  });

  test('should display earnings history table', async ({ page }) => {
    // i18n: history.title = "報酬履歴"
    await expect(page.getByText('報酬履歴')).toBeVisible();
    const table = page.locator('table');
    await expect(table).toBeVisible();
  });

  test('should display sidebar with performance stats', async ({ page }) => {
    // i18n: performance.title = "パフォーマンス統計"
    await expect(page.getByText('パフォーマンス統計')).toBeVisible();
    // i18n: performance.successRate = "成功率"
    await expect(page.getByText('成功率')).toBeVisible();
  });

  test('should display observer stake section', async ({ page }) => {
    // i18n: stake.title = "あなたの監視者ステーク"
    await expect(page.getByText('あなたの監視者ステーク')).toBeVisible();
    // Stake amount should show ETH value
    await expect(page.getByText(/ETH/).first()).toBeVisible();
  });

  test('should display ROI calculator', async ({ page }) => {
    // i18n: roi.title = "ROI計算"
    await expect(page.getByText('ROI計算')).toBeVisible();
  });

  test('should open claim modal on button click', async ({ page }) => {
    await page.getByRole('button', { name: /報酬を請求/ }).click();

    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();
    // i18n: claimModal.title = "請求の確認"
    await expect(page.getByText('請求の確認')).toBeVisible();
  });

  test('should close claim modal on cancel', async ({ page }) => {
    await page.getByRole('button', { name: /報酬を請求/ }).click();
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // i18n: claimModal.cancel = "キャンセル"
    await page.locator('[role="dialog"]').getByRole('button', { name: 'キャンセル' }).click();
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
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
      await page.goto('/en/observer/earnings');

      // i18n EN: earnings.pageTitle = "Earnings Management"
      await expect(page.locator('h1')).toContainText('Earnings Management');
      // i18n EN: summary.totalEarnings = "Total Earnings"
      await expect(page.getByText('Total Earnings')).toBeVisible();
      // i18n EN: history.title = "Rewards History"
      await expect(page.getByText('Rewards History')).toBeVisible();
    });
  });
});
