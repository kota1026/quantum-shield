import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Observer Earnings', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ja/observer/earnings');
  });

  test('should display the page title', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('報酬管理');
  });

  test('should display claimable amount card', async ({ page }) => {
    await expect(page.getByText('請求可能')).toBeVisible();
    await expect(page.getByText('1.24 ETH')).toBeVisible();
    await expect(page.getByText('Ready to Claim')).toBeVisible();
  });

  test('should display claim button', async ({ page }) => {
    const claimButton = page.getByRole('button', { name: /報酬を請求/ });
    await expect(claimButton).toBeVisible();
  });

  test('should display stats grid', async ({ page }) => {
    await expect(page.getByText('累計報酬')).toBeVisible();
    await expect(page.getByText('4.28 ETH')).toBeVisible();
    await expect(page.getByText('請求済み')).toBeVisible();
    await expect(page.getByText('3.04 ETH')).toBeVisible();
  });

  test('should display claimable breakdown', async ({ page }) => {
    await expect(page.getByText('請求可能な報酬')).toBeVisible();
    await expect(page.getByText(/CHG-2831/)).toBeVisible();
  });

  test('should display earnings history table', async ({ page }) => {
    await expect(page.getByText('報酬履歴')).toBeVisible();
    const table = page.locator('table');
    await expect(table).toBeVisible();
  });

  test('should display sidebar with performance stats', async ({ page }) => {
    await expect(page.getByText('Performance Statistics')).toBeVisible();
    await expect(page.getByText('85.7%')).toBeVisible();
    await expect(page.getByText('Success Rate')).toBeVisible();
  });

  test('should display observer stake section', async ({ page }) => {
    await expect(page.getByText('Your Observer Stake')).toBeVisible();
    await expect(page.getByText('5.00 ETH')).toBeVisible();
  });

  test('should display ROI calculator', async ({ page }) => {
    await expect(page.getByText('ROI Calculator')).toBeVisible();
    await expect(page.getByText('+85.6%')).toBeVisible();
  });

  test('should open claim modal on button click', async ({ page }) => {
    await page.getByRole('button', { name: /報酬を請求/ }).click();

    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();
    await expect(page.getByText('Confirm Claim')).toBeVisible();
  });

  test('should close claim modal on cancel', async ({ page }) => {
    await page.getByRole('button', { name: /報酬を請求/ }).click();
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
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
      await page.goto('/en/observer/earnings');

      await expect(page.locator('h1')).toContainText('Earnings Management');
      await expect(page.getByText('Total Earnings')).toBeVisible();
      await expect(page.getByText('Rewards History')).toBeVisible();
    });
  });
});
