import { test, expect } from '@playwright/test';

/**
 * QS Admin Onboarding E2E Tests
 * Tests for Screen 03: Staff Onboarding Wizard
 */

test.describe('QS Admin Onboarding', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to onboarding page
    await page.goto('/ja/admin/onboarding');
  });

  test.describe('Page Load & Layout', () => {
    test('should display onboarding page correctly', async ({ page }) => {
      // Check page title
      await expect(page).toHaveTitle(/Staff Onboarding.*QS Admin/);

      // Check main element is visible
      await expect(page.getByRole('main')).toBeVisible();
    });

    test('should display welcome step initially', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'Welcome to QS Admin', level: 1 })).toBeVisible();
      await expect(page.getByText(/Quantum Shield 管理システムへようこそ/)).toBeVisible();
    });

    test('should display progress indicator', async ({ page }) => {
      const navigation = page.getByRole('navigation');
      await expect(navigation).toBeVisible();

      // Should have 5 step buttons
      const stepButtons = page.getByRole('button', { name: /ステップ \d/ });
      await expect(stepButtons).toHaveCount(5);
    });
  });

  test.describe('Welcome Step', () => {
    test('should display user greeting', async ({ page }) => {
      await expect(page.getByText(/こんにちは、Katoさん/)).toBeVisible();
    });

    test('should display role upgrade badge', async ({ page }) => {
      await expect(page.getByText(/Viewer → Operator/)).toBeVisible();
    });

    test('should display start button', async ({ page }) => {
      await expect(page.getByRole('button', { name: /Start Onboarding/i })).toBeVisible();
    });

    test('should navigate to overview step on start button click', async ({ page }) => {
      await page.getByRole('button', { name: /Start Onboarding/i }).click();
      await expect(page.getByRole('heading', { name: /Quantum Shield Overview/i })).toBeVisible();
    });
  });

  test.describe('Overview Step', () => {
    test.beforeEach(async ({ page }) => {
      await page.getByRole('button', { name: /Start Onboarding/i }).click();
    });

    test('should display all 4 system cards', async ({ page }) => {
      await expect(page.getByText('Consumer App')).toBeVisible();
      await expect(page.getByText('Prover Network')).toBeVisible();
      await expect(page.getByText('Governance')).toBeVisible();
      await expect(page.getByText('QS Admin')).toBeVisible();
    });

    test('should display system descriptions', async ({ page }) => {
      await expect(page.getByText(/Dilithium署名で量子耐性/)).toBeVisible();
      await expect(page.getByText(/SPHINCS\+署名でUnlockを承認/)).toBeVisible();
    });

    test('should display back button', async ({ page }) => {
      await expect(page.getByRole('button', { name: /Back/i })).toBeVisible();
    });

    test('should navigate back to welcome step', async ({ page }) => {
      await page.getByRole('button', { name: /Back/i }).click();
      await expect(page.getByRole('heading', { name: 'Welcome to QS Admin' })).toBeVisible();
    });
  });

  test.describe('Core Principles Step', () => {
    test.beforeEach(async ({ page }) => {
      await page.getByRole('button', { name: /Start Onboarding/i }).click();
      await page.getByRole('button', { name: /Next/i }).click();
    });

    test('should display principles header', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /Core Principles/i })).toBeVisible();
      await expect(page.getByText(/5つの不変原則/)).toBeVisible();
    });

    test('should display all 5 core principles', async ({ page }) => {
      await expect(page.getByText(/完全量子耐性.*Quantum Resistance/)).toBeVisible();
      await expect(page.getByText(/Self-Custody/)).toBeVisible();
      await expect(page.getByText(/Time Lock存在/)).toBeVisible();
      await expect(page.getByText(/Slashing存在/)).toBeVisible();
      await expect(page.getByText(/透明性.*Transparency/)).toBeVisible();
    });

    test('should display CP tags', async ({ page }) => {
      await expect(page.getByText('CP-1')).toBeVisible();
      await expect(page.getByText('CP-2')).toBeVisible();
      await expect(page.getByText('CP-3')).toBeVisible();
      await expect(page.getByText('CP-4')).toBeVisible();
      await expect(page.getByText('CP-5')).toBeVisible();
    });
  });

  test.describe('Emergency Procedures Step', () => {
    test.beforeEach(async ({ page }) => {
      // Navigate to step 4 (Emergency)
      await page.getByRole('button', { name: /Start Onboarding/i }).click();
      await page.getByRole('button', { name: /Next/i }).click();
      await page.getByRole('button', { name: /Next/i }).click();
    });

    test('should display emergency procedures header', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /Emergency Procedures/i })).toBeVisible();
      await expect(page.getByText(/緊急時の対応手順/)).toBeVisible();
    });

    test('should display all 5 procedure steps', async ({ page }) => {
      await expect(page.getByText(/異常を検知したら/)).toBeVisible();
      await expect(page.getByText(/状況を記録/)).toBeVisible();
      await expect(page.getByText(/Pause判断/)).toBeVisible();
      await expect(page.getByText(/復旧作業/)).toBeVisible();
      await expect(page.getByText(/ポストモーテム/)).toBeVisible();
    });

    test('should display step descriptions', async ({ page }) => {
      await expect(page.getByText(/まず上長.*報告/)).toBeVisible();
      await expect(page.getByText(/Slack.*#incident/)).toBeVisible();
    });
  });

  test.describe('Quiz Step', () => {
    test.beforeEach(async ({ page }) => {
      // Navigate to quiz step
      await page.getByRole('button', { name: /Start Onboarding/i }).click();
      await page.getByRole('button', { name: /Next/i }).click();
      await page.getByRole('button', { name: /Next/i }).click();
      await page.getByRole('button', { name: /Next/i }).click();
    });

    test('should display quiz header', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /Confirmation Quiz/i })).toBeVisible();
      await expect(page.getByText(/理解度を確認/)).toBeVisible();
    });

    test('should display both quiz questions', async ({ page }) => {
      await expect(page.getByText('Question 1')).toBeVisible();
      await expect(page.getByText('Question 2')).toBeVisible();
      await expect(page.getByText(/禁止されているアルゴリズム/)).toBeVisible();
      await expect(page.getByText(/Time Lock期間/)).toBeVisible();
    });

    test('should display quiz options', async ({ page }) => {
      await expect(page.getByText('Dilithium-III')).toBeVisible();
      await expect(page.getByText('ECDSA')).toBeVisible();
      await expect(page.getByText('24時間')).toBeVisible();
    });

    test('complete button should be disabled without answers', async ({ page }) => {
      const completeButton = page.getByRole('button', { name: /Complete Onboarding/i });
      await expect(completeButton).toBeDisabled();
    });

    test('should enable complete button after selecting answers', async ({ page }) => {
      // Select first option for Q1
      await page.getByRole('radio', { name: 'Dilithium-III' }).click();
      // Select first option for Q2
      await page.getByRole('radio', { name: '12時間' }).click();

      const completeButton = page.getByRole('button', { name: /Complete Onboarding/i });
      await expect(completeButton).toBeEnabled();
    });

    test('should show error with wrong answers', async ({ page }) => {
      // Select wrong answers
      await page.getByRole('radio', { name: 'Dilithium-III' }).click();
      await page.getByRole('radio', { name: '12時間' }).click();
      await page.getByRole('button', { name: /Complete Onboarding/i }).click();

      // Error should be visible
      await expect(page.getByRole('alert')).toBeVisible();
      await expect(page.getByText(/正しい回答を選択/)).toBeVisible();
    });

    test('should complete onboarding with correct answers', async ({ page }) => {
      // Select correct answers (ECDSA and 24時間)
      await page.getByRole('radio', { name: 'ECDSA' }).click();
      await page.getByRole('radio', { name: '24時間' }).click();
      await page.getByRole('button', { name: /Complete Onboarding/i }).click();

      // Should show completion screen
      await expect(page.getByRole('heading', { name: /Onboarding Complete/i })).toBeVisible();
    });
  });

  test.describe('Completion Screen', () => {
    test.beforeEach(async ({ page }) => {
      // Navigate through all steps and complete quiz
      await page.getByRole('button', { name: /Start Onboarding/i }).click();
      await page.getByRole('button', { name: /Next/i }).click();
      await page.getByRole('button', { name: /Next/i }).click();
      await page.getByRole('button', { name: /Next/i }).click();
      // Answer quiz correctly
      await page.getByRole('radio', { name: 'ECDSA' }).click();
      await page.getByRole('radio', { name: '24時間' }).click();
      await page.getByRole('button', { name: /Complete Onboarding/i }).click();
    });

    test('should display completion message', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /Onboarding Complete/i })).toBeVisible();
      await expect(page.getByText(/おめでとうございます/)).toBeVisible();
    });

    test('should display new permission level', async ({ page }) => {
      await expect(page.getByText('New Permission Level')).toBeVisible();
      await expect(page.getByText('Operator')).toBeVisible();
    });

    test('should display go to dashboard button', async ({ page }) => {
      await expect(page.getByRole('button', { name: /Go to Dashboard/i })).toBeVisible();
    });

    test('should hide progress indicator', async ({ page }) => {
      const navigation = page.getByRole('navigation');
      await expect(navigation).not.toBeVisible();
    });
  });

  test.describe('Step Navigation', () => {
    test('should allow clicking on completed steps', async ({ page }) => {
      // Go to step 2
      await page.getByRole('button', { name: /Start Onboarding/i }).click();

      // Click on step 1 (completed)
      await page.getByRole('button', { name: /ステップ 1/i }).click();

      // Should be back at welcome
      await expect(page.getByRole('heading', { name: 'Welcome to QS Admin' })).toBeVisible();
    });

    test('should not allow clicking on future steps', async ({ page }) => {
      // Try to click on step 3 while on step 1
      const step3Button = page.getByRole('button', { name: /ステップ 3/i });
      await expect(step3Button).toBeDisabled();
    });

    test('current step should have aria-current', async ({ page }) => {
      const currentStepButton = page.getByRole('button', { name: /ステップ 1/i });
      await expect(currentStepButton).toHaveAttribute('aria-current', 'step');
    });
  });

  test.describe('Keyboard Navigation', () => {
    test('should navigate quiz options with keyboard', async ({ page }) => {
      // Navigate to quiz
      await page.getByRole('button', { name: /Start Onboarding/i }).click();
      await page.getByRole('button', { name: /Next/i }).click();
      await page.getByRole('button', { name: /Next/i }).click();
      await page.getByRole('button', { name: /Next/i }).click();

      // Focus first radio button
      const firstOption = page.getByRole('radio', { name: 'Dilithium-III' });
      await firstOption.focus();
      await expect(firstOption).toBeFocused();

      // Select with Enter/Space
      await page.keyboard.press('Enter');
      await expect(firstOption).toHaveAttribute('aria-checked', 'true');
    });

    test('navigation buttons should be keyboard accessible', async ({ page }) => {
      const startButton = page.getByRole('button', { name: /Start Onboarding/i });
      await startButton.focus();
      await expect(startButton).toBeFocused();

      await page.keyboard.press('Enter');
      await expect(page.getByRole('heading', { name: /Quantum Shield Overview/i })).toBeVisible();
    });
  });

  test.describe('Responsive Design', () => {
    test('should adapt layout on tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });

      await expect(page.getByRole('main')).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Welcome to QS Admin' })).toBeVisible();
    });

    test('should adapt layout on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      await expect(page.getByRole('main')).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Welcome to QS Admin' })).toBeVisible();

      // Progress indicator should still be visible
      const navigation = page.getByRole('navigation');
      await expect(navigation).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper ARIA labels', async ({ page }) => {
      // Main content
      await expect(page.getByRole('main')).toBeVisible();

      // Navigation for progress
      const navigation = page.getByRole('navigation');
      await expect(navigation).toBeVisible();
    });

    test('quiz radiogroups should have proper accessibility', async ({ page }) => {
      // Navigate to quiz
      await page.getByRole('button', { name: /Start Onboarding/i }).click();
      await page.getByRole('button', { name: /Next/i }).click();
      await page.getByRole('button', { name: /Next/i }).click();
      await page.getByRole('button', { name: /Next/i }).click();

      // Check radiogroups exist
      const radiogroups = page.getByRole('radiogroup');
      await expect(radiogroups).toHaveCount(2);

      // Check radios have aria-checked
      const radios = page.getByRole('radio');
      const count = await radios.count();
      expect(count).toBe(8); // 4 options x 2 questions
    });

    test('principle items should have accessible labels', async ({ page }) => {
      // Navigate to principles
      await page.getByRole('button', { name: /Start Onboarding/i }).click();
      await page.getByRole('button', { name: /Next/i }).click();

      // Check articles exist for principles
      const articles = page.locator('article[aria-label^="CP-"]');
      await expect(articles).toHaveCount(5);
    });
  });

  test.describe('English Locale', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/en/admin/onboarding');
    });

    test('should display English text', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'Welcome to QS Admin', level: 1 })).toBeVisible();
      await expect(page.getByText(/Welcome to the Quantum Shield management system/)).toBeVisible();
    });

    test('should display English quiz questions', async ({ page }) => {
      // Navigate to quiz
      await page.getByRole('button', { name: /Start Onboarding/i }).click();
      await page.getByRole('button', { name: /Next/i }).click();
      await page.getByRole('button', { name: /Next/i }).click();
      await page.getByRole('button', { name: /Next/i }).click();

      await expect(page.getByText(/Which algorithm is prohibited/)).toBeVisible();
      await expect(page.getByText(/What is the Time Lock period/)).toBeVisible();
    });
  });
});
