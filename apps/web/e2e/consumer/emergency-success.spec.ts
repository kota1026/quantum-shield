import { test, expect } from '@playwright/test';

/**
 * Consumer App Emergency Success E2E Tests
 * Tests for Screen 16: Emergency Unlock Success
 */

test.describe('Consumer Emergency Success', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ja/consumer/emergency-success');
  });

  test.describe('Page Load & Layout', () => {
    test('should display success page correctly', async ({ page }) => {
      await expect(page).toHaveTitle(/完了/);
      await expect(page.getByRole('heading', { name: /緊急Unlockを開始しました/ })).toBeVisible();
    });

    test('should display success icon', async ({ page }) => {
      // Warning icon for emergency unlock
      const icon = page.locator('.text-warning').first();
      await expect(icon).toBeVisible();
    });

    test('should display subtitle', async ({ page }) => {
      await expect(page.getByText(/7日間の待機期間後/)).toBeVisible();
    });
  });

  test.describe('Time Lock Card', () => {
    test('should display time lock countdown', async ({ page }) => {
      await expect(page.getByText('緊急Time Lock残り時間')).toBeVisible();
    });

    test('should display countdown timer', async ({ page }) => {
      // Format: Xd HH:MM:SS
      const countdown = page.getByText(/\dd \d{2}:\d{2}:\d{2}/);
      await expect(countdown).toBeVisible();
    });

    test('should display progress bar', async ({ page }) => {
      const progressBar = page.locator('.bg-warning.rounded-full').last();
      await expect(progressBar).toBeVisible();
    });

    test('should display challenge period label', async ({ page }) => {
      await expect(page.getByText(/Challenge期間終了まで/)).toBeVisible();
    });
  });

  test.describe('Result Card', () => {
    test('should display unlock amount', async ({ page }) => {
      await expect(page.getByText('Unlock金額')).toBeVisible();
      await expect(page.getByText('10.00 ETH')).toBeVisible();
    });

    test('should display bond amount', async ({ page }) => {
      await expect(page.getByText(/Bond/)).toBeVisible();
      await expect(page.getByText('0.50 ETH')).toBeVisible();
    });

    test('should display estimated completion', async ({ page }) => {
      await expect(page.getByText(/Unlock可能日時|完了予定/)).toBeVisible();
    });

    test('should display transaction hash', async ({ page }) => {
      await expect(page.getByText('TX Hash')).toBeVisible();
      // Should have external link to etherscan
      const txLink = page.locator('a[href*="etherscan"]');
      await expect(txLink).toBeVisible();
    });
  });

  test.describe('Info Box', () => {
    test('should display info message', async ({ page }) => {
      await expect(page.getByText(/7日間のChallenge期間中/)).toBeVisible();
    });
  });

  test.describe('Action Buttons', () => {
    test('should display dashboard button', async ({ page }) => {
      const dashboardButton = page.getByRole('link', { name: /ダッシュボード/i });
      await expect(dashboardButton).toBeVisible();
      await expect(dashboardButton).toHaveAttribute('href', '/consumer/dashboard');
    });

    test('should display history button', async ({ page }) => {
      const historyButton = page.getByRole('link', { name: /履歴/i });
      await expect(historyButton).toBeVisible();
      await expect(historyButton).toHaveAttribute('href', '/consumer/history');
    });
  });

  test.describe('External Links', () => {
    test('transaction link should open in new tab', async ({ page }) => {
      const txLink = page.locator('a[href*="etherscan"]');
      await expect(txLink).toHaveAttribute('target', '_blank');
      await expect(txLink).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });

  test.describe('Countdown Timer', () => {
    test('countdown should decrement', async ({ page }) => {
      const getCountdownValue = async () => {
        const text = await page.getByText(/\dd \d{2}:\d{2}:\d{2}/).textContent();
        return text;
      };

      const initialValue = await getCountdownValue();
      await page.waitForTimeout(2000);
      const newValue = await getCountdownValue();

      expect(initialValue).not.toBe(newValue);
    });
  });

  test.describe('Accessibility', () => {
    test('buttons should be keyboard accessible', async ({ page }) => {
      const dashboardButton = page.getByRole('link', { name: /ダッシュボード/i });
      await dashboardButton.focus();
      await expect(dashboardButton).toBeFocused();
    });
  });

  test.describe('English Locale', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/en/consumer/emergency-success');
    });

    test('should display English text', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /Emergency Unlock Started/ })).toBeVisible();
      await expect(page.getByText('Emergency Time Lock Remaining')).toBeVisible();
      await expect(page.getByText('Unlock Amount')).toBeVisible();
      await expect(page.getByRole('link', { name: /Back to Dashboard/i })).toBeVisible();
      await expect(page.getByRole('link', { name: /View History/i })).toBeVisible();
    });
  });
});
