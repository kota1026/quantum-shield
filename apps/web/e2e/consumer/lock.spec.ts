import { test, expect } from '@playwright/test';

/**
 * Consumer App Lock Page E2E Tests
 * Tests for Screen 05: Lock
 */

test.describe('Consumer Lock Page', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to lock page
    await page.goto('/ja/consumer/lock');
  });

  test.describe('Page Load & Layout', () => {
    test('should display lock page correctly', async ({ page }) => {
      // Check page title
      await expect(page).toHaveTitle(/ロック/);

      // Check main elements are visible
      await expect(page.getByRole('main')).toBeVisible();
    });

    test('should display header with back button', async ({ page }) => {
      // Check back button
      const backButton = page.getByRole('link', { name: /ダッシュボードに戻る/i });
      await expect(backButton).toBeVisible();

      // Check page title
      await expect(page.getByRole('heading', { name: /資産をロック/i })).toBeVisible();
    });

    test('should display hero section', async ({ page }) => {
      // Check badge (use .first() as it appears multiple times)
      await expect(page.locator('section').getByText('量子耐性保護').first()).toBeVisible();

      // Check hero title and subtitle
      await expect(page.getByRole('heading', { name: /あなたの資産を将来の脅威から守る/i })).toBeVisible();
    });

    test('should display Hinomary visual', async ({ page }) => {
      // The visual container has a specific structure
      await expect(page.locator('[class*="hinomary"]').first()).toBeVisible();
    });
  });

  test.describe('Lock Input Section', () => {
    test('should display lock amount input', async ({ page }) => {
      const input = page.getByRole('textbox');
      await expect(input).toBeVisible();

      // Check label
      await expect(page.getByText('ロックする金額を入力')).toBeVisible();

      // Check available balance
      await expect(page.getByText('利用可能残高')).toBeVisible();
      await expect(page.getByText('12.50 ETH')).toBeVisible();
    });

    test('should allow entering lock amount', async ({ page }) => {
      const input = page.getByRole('textbox');
      await input.fill('5.00');
      await expect(input).toHaveValue('5.00');
    });

    test('should only accept valid numeric input', async ({ page }) => {
      const input = page.getByRole('textbox');

      // Enter valid decimal
      await input.fill('10.5');
      await expect(input).toHaveValue('10.5');

      // Clear and enter invalid characters - they should be rejected
      await input.fill('');
      await input.type('abc');
      await expect(input).toHaveValue('');
    });

    test('should have quick amount buttons', async ({ page }) => {
      const quickButtons = page.getByRole('group', { name: /Quick amount selection/i });
      await expect(quickButtons).toBeVisible();

      // Check all buttons are present
      await expect(quickButtons.getByText('25%')).toBeVisible();
      await expect(quickButtons.getByText('50%')).toBeVisible();
      await expect(quickButtons.getByText('75%')).toBeVisible();
      await expect(quickButtons.getByText('最大')).toBeVisible();
    });

    test('quick amount buttons should set correct values', async ({ page }) => {
      const input = page.getByRole('textbox');

      // Click 25% button (should set to 3.13 based on 12.50 balance)
      await page.getByRole('button', { name: /Set to 25% of balance/i }).click();
      await expect(input).toHaveValue('3.13');

      // Click 50% button (should set to 6.25)
      await page.getByRole('button', { name: /Set to 50% of balance/i }).click();
      await expect(input).toHaveValue('6.25');

      // Click 75% button (should set to 9.38)
      await page.getByRole('button', { name: /Set to 75% of balance/i }).click();
      await expect(input).toHaveValue('9.38');

      // Click MAX button (should set to 12.50)
      await page.getByRole('button', { name: /Set to 100% of balance/i }).click();
      await expect(input).toHaveValue('12.50');
    });

    test('should display lock button', async ({ page }) => {
      const lockButton = page.getByRole('button', { name: /Dilithium署名で資産をロックする/i });
      await expect(lockButton).toBeVisible();
    });

    test('should display Dilithium tooltip', async ({ page }) => {
      // The Dilithium text should be visible below the button
      await expect(page.locator('p').filter({ hasText: /Dilithium/ })).toBeVisible();
    });
  });

  test.describe('Validation', () => {
    test('should show error when submitting empty amount', async ({ page }) => {
      // Click lock button without entering amount
      await page.getByRole('button', { name: /Dilithium署名で資産をロックする/i }).click();

      // Error should be displayed
      await expect(page.getByRole('alert')).toBeVisible();
      await expect(page.getByText('ロック金額を入力してください')).toBeVisible();
    });

    test('should show error for amount below minimum', async ({ page }) => {
      const input = page.getByRole('textbox');
      await input.fill('0.001');

      await page.getByRole('button', { name: /Dilithium署名で資産をロックする/i }).click();

      // Error should be displayed
      await expect(page.getByRole('alert')).toBeVisible();
      await expect(page.getByText('最低ロック金額は0.01 ETHです')).toBeVisible();
    });

    test('should show error for insufficient balance', async ({ page }) => {
      const input = page.getByRole('textbox');
      await input.fill('100.00');

      await page.getByRole('button', { name: /Dilithium署名で資産をロックする/i }).click();

      // Error should be displayed
      await expect(page.getByRole('alert')).toBeVisible();
      await expect(page.getByText('残高が不足しています')).toBeVisible();
    });

    test('should clear error when entering valid amount', async ({ page }) => {
      const input = page.getByRole('textbox');

      // Trigger error
      await page.getByRole('button', { name: /Dilithium署名で資産をロックする/i }).click();
      await expect(page.getByRole('alert')).toBeVisible();

      // Enter valid amount
      await input.fill('5.00');

      // Error should be cleared
      await expect(page.getByRole('alert')).not.toBeVisible();
    });
  });

  test.describe('Lock Modal', () => {
    test.beforeEach(async ({ page }) => {
      // Enter valid amount and open modal
      await page.getByRole('textbox').fill('5.00');
      await page.getByRole('button', { name: /Dilithium署名で資産をロックする/i }).click();
    });

    test('should display lock confirmation modal', async ({ page }) => {
      const modal = page.getByRole('dialog', { name: /ロック確認/i });
      await expect(modal).toBeVisible();
    });

    test('should display lock amount in modal', async ({ page }) => {
      const modal = page.getByRole('dialog', { name: /ロック確認/i });

      await expect(modal.getByText('ロック金額')).toBeVisible();
      await expect(modal.getByText('5.00 ETH')).toBeVisible();
    });

    test('should display gas fee in modal', async ({ page }) => {
      const modal = page.getByRole('dialog', { name: /ロック確認/i });

      await expect(modal.getByText('ガス代（概算）')).toBeVisible();
      await expect(modal.getByText('~0.005 ETH')).toBeVisible();
    });

    test('should have confirm and cancel buttons', async ({ page }) => {
      const modal = page.getByRole('dialog', { name: /ロック確認/i });

      await expect(modal.getByRole('button', { name: /署名してロック/i })).toBeVisible();
      await expect(modal.getByRole('button', { name: /キャンセル/i })).toBeVisible();
    });

    test('should close modal on cancel', async ({ page }) => {
      const modal = page.getByRole('dialog', { name: /ロック確認/i });

      await modal.getByRole('button', { name: /キャンセル/i }).click();
      await expect(modal).not.toBeVisible();
    });

    test('should close modal on X button', async ({ page }) => {
      const modal = page.getByRole('dialog', { name: /ロック確認/i });

      await modal.getByRole('button', { name: /Close modal/i }).click();
      await expect(modal).not.toBeVisible();
    });

    test('should close modal on Escape key', async ({ page }) => {
      const modal = page.getByRole('dialog', { name: /ロック確認/i });

      await page.keyboard.press('Escape');
      await expect(modal).not.toBeVisible();
    });

    test('should close modal on backdrop click', async ({ page }) => {
      // Click on backdrop (outside modal content)
      await page.locator('.fixed.inset-0').click({ position: { x: 10, y: 10 } });

      await expect(page.getByRole('dialog', { name: /ロック確認/i })).not.toBeVisible();
    });

    test('should navigate to processing page on confirm', async ({ page }) => {
      const modal = page.getByRole('dialog', { name: /ロック確認/i });

      await modal.getByRole('button', { name: /署名してロック/i }).click();

      // Should navigate to processing page
      await expect(page).toHaveURL(/\/consumer\/lock\/processing/);
    });
  });

  test.describe('Info Section', () => {
    test('should display info section', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /ロックについて/i })).toBeVisible();
    });

    test('should display quantum protection info', async ({ page }) => {
      // Use getByLabel to target the info section list
      const infoSection = page.getByLabel('ロックについて');
      await expect(infoSection.getByText('量子耐性保護')).toBeVisible();
      await expect(infoSection.getByText('NIST認定のDilithium暗号で資産を保護')).toBeVisible();
    });

    test('should display unlock info', async ({ page }) => {
      await expect(page.getByText('いつでもアンロック可能')).toBeVisible();
      await expect(page.getByText('24時間の待機期間後に資産を取り出せます')).toBeVisible();
    });

    test('should display fee info', async ({ page }) => {
      await expect(page.getByText('手数料')).toBeVisible();
      await expect(page.getByText(/ガス代のみ/)).toBeVisible();
    });
  });

  test.describe('Navigation', () => {
    test('back button should navigate to dashboard', async ({ page }) => {
      const backButton = page.getByRole('link', { name: /ダッシュボードに戻る/i });
      await backButton.click();

      await expect(page).toHaveURL(/\/consumer\/dashboard/);
    });
  });

  test.describe('Responsive Design', () => {
    test('should display correctly on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      // Main elements should still be visible
      await expect(page.getByRole('textbox')).toBeVisible();
      await expect(page.getByRole('button', { name: /Dilithium署名で資産をロックする/i })).toBeVisible();
    });

    test('should display correctly on tablet', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });

      // Main elements should still be visible
      await expect(page.getByRole('textbox')).toBeVisible();
      await expect(page.getByRole('button', { name: /Dilithium署名で資産をロックする/i })).toBeVisible();
    });
  });

  test.describe('Keyboard Navigation', () => {
    test('should navigate with keyboard', async ({ page }) => {
      // Tab to input
      await page.keyboard.press('Tab'); // back button
      await page.keyboard.press('Tab'); // badge tooltip
      await page.keyboard.press('Tab'); // input

      const input = page.getByRole('textbox');
      await expect(input).toBeFocused();
    });

    test('input should accept keyboard input', async ({ page }) => {
      const input = page.getByRole('textbox');
      await input.focus();
      await page.keyboard.type('10.5');
      await expect(input).toHaveValue('10.5');
    });

    test('modal should trap focus', async ({ page }) => {
      // Open modal
      await page.getByRole('textbox').fill('5.00');
      await page.getByRole('button', { name: /Dilithium署名で資産をロックする/i }).click();

      const modal = page.getByRole('dialog', { name: /ロック確認/i });
      await expect(modal).toBeVisible();

      // Tab should cycle within modal
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');

      // Should still be in modal
      const activeElement = await page.evaluate(() => document.activeElement?.tagName);
      expect(activeElement).toBe('BUTTON');
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper ARIA labels', async ({ page }) => {
      // Check important ARIA elements exist
      await expect(page.getByRole('main')).toBeVisible();
      await expect(page.getByRole('group', { name: /Quick amount selection/i })).toBeVisible();
    });

    test('error message should have alert role', async ({ page }) => {
      // Trigger error
      await page.getByRole('button', { name: /Dilithium署名で資産をロックする/i }).click();

      // Error should have alert role
      await expect(page.getByRole('alert')).toBeVisible();
    });

    test('input should have aria-invalid when error', async ({ page }) => {
      const input = page.getByRole('textbox');

      // Trigger error
      await page.getByRole('button', { name: /Dilithium署名で資産をロックする/i }).click();

      // Input should have aria-invalid
      await expect(input).toHaveAttribute('aria-invalid', 'true');
    });
  });

  test.describe('English Locale', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/en/consumer/lock');
    });

    test('should display English text', async ({ page }) => {
      await expect(page.getByText('Quantum Protected')).toBeVisible();
      await expect(page.getByText('Protect Your Assets from Future Threats')).toBeVisible();
      await expect(page.getByText('Available Balance')).toBeVisible();
      await expect(page.getByText('Lock with Dilithium Signature')).toBeVisible();
    });

    test('should display English info section', async ({ page }) => {
      await expect(page.getByText('About Locking')).toBeVisible();
      await expect(page.getByText('Quantum Protection')).toBeVisible();
      await expect(page.getByText('Unlock Anytime')).toBeVisible();
    });

    test('should show English validation messages', async ({ page }) => {
      // Trigger error - button aria-label is "Lock assets with Dilithium signature"
      await page.getByRole('button', { name: /Lock assets with Dilithium signature/i }).click();

      await expect(page.getByText('Please enter an amount to lock')).toBeVisible();
    });
  });
});
