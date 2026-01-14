import { test, expect } from '@playwright/test';

/**
 * Consumer App Unlock E2E Tests
 * Tests for Screen 04: Unlock
 */

test.describe('Consumer Unlock', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ja/consumer/unlock');
  });

  test.describe('Page Load & Layout', () => {
    test('should display unlock page correctly', async ({ page }) => {
      await expect(page).toHaveTitle(/アンロック/);

      // Check back button and title
      await expect(page.getByRole('link', { name: /戻る/i })).toBeVisible();
      await expect(page.getByRole('heading', { name: /アンロック/i })).toBeVisible();
    });

    test('should have section labels', async ({ page }) => {
      await expect(page.getByText('アンロックするロックを選択')).toBeVisible();
      await expect(page.getByText('アンロック方法を選択')).toBeVisible();
    });
  });

  test.describe('Lock Selection', () => {
    test('should display lock cards', async ({ page }) => {
      const lockGroup = page.getByRole('radiogroup', { name: /アンロックするロックを選択/i });
      await expect(lockGroup).toBeVisible();

      // Check for lock items
      await expect(page.getByText('ロック #1')).toBeVisible();
      await expect(page.getByText('ロック #2')).toBeVisible();
      await expect(page.getByText('ロック #3')).toBeVisible();
    });

    test('should display lock amounts', async ({ page }) => {
      await expect(page.getByText('10.00 ETH')).toBeVisible();
      await expect(page.getByText('5.00 ETH')).toBeVisible();
      await expect(page.getByText('2.50 ETH')).toBeVisible();
    });

    test('should show lock statuses', async ({ page }) => {
      await expect(page.getByText('ロック中')).toHaveCount(2);
      await expect(page.getByText('アンロック中')).toBeVisible();
    });

    test('first lock should be selected by default', async ({ page }) => {
      const firstLock = page.locator('[role="radio"]').first();
      await expect(firstLock).toHaveAttribute('aria-checked', 'true');
    });

    test('should allow selecting different locks', async ({ page }) => {
      const secondLock = page.getByText('ロック #2').locator('..');
      await secondLock.click();

      // Verify selection changed
      const lockCards = page.locator('[role="radio"]');
      await expect(lockCards.nth(0)).toHaveAttribute('aria-checked', 'false');
      await expect(lockCards.nth(1)).toHaveAttribute('aria-checked', 'true');
    });
  });

  test.describe('Method Selection', () => {
    test('should display method cards', async ({ page }) => {
      const methodGroup = page.getByRole('radiogroup', { name: /アンロック方法を選択/i });
      await expect(methodGroup).toBeVisible();

      await expect(page.getByText('通常アンロック')).toBeVisible();
      await expect(page.getByText('緊急アンロック')).toBeVisible();
    });

    test('normal method should be selected by default', async ({ page }) => {
      // Button should say normal unlock
      await expect(page.getByRole('button', { name: /通常アンロックを開始/i })).toBeVisible();
    });

    test('should show method details', async ({ page }) => {
      // Normal method details
      await expect(page.getByText('待機時間')).toBeVisible();
      await expect(page.getByText('24時間')).toBeVisible();
      await expect(page.getByText('Dilithium秘密鍵')).toBeVisible();

      // Emergency method details
      await expect(page.getByText('7日間')).toBeVisible();
      await expect(page.getByText('MAX(0.5 ETH, 金額×5%)')).toBeVisible();
    });

    test('should show Time Lock help link', async ({ page }) => {
      await expect(page.getByText('なぜ24時間待つの？')).toBeVisible();
    });

    test('should show Time Lock explanation box', async ({ page }) => {
      await expect(page.getByText('Time Lockはあなたを守ります')).toBeVisible();
    });

    test('selecting emergency shows warning', async ({ page }) => {
      // Click emergency method
      await page.getByText('緊急アンロック').click();

      // Warning should appear
      const warning = page.getByRole('alert');
      await expect(warning).toBeVisible();
      await expect(warning.getByText('緊急アンロックの注意事項')).toBeVisible();

      // Button should change
      await expect(page.getByRole('button', { name: /緊急アンロックを開始/i })).toBeVisible();
    });
  });

  test.describe('Time Lock Modal', () => {
    test('should open Time Lock modal', async ({ page }) => {
      await page.getByText('なぜ24時間待つの？').click();

      const modal = page.getByRole('dialog');
      await expect(modal).toBeVisible();
      await expect(modal.getByRole('heading', { name: /なぜ24時間待つの？/i })).toBeVisible();
    });

    test('modal should have explanations', async ({ page }) => {
      await page.getByText('なぜ24時間待つの？').click();

      const modal = page.getByRole('dialog');
      await expect(modal.getByText(/Time Lockが守るもの/)).toBeVisible();
      await expect(modal.getByText(/待機中にできること/)).toBeVisible();
      await expect(modal.getByText(/豆知識/)).toBeVisible();
    });

    test('should close modal with understand button', async ({ page }) => {
      await page.getByText('なぜ24時間待つの？').click();

      const modal = page.getByRole('dialog');
      await modal.getByRole('button', { name: /理解しました/i }).click();

      await expect(modal).not.toBeVisible();
    });

    test('should close modal with X button', async ({ page }) => {
      await page.getByText('なぜ24時間待つの？').click();

      const modal = page.getByRole('dialog');
      await modal.getByRole('button', { name: /Close modal/i }).click();

      await expect(modal).not.toBeVisible();
    });
  });

  test.describe('Navigation', () => {
    test('back button should navigate to dashboard', async ({ page }) => {
      const backButton = page.getByRole('link', { name: /戻る/i });
      await expect(backButton).toHaveAttribute('href', '/consumer/dashboard');
    });
  });

  test.describe('Keyboard Navigation', () => {
    test('should navigate locks with keyboard', async ({ page }) => {
      const firstLock = page.locator('[role="radio"]').first();
      await firstLock.focus();

      // Press Enter to select
      await page.keyboard.press('Enter');
      await expect(firstLock).toHaveAttribute('aria-checked', 'true');
    });

    test('should navigate methods with keyboard', async ({ page }) => {
      const methodCards = page.getByRole('radiogroup', { name: /アンロック方法を選択/i })
        .locator('[role="radio"]');

      await methodCards.nth(1).focus();
      await page.keyboard.press('Space');

      // Emergency warning should appear
      await expect(page.getByRole('alert')).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper ARIA labels', async ({ page }) => {
      // Radiogroups
      await expect(page.getByRole('radiogroup', { name: /アンロックするロックを選択/i })).toBeVisible();
      await expect(page.getByRole('radiogroup', { name: /アンロック方法を選択/i })).toBeVisible();
    });

    test('modal should trap focus', async ({ page }) => {
      await page.getByText('なぜ24時間待つの？').click();

      const modal = page.getByRole('dialog');
      await expect(modal).toBeVisible();

      // Escape should close
      await page.keyboard.press('Escape');
      await expect(modal).not.toBeVisible();
    });
  });

  test.describe('English Locale', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/en/consumer/unlock');
    });

    test('should display English text', async ({ page }) => {
      await expect(page.getByText('Select Lock to Unlock')).toBeVisible();
      await expect(page.getByText('Select Unlock Method')).toBeVisible();
      await expect(page.getByText('Normal Unlock')).toBeVisible();
      await expect(page.getByText('Emergency Unlock')).toBeVisible();
      await expect(page.getByText('Why wait 24 hours?')).toBeVisible();
    });
  });
});
