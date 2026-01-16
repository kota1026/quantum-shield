import { test, expect } from '@playwright/test';

/**
 * Consumer App Unlock Success E2E Tests
 * Tests for Screen 10: unlock_complete (Unlock Success)
 */

test.describe('Unlock Success Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ja/consumer/unlock/success');
  });

  test.describe('Page Structure', () => {
    test('should display success icon', async ({ page }) => {
      // Success icon with checkmark
      const successIcon = page.locator('svg.lucide-check-circle');
      await expect(successIcon).toBeVisible();
    });

    test('should display page title and subtitle', async ({ page }) => {
      await expect(page.locator('h1')).toContainText('アンロック開始完了');
      await expect(page.getByText('24時間のTime Lock後、資産がウォレットに転送されます')).toBeVisible();
    });
  });

  test.describe('Time Lock Countdown', () => {
    test('should display time lock section', async ({ page }) => {
      await expect(page.getByText('Time Lock残り時間')).toBeVisible();
    });

    test('should display countdown timer', async ({ page }) => {
      // Timer format: HH:MM:SS
      const timer = page.locator('text=/\\d{2}:\\d{2}:\\d{2}/');
      await expect(timer).toBeVisible();
    });

    test('should display countdown label', async ({ page }) => {
      await expect(page.getByText('アンロック可能まで')).toBeVisible();
    });
  });

  test.describe('Transaction Details', () => {
    test('should display amount', async ({ page }) => {
      await expect(page.getByText('アンロック金額')).toBeVisible();
      await expect(page.getByText('10.00 ETH')).toBeVisible();
    });

    test('should display estimated completion', async ({ page }) => {
      await expect(page.getByText('アンロック可能日時')).toBeVisible();
    });

    test('should display transaction hash with link', async ({ page }) => {
      await expect(page.getByText('TX Hash')).toBeVisible();

      const txLink = page.locator('a[href*="etherscan.io"]');
      await expect(txLink).toBeVisible();
      await expect(txLink).toHaveAttribute('target', '_blank');
      await expect(txLink).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });

  test.describe('Info Box', () => {
    test('should display informational message', async ({ page }) => {
      const infoText = page.getByText(/24時間のセキュリティ待機期間/);
      await expect(infoText).toBeVisible();
    });
  });

  test.describe('Action Buttons', () => {
    test('should display view history button', async ({ page }) => {
      const historyButton = page.getByRole('link', { name: '履歴を確認' });
      await expect(historyButton).toBeVisible();
      await expect(historyButton).toHaveAttribute('href', '/consumer/history');
    });

    test('should display back to dashboard button', async ({ page }) => {
      const dashboardButton = page.getByRole('link', { name: 'ダッシュボードに戻る' });
      await expect(dashboardButton).toBeVisible();
      await expect(dashboardButton).toHaveAttribute('href', '/consumer/dashboard');
    });
  });

  test.describe('Navigation', () => {
    test('should navigate to history when view history is clicked', async ({ page }) => {
      await page.getByRole('link', { name: '履歴を確認' }).click();
      await expect(page).toHaveURL(/\/consumer\/history$/);
    });

    test('should navigate to dashboard when back button is clicked', async ({ page }) => {
      await page.getByRole('link', { name: 'ダッシュボードに戻る' }).click();
      await expect(page).toHaveURL(/\/consumer\/dashboard$/);
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper heading hierarchy', async ({ page }) => {
      const h1 = page.locator('h1');
      await expect(h1).toHaveCount(1);
      await expect(h1).toContainText('アンロック開始完了');
    });

    test('external link should have proper security attributes', async ({ page }) => {
      const externalLink = page.locator('a[href*="etherscan.io"]');
      await expect(externalLink).toHaveAttribute('target', '_blank');
      await expect(externalLink).toHaveAttribute('rel', 'noopener noreferrer');
    });

    test('buttons should be focusable', async ({ page }) => {
      const historyButton = page.getByRole('link', { name: '履歴を確認' });
      await historyButton.focus();
      await expect(historyButton).toBeFocused();

      const dashboardButton = page.getByRole('link', { name: 'ダッシュボードに戻る' });
      await dashboardButton.focus();
      await expect(dashboardButton).toBeFocused();
    });
  });

  test.describe('Responsive Design', () => {
    test('should display properly on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      await expect(page.locator('h1')).toBeVisible();
      await expect(page.getByText('Time Lock残り時間')).toBeVisible();
      await expect(page.getByRole('link', { name: '履歴を確認' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'ダッシュボードに戻る' })).toBeVisible();
    });

    test('should display properly on tablet', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });

      await expect(page.locator('h1')).toBeVisible();
      await expect(page.getByText('10.00 ETH')).toBeVisible();
    });
  });
});

test.describe('Unlock Success Page (English)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/en/consumer/unlock/success');
  });

  test('should display content in English', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Unlock Started');
    await expect(page.getByText('Time Lock')).toBeVisible();
  });

  test('should display action buttons in English', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'View History' })).toBeVisible();
    await expect(page.getByRole('link', { name: /Dashboard/i })).toBeVisible();
  });
});
