import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Observer Challenge Progress', () => {
  test.setTimeout(60000);

  test.beforeEach(async ({ page }) => {
    await page.goto('/ja/observer/challenge/1');
    await page.waitForLoadState('domcontentloaded');
    await page.locator('h1').waitFor({ timeout: 15000 });
  });

  test('should display the page title with challenge ID', async ({ page }) => {
    // i18n: header.title = "異議申立て #{id}"
    await expect(page.locator('h1')).toContainText('異議申立て #');
  });

  test('should display back button to history', async ({ page }) => {
    // i18n: backToHistory = "← 履歴に戻る"
    const backButton = page.getByRole('link', { name: /履歴に戻る/ });
    await expect(backButton).toBeVisible();
  });

  test('should display submitted success banner', async ({ page }) => {
    // i18n JA: submitted.title = "異議申立てが正常に送信されました"
    await expect(page.getByText('異議申立てが正常に送信されました')).toBeVisible();
  });

  test('should display status badge', async ({ page }) => {
    // i18n: status.defensePeriod = "反論期間中"
    await expect(page.getByText('反論期間中')).toBeVisible();
  });

  test('should display countdown timer', async ({ page }) => {
    // Check countdown section exists
    const countdownSection = page.locator('[aria-label="反論期間カウントダウン"]');
    await expect(countdownSection).toBeVisible();

    // i18n: countdown.hours/minutes/seconds = "時間"/"分"/"秒"
    await expect(page.getByText('時間').first()).toBeVisible();
    await expect(page.getByText('分').first()).toBeVisible();
    await expect(page.getByText('秒').first()).toBeVisible();
  });

  test('should display progress bar', async ({ page }) => {
    // i18n: countdown.elapsed = "反論期間の{percent}%が経過"
    await expect(page.getByText(/反論期間の\d+%が経過/)).toBeVisible();
  });

  test('should display timeline section', async ({ page }) => {
    // i18n: timeline.title = "タイムライン"
    await expect(page.getByText('タイムライン')).toBeVisible();
    // i18n: timeline.submitted = "異議申立て提出"
    await expect(page.getByText('異議申立て提出')).toBeVisible();
  });

  test('should display challenge details card', async ({ page }) => {
    // i18n: details.title = "異議申立て詳細"
    await expect(page.getByText('異議申立て詳細')).toBeVisible();
    // i18n: details.yourBond = "あなたの保証金"
    await expect(page.getByText('あなたの保証金')).toBeVisible();
  });

  test('should display target transaction details', async ({ page }) => {
    // i18n: target.title = "対象取引"
    await expect(page.getByText('対象取引')).toBeVisible();
    // Transaction should show an ETH amount
    await expect(page.getByText(/ETH/).first()).toBeVisible();
    // i18n: target.emergencyUnlock = "緊急アンロック"
    await expect(page.getByText('緊急アンロック').first()).toBeVisible();
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
      await page.goto('/en/observer/challenge/1');

      // i18n EN: header.title = "Dispute #{id}"
      await expect(page.locator('h1')).toContainText('Dispute #');
      // i18n EN: timeline.title = "Timeline"
      await expect(page.getByText('Timeline')).toBeVisible();
      // i18n EN: details.title = "Dispute Details"
      await expect(page.getByText('Dispute Details')).toBeVisible();
    });
  });
});
