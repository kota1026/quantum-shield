import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Observer Challenge Progress', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ja/observer/challenge/1');
  });

  test('should display the page title with challenge ID', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Challenge #');
  });

  test('should display back button to history', async ({ page }) => {
    const backButton = page.getByRole('link', { name: /履歴に戻る/ });
    await expect(backButton).toBeVisible();
  });

  test('should display submitted success banner', async ({ page }) => {
    await expect(page.getByText('Challenge Successfully Submitted')).toBeVisible();
  });

  test('should display status badge', async ({ page }) => {
    // Check for one of the status badges
    const statusBadge = page.locator('text=防御期間中');
    await expect(statusBadge).toBeVisible();
  });

  test('should display countdown timer', async ({ page }) => {
    // Check countdown section exists
    const countdownSection = page.locator('[aria-label="Defense period countdown"]');
    await expect(countdownSection).toBeVisible();

    // Check countdown values are visible
    await expect(page.getByText('Hours').first()).toBeVisible();
    await expect(page.getByText('Minutes').first()).toBeVisible();
    await expect(page.getByText('Seconds').first()).toBeVisible();
  });

  test('should display progress bar', async ({ page }) => {
    await expect(page.getByText(/% of defense period elapsed/)).toBeVisible();
  });

  test('should display timeline section', async ({ page }) => {
    await expect(page.getByText('タイムライン')).toBeVisible();
    await expect(page.getByText('Challenge提出')).toBeVisible();
  });

  test('should display challenge details card', async ({ page }) => {
    await expect(page.getByText('Challenge詳細')).toBeVisible();
    await expect(page.getByText('あなたのBond')).toBeVisible();
  });

  test('should display target transaction details', async ({ page }) => {
    await expect(page.getByText('Target Transaction')).toBeVisible();
    await expect(page.getByText('45.00 ETH')).toBeVisible();
    await expect(page.getByText('Emergency Unlock')).toBeVisible();
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
      await page.goto('/en/observer/challenge/1');

      await expect(page.locator('h1')).toContainText('Challenge #');
      await expect(page.getByText('Timeline')).toBeVisible();
      await expect(page.getByText('Challenge Details')).toBeVisible();
    });
  });
});
