import { test, expect } from '@playwright/test';
import { gotoAndWaitForApp } from '../helpers/wait-for-app';

test.setTimeout(90000);

test.describe('Token Hub Lock', () => {
  test.beforeEach(async ({ page }) => {
    await gotoAndWaitForApp(page, '/ja/qs-hub/stake/lock');
  });

  test.describe('Page Load & Layout', () => {
    test('should display main content area', async ({ page }) => {
      await expect(page.getByRole('main')).toBeVisible();
    });

    test('should display page title', async ({ page }) => {
      await expect(page.getByText('QSを量子耐性ロックしてveQSを獲得')).toBeVisible();
    });

    test('should display header with navigation', async ({ page }) => {
      await expect(page.getByText('Quantum Shield').first()).toBeVisible();
      const nav = page.getByRole('navigation', { name: 'Token Hub ナビゲーション' });
      await expect(nav).toBeVisible();
    });
  });

  test.describe('Step Indicator', () => {
    test('should display step navigation', async ({ page }) => {
      const stepNav = page.getByRole('navigation', { name: 'ロックプロセスのステップ' });
      await expect(stepNav).toBeVisible();
    });

    test('should display all 3 steps', async ({ page }) => {
      await expect(page.getByText('入力')).toBeVisible();
      await expect(page.getByText('プレビュー').first()).toBeVisible();
      await expect(page.getByText('確認')).toBeVisible();
    });

    test('should show step 1 as current', async ({ page }) => {
      const currentStep = page.locator('[aria-current="step"]');
      await expect(currentStep).toBeVisible();
    });
  });

  test.describe('Amount Input', () => {
    test('should display amount label', async ({ page }) => {
      await expect(page.getByText('ロック数量')).toBeVisible();
    });

    test('should display amount input field', async ({ page }) => {
      const input = page.locator('#lock-amount');
      await expect(input).toBeVisible();
    });

    test('should display balance info', async ({ page }) => {
      await expect(page.getByText(/残高/)).toBeVisible();
    });

    test('should display MAX button', async ({ page }) => {
      await expect(page.getByText('MAX')).toBeVisible();
    });

    test('should display quick amount buttons', async ({ page }) => {
      await expect(page.getByText('25%')).toBeVisible();
      await expect(page.getByText('50%')).toBeVisible();
      await expect(page.getByText('75%')).toBeVisible();
      await expect(page.getByText('100%')).toBeVisible();
    });

    test('should allow entering amount', async ({ page }) => {
      const input = page.locator('#lock-amount');
      await input.fill('1000');
      await expect(input).toHaveValue(/1,000|1000/);
    });

    test('quick amount buttons should have aria-pressed', async ({ page }) => {
      const btn25 = page.getByRole('button', { name: '25%' });
      await expect(btn25).toHaveAttribute('aria-pressed');
    });
  });

  test.describe('Duration Selection', () => {
    test('should display duration label', async ({ page }) => {
      await expect(page.getByText('ロック期間').first()).toBeVisible();
    });

    test('should display duration options', async ({ page }) => {
      await expect(page.getByText('6ヶ月')).toBeVisible();
      await expect(page.getByText('1年')).toBeVisible();
      await expect(page.getByText('2年')).toBeVisible();
      await expect(page.getByText('4年')).toBeVisible();
    });

    test('should have radiogroup for duration', async ({ page }) => {
      const radiogroup = page.getByRole('radiogroup', { name: 'ロック期間を選択' });
      await expect(radiogroup).toBeVisible();
    });

    test('2Y should be selected by default', async ({ page }) => {
      const radio2Y = page.getByRole('radio', { checked: true });
      await expect(radio2Y).toBeVisible();
    });

    test('should allow selecting different duration', async ({ page }) => {
      const btn4Y = page.getByRole('radio').filter({ hasText: '4Y' });
      await btn4Y.click();
      await expect(btn4Y).toHaveAttribute('aria-checked', 'true');
    });
  });

  test.describe('Preview Box', () => {
    test('should display preview label', async ({ page }) => {
      await expect(page.getByText('獲得予定')).toBeVisible();
    });

    test('should have live region for calculation', async ({ page }) => {
      const liveRegion = page.locator('[role="status"][aria-live="polite"]');
      await expect(liveRegion).toBeVisible();
    });

    test('should update veQS when amount is entered', async ({ page }) => {
      const input = page.locator('#lock-amount');
      await input.fill('10000');
      await expect(page.getByText(/5,000 veQS/)).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Warning Notice', () => {
    test('should display lock warning', async ({ page }) => {
      const alert = page.getByRole('alert');
      await expect(alert).toBeVisible();
      await expect(page.getByText(/ロック期間中はトークンを引き出すことができません/)).toBeVisible();
    });
  });

  test.describe('Submit Button', () => {
    test('should display preview button', async ({ page }) => {
      const btn = page.getByRole('button', { name: 'ロック内容をプレビュー' });
      await expect(btn).toBeVisible();
    });

    test('preview button should be disabled when no amount', async ({ page }) => {
      const btn = page.getByRole('button', { name: 'ロック内容をプレビュー' });
      await expect(btn).toBeDisabled();
    });

    test('preview button should be enabled after entering amount', async ({ page }) => {
      const input = page.locator('#lock-amount');
      await input.fill('1000');
      const btn = page.getByRole('button', { name: 'ロック内容をプレビュー' });
      await expect(btn).toBeEnabled();
    });
  });

  test.describe('Footer', () => {
    test('should display footer links', async ({ page }) => {
      await expect(page.getByText('利用規約')).toBeVisible();
      await expect(page.getByText('プライバシーポリシー')).toBeVisible();
    });

    test('should display disclaimer', async ({ page }) => {
      await expect(page.getByText(/本サービスは投資助言ではありません/)).toBeVisible();
    });
  });

  test.describe('Help Tooltips', () => {
    test('should display amount help button', async ({ page }) => {
      const helpBtn = page.getByRole('button', { name: 'ロック数量についてのヘルプ' });
      await expect(helpBtn).toBeVisible();
    });

    test('should display duration help button', async ({ page }) => {
      const helpBtn = page.getByRole('button', { name: 'ロック期間についてのヘルプ' });
      await expect(helpBtn).toBeVisible();
    });
  });

  test.describe('Responsive Design', () => {
    test('should work on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await expect(page.getByRole('main')).toBeVisible();
      await expect(page.getByText('ロック数量')).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper ARIA attributes', async ({ page }) => {
      await expect(page.getByRole('main')).toBeVisible();
      await expect(page.getByRole('alert')).toBeVisible();
      await expect(page.locator('[role="radiogroup"]')).toBeVisible();
    });
  });
});
