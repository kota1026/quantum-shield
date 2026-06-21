import { test, expect } from '@playwright/test';

/**
 * Consumer App Emergency Bond E2E Tests
 * Tests for Screen 14: Emergency Unlock Bond
 */

test.describe('Consumer Emergency Bond', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ja/consumer/emergency-bond');
  });

  test.describe('Page Load & Layout', () => {
    test('should display emergency bond page correctly', async ({ page }) => {
      await expect(page).toHaveTitle(/緊急Unlock/);

      // Check back button and title
      await expect(page.getByRole('link', { name: /戻る/i })).toBeVisible();
      await expect(page.getByRole('heading', { name: /緊急Unlock/i })).toBeVisible();
    });

    test('should display warning banner', async ({ page }) => {
      const warning = page.getByRole('alert');
      await expect(warning).toBeVisible();
      await expect(warning.getByText(/7日間の待機期間/)).toBeVisible();
    });
  });

  test.describe('Bond Information', () => {
    test('should display bond card with title', async ({ page }) => {
      await expect(page.getByText('Bond（保証金）について')).toBeVisible();
    });

    test('should show unlock amount', async ({ page }) => {
      await expect(page.getByText('Unlock金額')).toBeVisible();
      await expect(page.getByText('10.00 ETH')).toBeVisible();
    });

    test('should show wait time', async ({ page }) => {
      await expect(page.getByText('待機時間')).toBeVisible();
      await expect(page.getByText('7日間')).toBeVisible();
    });

    test('should display bond calculation formula', async ({ page }) => {
      await expect(page.getByText(/Bond = MAX\(0.5 ETH/)).toBeVisible();
    });

    test('should show required bond amount', async ({ page }) => {
      await expect(page.getByText('必要なBond')).toBeVisible();
      await expect(page.getByText('0.50 ETH')).toBeVisible();
    });

    test('should display info list items', async ({ page }) => {
      await expect(page.getByText(/Bondは7日間の待機期間後/)).toBeVisible();
      await expect(page.getByText(/不正なUnlockの場合/)).toBeVisible();
      await expect(page.getByText(/緊急Unlockは秘密鍵紛失時/)).toBeVisible();
    });
  });

  test.describe('Confirmation Checkbox', () => {
    test('should display confirmation checkbox', async ({ page }) => {
      const checkbox = page.getByRole('checkbox');
      await expect(checkbox).toBeVisible();
      await expect(checkbox).not.toBeChecked();
    });

    test('submit button should be disabled initially', async ({ page }) => {
      const submitButton = page.getByRole('button', { name: /緊急Unlockを開始/i });
      await expect(submitButton).toBeDisabled();
    });

    test('checking checkbox should enable submit button', async ({ page }) => {
      const checkbox = page.getByRole('checkbox');
      await checkbox.check();

      const submitButton = page.getByRole('button', { name: /緊急Unlockを開始/i });
      await expect(submitButton).toBeEnabled();
    });

    test('unchecking checkbox should disable submit button', async ({ page }) => {
      const checkbox = page.getByRole('checkbox');
      await checkbox.check();
      await checkbox.uncheck();

      const submitButton = page.getByRole('button', { name: /緊急Unlockを開始/i });
      await expect(submitButton).toBeDisabled();
    });
  });

  test.describe('Action Buttons', () => {
    test('should display cancel button', async ({ page }) => {
      const cancelButton = page.getByRole('link', { name: /キャンセル/i });
      await expect(cancelButton).toBeVisible();
      await expect(cancelButton).toHaveAttribute('href', '/consumer/unlock');
    });

    test('should display submit button', async ({ page }) => {
      const submitButton = page.getByRole('button', { name: /緊急Unlockを開始/i });
      await expect(submitButton).toBeVisible();
    });
  });

  test.describe('Navigation', () => {
    test('back button should navigate to unlock page', async ({ page }) => {
      const backButton = page.getByRole('link', { name: /戻る/i });
      await expect(backButton).toHaveAttribute('href', '/consumer/unlock');
    });

    test('cancel button should navigate to unlock page', async ({ page }) => {
      const cancelButton = page.getByRole('link', { name: /キャンセル/i });
      await expect(cancelButton).toHaveAttribute('href', '/consumer/unlock');
    });
  });

  test.describe('Form Submission', () => {
    test('should navigate to processing page on submit', async ({ page }) => {
      const checkbox = page.getByRole('checkbox');
      await checkbox.check();

      const submitButton = page.getByRole('button', { name: /緊急Unlockを開始/i });
      await submitButton.click();

      // Button should show loading state
      await expect(page.getByText(/処理中/)).toBeVisible();

      // Should navigate to processing page
      await page.waitForURL('**/emergency-processing');
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper focus management', async ({ page }) => {
      const checkbox = page.getByRole('checkbox');
      await checkbox.focus();
      await expect(checkbox).toBeFocused();
    });

    test('checkbox should have proper aria-describedby', async ({ page }) => {
      const checkbox = page.getByRole('checkbox');
      await expect(checkbox).toHaveAttribute('aria-describedby', 'confirm-label');
    });
  });

  test.describe('English Locale', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/en/consumer/emergency-bond');
    });

    test('should display English text', async ({ page }) => {
      await expect(page.getByText('About Bond (Collateral)')).toBeVisible();
      await expect(page.getByText('Unlock Amount')).toBeVisible();
      await expect(page.getByText('Wait Time')).toBeVisible();
      await expect(page.getByText('Required Bond')).toBeVisible();
      await expect(page.getByRole('button', { name: /Start Emergency Unlock/i })).toBeVisible();
    });
  });
});
