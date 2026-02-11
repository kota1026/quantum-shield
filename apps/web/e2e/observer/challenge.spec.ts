import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Observer Challenge Form', () => {
  test.setTimeout(60000);

  test.beforeEach(async ({ page }) => {
    await page.goto('/ja/observer/challenge/new');
    await page.waitForLoadState('domcontentloaded');
    await page.locator('h1').waitFor({ timeout: 15000 });
  });

  test('should display the page title', async ({ page }) => {
    // i18n: observer.dashboard.challenge.pageTitle = "異議申立て提出"
    await expect(page.locator('h1')).toContainText('異議申立て提出');
  });

  test('should display back button', async ({ page }) => {
    // i18n: backToSuspicious = "← 戻る"
    const backButton = page.getByRole('link', { name: /戻る/ });
    await expect(backButton).toBeVisible();
  });

  test('should display target transaction section', async ({ page }) => {
    // i18n: targetTransaction.title = "対象取引"
    await expect(page.getByText('対象取引')).toBeVisible();
    // i18n: targetTransaction.targetAddress = "対象アドレス"
    await expect(page.getByText('対象アドレス')).toBeVisible();
    // Mock transaction amount: 45.00 ETH (appears multiple times - in target section and bond calculation)
    await expect(page.getByText('45.00 ETH').first()).toBeVisible();
    // i18n: targetTransaction.emergency = "緊急アンロック" (appears in both target section and risk factor)
    await expect(page.getByText('緊急アンロック').first()).toBeVisible();
  });

  test('should display evidence section with checkboxes', async ({ page }) => {
    // i18n: evidence.title = "証拠と理由"
    await expect(page.getByText('証拠と理由')).toBeVisible();
    // i18n: evidence.selectFactors = "該当するリスク要因を選択"
    await expect(page.getByText('該当するリスク要因を選択')).toBeVisible();

    // Check that risk factor checkboxes exist (4 risk factors)
    const checkboxes = page.locator('input[type="checkbox"]');
    await expect(checkboxes).toHaveCount(4);
  });

  test('should display additional evidence textarea', async ({ page }) => {
    const textarea = page.locator('textarea');
    await expect(textarea).toBeVisible();
    await expect(textarea).toHaveAttribute('placeholder');
  });

  test('should allow adding supporting links', async ({ page }) => {
    // i18n: evidence.addLink = "+ リンクを追加"
    const addLinkButton = page.getByRole('button', { name: /リンクを追加/ });
    await expect(addLinkButton).toBeVisible();

    // Click to add a link
    await addLinkButton.click();

    // Should have 2 link inputs now
    const linkInputs = page.locator('input[type="url"]');
    await expect(linkInputs).toHaveCount(2);
  });

  test('should display bond calculation section', async ({ page }) => {
    // i18n: bond.title = "保証金"
    await expect(page.getByText('保証金').first()).toBeVisible();
    // i18n: bond.requiredAmount = "必要な保証金"
    await expect(page.getByText('必要な保証金')).toBeVisible();
    // Bond amount: MAX(0.1, 45.00 * 0.01) = 0.45 ETH
    await expect(page.getByText('0.45 ETH').first()).toBeVisible();
  });

  test('should display action buttons', async ({ page }) => {
    // i18n: actions.cancel = "キャンセル"
    await expect(page.getByRole('link', { name: 'キャンセル' })).toBeVisible();
    // i18n: actions.submit = "異議申立てを提出 ({amount})"
    await expect(page.getByRole('button', { name: /異議申立てを提出/ })).toBeVisible();
  });

  test('should open confirmation modal on submit', async ({ page }) => {
    const submitButton = page.getByRole('button', { name: /異議申立てを提出/ });
    await submitButton.click();

    // Modal should appear
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();
    // i18n: confirm.title = "異議申立て提出の確認"
    await expect(page.getByText('異議申立て提出の確認')).toBeVisible();
  });

  test('should require acknowledgement checkbox before confirming', async ({ page }) => {
    // Open modal
    await page.getByRole('button', { name: /異議申立てを提出/ }).click();

    // i18n: confirm.confirmButton = "確認して提出"
    const confirmButton = page.getByRole('button', { name: '確認して提出' });
    await expect(confirmButton).toBeDisabled();

    // Check the acknowledgement checkbox
    const acknowledgeCheckbox = page.locator('[role="dialog"] input[type="checkbox"]');
    await acknowledgeCheckbox.check();

    // Confirm button should now be enabled
    await expect(confirmButton).toBeEnabled();
  });

  test('should close modal on cancel', async ({ page }) => {
    // Open modal
    await page.getByRole('button', { name: /異議申立てを提出/ }).click();
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // i18n: confirm.cancelButton = "キャンセル"
    // There are multiple "キャンセル" buttons, get the one inside dialog
    await page.locator('[role="dialog"]').getByRole('button', { name: 'キャンセル' }).click();

    // Modal should be hidden
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
      await page.goto('/en/observer/challenge/new');

      // i18n EN: challenge.pageTitle = "Submit Dispute"
      await expect(page.locator('h1')).toContainText('Submit Dispute');
      // i18n EN: targetTransaction.title = "Target Transaction"
      await expect(page.getByText('Target Transaction')).toBeVisible();
      // i18n EN: evidence.title = "Evidence & Reason"
      await expect(page.getByText('Evidence & Reason')).toBeVisible();
    });
  });
});
