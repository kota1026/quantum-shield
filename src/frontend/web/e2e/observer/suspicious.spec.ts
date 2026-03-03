import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Observer Suspicious Monitor', () => {
  test.setTimeout(60000);

  test.beforeEach(async ({ page }) => {
    await page.goto('/ja/observer/suspicious');
    await page.waitForLoadState('domcontentloaded');
    await page.locator('h1').waitFor({ timeout: 15000 });
  });

  test('should display the page title', async ({ page }) => {
    // i18n: suspiciousPage.pageTitle = "疑わしい取引"
    await expect(page.locator('h1')).toContainText('疑わしい取引');
  });

  test('should display alert count badge', async ({ page }) => {
    const badge = page.locator('[role="status"]');
    await expect(badge).toBeVisible();
    // i18n: alertCount = "{count}件のアラートが要確認"
    await expect(badge).toContainText('件のアラートが要確認');
  });

  test('should display high risk alert card', async ({ page }) => {
    // i18n: riskLevels.high = "高リスク検出"
    await expect(page.getByText('高リスク検出')).toBeVisible();
    // Risk score should be a numeric value
    await expect(page.getByText(/\d{2,3}/).first()).toBeVisible();
  });

  test('should display medium risk alert cards', async ({ page }) => {
    // i18n: riskLevels.medium = "中リスク"
    const mediumRiskCards = page.getByText('中リスク');
    await expect(mediumRiskCards.first()).toBeVisible();
  });

  test('should display transaction summary on alert cards', async ({ page }) => {
    // i18n: txSummary keys
    await expect(page.getByText('アドレス').first()).toBeVisible();
    await expect(page.getByText('金額').first()).toBeVisible();
    await expect(page.getByText('種別').first()).toBeVisible();
    await expect(page.getByText('残り時間').first()).toBeVisible();
  });

  test('should display risk factors section', async ({ page }) => {
    // i18n: riskFactors.title = "検出されたリスク要因"
    await expect(page.getByText('検出されたリスク要因').first()).toBeVisible();
  });

  test('should navigate to challenge page from high risk card', async ({ page }) => {
    // i18n: actions.challenge = "この取引に異議申立て" (Link element)
    const challengeButton = page.locator('a').filter({ hasText: /この取引に異議申立て/ }).first();
    await challengeButton.click();
    await expect(page).toHaveURL(/\/observer\/challenge\/new/, { timeout: 15000 });
  });

  test('should dismiss alert when clicking dismiss button', async ({ page }) => {
    // Wait for alert cards to render (3 mock alerts)
    await expect(page.locator('article[role="article"]').first()).toBeVisible({ timeout: 5000 });

    // Get initial count of article elements
    const initialCards = await page.locator('article[role="article"]').count();
    expect(initialCards).toBeGreaterThan(0);

    // i18n: actions.dismiss = "却下"
    const dismissButton = page.getByRole('button', { name: '却下' }).first();
    await dismissButton.click();

    // Wait for the card to be removed from DOM
    await expect(page.locator('article[role="article"]')).toHaveCount(initialCards - 1, { timeout: 5000 });
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
      await page.goto('/en/observer/suspicious');

      await expect(page.locator('h1')).toContainText('Suspicious Transactions');
      await expect(page.getByText('High Risk Detected')).toBeVisible();
    });
  });
});
