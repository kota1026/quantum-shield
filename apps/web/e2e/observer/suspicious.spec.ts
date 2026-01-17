import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Observer Suspicious Monitor', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ja/observer/suspicious');
  });

  test('should display the page title', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('疑わしい取引');
  });

  test('should display alert count badge', async ({ page }) => {
    const badge = page.locator('[role="status"]');
    await expect(badge).toBeVisible();
    await expect(badge).toContainText('件のアラートが要確認');
  });

  test('should display high risk alert card', async ({ page }) => {
    await expect(page.getByText('高リスク検出')).toBeVisible();
    await expect(page.getByText('87')).toBeVisible(); // Risk score
  });

  test('should display medium risk alert cards', async ({ page }) => {
    const mediumRiskCards = page.getByText('中リスク');
    await expect(mediumRiskCards.first()).toBeVisible();
  });

  test('should display transaction summary on alert cards', async ({ page }) => {
    // Check transaction summary fields
    await expect(page.getByText('アドレス').first()).toBeVisible();
    await expect(page.getByText('金額').first()).toBeVisible();
    await expect(page.getByText('種別').first()).toBeVisible();
    await expect(page.getByText('残り時間').first()).toBeVisible();
  });

  test('should display risk factors section', async ({ page }) => {
    await expect(page.getByText('検出されたリスク要因').first()).toBeVisible();
  });

  test('should navigate to challenge page from high risk card', async ({ page }) => {
    const challengeButton = page.getByRole('link', { name: 'この取引にChallenge' }).first();
    await challengeButton.click();
    await expect(page).toHaveURL(/\/observer\/challenge\/new/);
  });

  test('should dismiss alert when clicking dismiss button', async ({ page }) => {
    // Get initial count
    const initialCards = await page.locator('article[role="article"]').count();

    // Click dismiss on first card
    const dismissButton = page.getByRole('button', { name: '却下' }).first();
    await dismissButton.click();

    // Check count decreased
    const newCards = await page.locator('article[role="article"]').count();
    expect(newCards).toBe(initialCards - 1);
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
      await page.goto('/en/observer/suspicious');

      await expect(page.locator('h1')).toContainText('Suspicious Transactions');
      await expect(page.getByText('High Risk Detected')).toBeVisible();
    });
  });
});
