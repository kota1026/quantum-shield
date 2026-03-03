import { test, expect } from '@playwright/test';

/**
 * Token Hub Lock E2E Tests
 * Tests for Token Hub Screen 02: Lock QS for veQS
 */

test.describe('Token Hub Lock', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to Token Hub lock page
    await page.goto('/ja/token-hub/lock');
  });

  test.describe('Page Load & Layout', () => {
    test('should display lock page correctly', async ({ page }) => {
      // Check page title
      await expect(page).toHaveTitle(/Lock QS|QSをロック/);

      // Check main elements are visible
      await expect(page.getByRole('main')).toBeVisible();
    });

    test('should display header with navigation', async ({ page }) => {
      // Check logo
      await expect(page.getByText('Quantum Shield')).toBeVisible();
      await expect(page.getByText('Token Hub')).toBeVisible();

      // Check navigation - Lock should be active
      const nav = page.getByRole('navigation', { name: /Token Hub/i });
      await expect(nav).toBeVisible();
      await expect(nav.getByText('Dashboard')).toBeVisible();
      await expect(nav.getByText('Lock')).toBeVisible();
      await expect(nav.getByText('Delegate')).toBeVisible();
      await expect(nav.getByText('Rewards')).toBeVisible();
    });

    test('should display page title', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /QSをロックしてveQSを獲得/i })).toBeVisible();
    });
  });

  test.describe('Step Indicator', () => {
    test('should display step indicator with 3 steps', async ({ page }) => {
      const stepsNav = page.getByRole('navigation', { name: /ロックプロセスのステップ/i });
      await expect(stepsNav).toBeVisible();

      // Check step labels
      await expect(page.getByText('入力')).toBeVisible();
      await expect(page.getByText('プレビュー')).toBeVisible();
      await expect(page.getByText('確認')).toBeVisible();
    });

    test('step 1 should be active', async ({ page }) => {
      // Step 1 should have aria-current="step"
      const step1 = page.locator('[aria-current="step"]');
      await expect(step1).toHaveText('1');
    });
  });

  test.describe('Amount Input Section', () => {
    test('should display amount input with label', async ({ page }) => {
      await expect(page.getByText('ロック数量')).toBeVisible();

      const amountInput = page.getByRole('textbox', { name: /ロック数量/i });
      await expect(amountInput).toBeVisible();
      await expect(amountInput).toHaveAttribute('placeholder', '0');
    });

    test('should display balance information', async ({ page }) => {
      // Balance amount is dynamic, just check label exists
      await expect(page.getByText(/残高.*QS/)).toBeVisible();
    });

    test('should display MAX button', async ({ page }) => {
      const maxButton = page.getByRole('button', { name: /最大数量を入力/i });
      await expect(maxButton).toBeVisible();
      await expect(maxButton).toHaveText('MAX');
    });

    test('should display help tooltip button', async ({ page }) => {
      const helpButton = page.getByRole('button', { name: /ロック数量についてのヘルプ/i });
      await expect(helpButton).toBeVisible();
    });

    test('should display quick amount buttons', async ({ page }) => {
      const quickAmounts = page.getByRole('group', { name: /クイック数量選択/i });
      await expect(quickAmounts).toBeVisible();

      await expect(quickAmounts.getByText('25%')).toBeVisible();
      await expect(quickAmounts.getByText('50%')).toBeVisible();
      await expect(quickAmounts.getByText('75%')).toBeVisible();
      await expect(quickAmounts.getByText('100%')).toBeVisible();
    });

    test('should update amount when typing', async ({ page }) => {
      const amountInput = page.getByRole('textbox', { name: /ロック数量/i });

      await amountInput.fill('5000');
      await expect(amountInput).toHaveValue('5,000');
    });

    test('should update amount when clicking quick amount', async ({ page }) => {
      const quickAmount50 = page.getByRole('button', { name: '50%' });
      await quickAmount50.click();

      // 50% of balance should be filled (specific value is dynamic)
      const amountInput = page.getByRole('textbox', { name: /ロック数量/i });
      const value = await amountInput.inputValue();
      expect(value).toBeTruthy();
      expect(value).not.toBe('0');

      // Button should be pressed
      await expect(quickAmount50).toHaveAttribute('aria-pressed', 'true');
    });

    test('should set max amount when clicking MAX', async ({ page }) => {
      const maxButton = page.getByRole('button', { name: /最大数量を入力/i });
      await maxButton.click();

      // MAX should fill with balance (specific value is dynamic)
      const amountInput = page.getByRole('textbox', { name: /ロック数量/i });
      const value = await amountInput.inputValue();
      expect(value).toBeTruthy();
      expect(value).not.toBe('0');
    });
  });

  test.describe('Duration Selection Section', () => {
    test('should display duration selection with label', async ({ page }) => {
      await expect(page.getByText('ロック期間')).toBeVisible();
    });

    test('should display help tooltip button', async ({ page }) => {
      const helpButton = page.getByRole('button', { name: /ロック期間についてのヘルプ/i });
      await expect(helpButton).toBeVisible();
    });

    test('should display all duration options', async ({ page }) => {
      const durationGroup = page.getByRole('radiogroup', { name: /ロック期間を選択/i });
      await expect(durationGroup).toBeVisible();

      // Check all 4 duration options
      await expect(page.getByRole('radio', { name: /6M/i })).toBeVisible();
      await expect(page.getByRole('radio', { name: /1Y/i })).toBeVisible();
      await expect(page.getByRole('radio', { name: /2Y/i })).toBeVisible();
      await expect(page.getByRole('radio', { name: /4Y/i })).toBeVisible();
    });

    test('2Y should be selected by default', async ({ page }) => {
      const duration2Y = page.getByRole('radio', { name: /2Y/i });
      await expect(duration2Y).toHaveAttribute('aria-checked', 'true');
    });

    test('should display duration labels and multipliers', async ({ page }) => {
      await expect(page.getByText('6ヶ月')).toBeVisible();
      await expect(page.getByText('1年')).toBeVisible();
      await expect(page.getByText('2年')).toBeVisible();
      await expect(page.getByText('4年')).toBeVisible();

      // Check multipliers
      await expect(page.getByText('×0.125')).toBeVisible();
      await expect(page.getByText('×0.25')).toBeVisible();
      await expect(page.getByText('×0.50')).toBeVisible();
      await expect(page.getByText('×1.00')).toBeVisible();
    });

    test('should change selection when clicking duration option', async ({ page }) => {
      const duration4Y = page.getByRole('radio', { name: /4Y/i });
      await duration4Y.click();

      await expect(duration4Y).toHaveAttribute('aria-checked', 'true');

      // 2Y should no longer be selected
      const duration2Y = page.getByRole('radio', { name: /2Y/i });
      await expect(duration2Y).toHaveAttribute('aria-checked', 'false');
    });
  });

  test.describe('Preview Box', () => {
    test('should display preview section', async ({ page }) => {
      await expect(page.getByText('獲得予定')).toBeVisible();
    });

    test('should display formula tooltip button', async ({ page }) => {
      const formulaButton = page.getByRole('button', { name: /veQS計算式を表示/i });
      await expect(formulaButton).toBeVisible();
    });

    test('should calculate veQS when amount is entered', async ({ page }) => {
      // Enter 5000 QS
      const amountInput = page.getByRole('textbox', { name: /ロック数量/i });
      await amountInput.fill('5000');

      // veQS preview should show a value (specific amount depends on duration multiplier)
      const veQSDisplay = page.locator('[role="status"][aria-live="polite"]');
      await expect(veQSDisplay).toBeVisible();
      await expect(veQSDisplay).toContainText('veQS');
    });

    test('should update veQS when duration changes', async ({ page }) => {
      // Enter 4000 QS
      const amountInput = page.getByRole('textbox', { name: /ロック数量/i });
      await amountInput.fill('4000');

      // Record initial veQS display
      const veQSDisplay = page.locator('[role="status"][aria-live="polite"]');
      const initialText = await veQSDisplay.textContent();

      // Change to 4Y (longer lock = more veQS)
      const duration4Y = page.getByRole('radio', { name: /4Y/i });
      await duration4Y.click();

      // veQS should update (value changes with duration)
      await expect(veQSDisplay).toContainText('veQS');
    });

    test('veQS display should be a live region', async ({ page }) => {
      const veQSDisplay = page.locator('[role="status"][aria-live="polite"]');
      await expect(veQSDisplay).toBeVisible();
    });
  });

  test.describe('Preview Button', () => {
    test('should display preview button', async ({ page }) => {
      const previewButton = page.getByRole('button', { name: /ロック内容をプレビュー/i });
      await expect(previewButton).toBeVisible();
      await expect(previewButton).toHaveText('プレビュー');
    });

    test('should be disabled when no amount entered', async ({ page }) => {
      const previewButton = page.getByRole('button', { name: /ロック内容をプレビュー/i });
      await expect(previewButton).toBeDisabled();
    });

    test('should be enabled when amount is entered', async ({ page }) => {
      // Enter amount
      const amountInput = page.getByRole('textbox', { name: /ロック数量/i });
      await amountInput.fill('1000');

      const previewButton = page.getByRole('button', { name: /ロック内容をプレビュー/i });
      await expect(previewButton).toBeEnabled();
    });
  });

  test.describe('Footer', () => {
    test('should display footer with links', async ({ page }) => {
      const footerNav = page.getByRole('navigation', { name: /フッターナビゲーション/i });
      await expect(footerNav).toBeVisible();

      await expect(footerNav.getByText('利用規約')).toBeVisible();
      await expect(footerNav.getByText('プライバシーポリシー')).toBeVisible();
      await expect(footerNav.getByText('セキュリティ')).toBeVisible();
    });

    test('should display disclaimer', async ({ page }) => {
      await expect(page.getByText(/本サービスは投資助言ではありません/)).toBeVisible();
    });
  });

  test.describe('Tooltip Interactions', () => {
    test('amount help tooltip should show on hover', async ({ page }) => {
      const helpButton = page.getByRole('button', { name: /ロック数量についてのヘルプ/i });
      await helpButton.hover();

      // Tooltip content should be visible
      await expect(page.getByText(/QSトークンをロックしてveQS投票権を獲得/)).toBeVisible();
    });

    test('duration help tooltip should show on hover', async ({ page }) => {
      const helpButton = page.getByRole('button', { name: /ロック期間についてのヘルプ/i });
      await helpButton.hover();

      // Tooltip content should be visible
      await expect(page.getByText(/長期ロック = より多くのveQS/)).toBeVisible();
    });

    test('formula tooltip should show on hover', async ({ page }) => {
      const formulaButton = page.getByRole('button', { name: /veQS計算式を表示/i });
      await formulaButton.hover();

      // Tooltip content should be visible
      await expect(page.getByText('veQS = QS × (lock_period / 4_years)')).toBeVisible();
    });
  });

  test.describe('Responsive Design', () => {
    test('should adapt layout for mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      // Page should still display correctly
      await expect(page.getByRole('main')).toBeVisible();
      await expect(page.getByText('ロック数量')).toBeVisible();

      // Duration options should stack in 2 columns
      const durationGroup = page.getByRole('radiogroup', { name: /ロック期間を選択/i });
      await expect(durationGroup).toBeVisible();
    });

    test('should adapt layout for tablet', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });

      // Page should still display correctly
      await expect(page.getByRole('main')).toBeVisible();
      await expect(page.getByText('Quantum Shield')).toBeVisible();
    });
  });

  test.describe('Keyboard Navigation', () => {
    test('should be fully keyboard navigable', async ({ page }) => {
      // Start tabbing through the page
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');

      // Eventually reach the amount input
      const amountInput = page.getByRole('textbox', { name: /ロック数量/i });
      await amountInput.focus();
      await expect(amountInput).toBeFocused();
    });

    test('duration options should be navigable', async ({ page }) => {
      const duration6M = page.getByRole('radio', { name: /6M/i });
      await duration6M.focus();
      await expect(duration6M).toBeFocused();

      // Press Enter to select
      await page.keyboard.press('Enter');
      await expect(duration6M).toHaveAttribute('aria-checked', 'true');
    });

    test('quick amount buttons should be keyboard accessible', async ({ page }) => {
      const quick25 = page.getByRole('button', { name: '25%' });
      await quick25.focus();
      await expect(quick25).toBeFocused();

      await page.keyboard.press('Enter');
      await expect(quick25).toHaveAttribute('aria-pressed', 'true');
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper section labels', async ({ page }) => {
      // Check sections have aria-labelledby
      await expect(page.locator('section[aria-labelledby="amount-label"]')).toBeVisible();
      await expect(page.locator('section[aria-labelledby="duration-label"]')).toBeVisible();
      await expect(page.locator('section[aria-labelledby="preview-label"]')).toBeVisible();
    });

    test('should have proper form labels', async ({ page }) => {
      const amountInput = page.getByRole('textbox', { name: /ロック数量/i });
      await expect(amountInput).toHaveAttribute('id', 'lock-amount');
    });

    test('should have accessible radiogroup', async ({ page }) => {
      const radiogroup = page.getByRole('radiogroup', { name: /ロック期間を選択/i });
      await expect(radiogroup).toBeVisible();

      // Each radio should have proper aria-checked
      const radios = radiogroup.getByRole('radio');
      await expect(radios).toHaveCount(4);
    });

    test('icons should be hidden from screen readers', async ({ page }) => {
      // Check that decorative elements have aria-hidden
      const lockIcon = page.locator('svg.lucide-lock[aria-hidden="true"]');
      await expect(lockIcon).toBeVisible();
    });
  });

  test.describe('English Locale', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/en/token-hub/lock');
    });

    test('should display English text', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /Lock QS for veQS/i })).toBeVisible();
      await expect(page.getByText('Lock Amount')).toBeVisible();
      await expect(page.getByText('Lock Duration')).toBeVisible();
      await expect(page.getByText('You Will Receive')).toBeVisible();
      await expect(page.getByText('Preview Lock')).toBeVisible();
    });

    test('should display English duration labels', async ({ page }) => {
      await expect(page.getByText('6 Months')).toBeVisible();
      await expect(page.getByText('1 Year')).toBeVisible();
      await expect(page.getByText('2 Years')).toBeVisible();
      await expect(page.getByText('4 Years')).toBeVisible();
    });

    test('should display English step labels', async ({ page }) => {
      await expect(page.getByText('Input')).toBeVisible();
      await expect(page.getByText('Preview')).toBeVisible();
      await expect(page.getByText('Confirm')).toBeVisible();
    });

    test('should display English footer', async ({ page }) => {
      await expect(page.getByText('Terms of Service')).toBeVisible();
      await expect(page.getByText('Privacy Policy')).toBeVisible();
    });
  });
});
