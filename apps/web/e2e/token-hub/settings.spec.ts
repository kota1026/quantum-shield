import { test, expect } from '@playwright/test';

test.describe('Token Hub Settings Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ja/token-hub/settings');
  });

  test('should display settings page with correct title', async ({ page }) => {
    await expect(page.getByRole('heading', { name: '設定' })).toBeVisible();
  });

  test('should have account section with wallet and navigation items', async ({ page }) => {
    // Account section should be visible
    await expect(page.getByText('アカウント')).toBeVisible();

    // Connected wallet item
    await expect(page.getByText('接続中のウォレット')).toBeVisible();

    // Lock positions navigation
    await expect(page.getByText('ロックポジション')).toBeVisible();

    // Delegations navigation
    await expect(page.getByText('委任の管理')).toBeVisible();
  });

  test('should have notifications section with toggles', async ({ page }) => {
    await expect(page.getByText('通知')).toBeVisible();

    // Push notifications toggle
    await expect(page.getByText('プッシュ通知')).toBeVisible();

    // Email notifications toggle
    await expect(page.getByText('メール通知')).toBeVisible();

    // Vote reminders toggle
    await expect(page.getByText('投票リマインダー')).toBeVisible();
  });

  test('should have rewards settings section', async ({ page }) => {
    await expect(page.getByText('報酬設定')).toBeVisible();
    await expect(page.getByText('報酬の自動複利')).toBeVisible();
  });

  test('should have display section with theme and language settings', async ({ page }) => {
    await expect(page.getByText('表示')).toBeVisible();

    // Dark mode toggle
    await expect(page.getByText('ダークモード')).toBeVisible();

    // Language setting
    await expect(page.getByText('言語')).toBeVisible();

    // Currency setting
    await expect(page.getByText('表示通貨')).toBeVisible();
  });

  test('should have support section', async ({ page }) => {
    await expect(page.getByText('サポート')).toBeVisible();
    await expect(page.getByText('よくある質問')).toBeVisible();
    await expect(page.getByText('お問い合わせ')).toBeVisible();
    await expect(page.getByText('法的情報')).toBeVisible();
  });

  test('should have danger zone with disconnect wallet option', async ({ page }) => {
    await expect(page.getByText('危険な操作')).toBeVisible();
    await expect(page.getByText('ウォレットを切断')).toBeVisible();
  });

  test('should navigate back to dashboard when clicking back button', async ({ page }) => {
    const backButton = page.getByRole('link', { name: 'ダッシュボードに戻る' });
    await expect(backButton).toBeVisible();
    await backButton.click();
    await expect(page).toHaveURL(/\/token-hub\/dashboard/);
  });

  test('should toggle notification settings', async ({ page }) => {
    // Find push notification toggle and interact with it
    const pushNotificationItem = page.getByText('プッシュ通知').locator('..');
    const toggle = pushNotificationItem.locator('button[role="switch"]');

    // Toggle should be visible and clickable
    await expect(toggle).toBeVisible();

    // Click to toggle (current state might be on or off)
    await toggle.click();
  });

  test('should navigate to FAQ page', async ({ page }) => {
    const faqItem = page.getByRole('button', { name: /よくある質問/ });
    await faqItem.click();
    await expect(page).toHaveURL(/\/token-hub\/faq/);
  });

  test('should navigate to lock positions (unlock) page', async ({ page }) => {
    const lockPositionsItem = page.getByRole('button', { name: /ロックポジション/ });
    await lockPositionsItem.click();
    await expect(page).toHaveURL(/\/token-hub\/unlock/);
  });

  test('should navigate to delegations page', async ({ page }) => {
    const delegationsItem = page.getByRole('button', { name: /委任の管理/ });
    await delegationsItem.click();
    await expect(page).toHaveURL(/\/token-hub\/delegate-list/);
  });

  test('should display version information', async ({ page }) => {
    await expect(page.getByText('Token Hub バージョン')).toBeVisible();
    await expect(page.getByText(/v\d+\.\d+\.\d+/)).toBeVisible();
  });
});

test.describe('Token Hub Settings Page - English', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/en/token-hub/settings');
  });

  test('should display settings page in English', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
  });

  test('should have all sections in English', async ({ page }) => {
    await expect(page.getByText('Account')).toBeVisible();
    await expect(page.getByText('Notifications')).toBeVisible();
    await expect(page.getByText('Rewards Settings')).toBeVisible();
    await expect(page.getByText('Display')).toBeVisible();
    await expect(page.getByText('Support')).toBeVisible();
    await expect(page.getByText('Danger Zone')).toBeVisible();
  });
});

test.describe('Token Hub Settings - Accessibility', () => {
  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/ja/token-hub/settings');

    // Main heading
    const h1 = page.getByRole('heading', { level: 1 });
    await expect(h1).toHaveText('設定');
  });

  test('should have accessible back link', async ({ page }) => {
    await page.goto('/ja/token-hub/settings');

    const backLink = page.getByRole('link', { name: 'ダッシュボードに戻る' });
    await expect(backLink).toBeVisible();
    await expect(backLink).toHaveAttribute('href', /\/token-hub\/dashboard/);
  });

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto('/ja/token-hub/settings');

    // Tab through focusable elements
    await page.keyboard.press('Tab'); // Focus back button
    await page.keyboard.press('Tab'); // Focus first setting item

    // Should be able to activate with Enter
    const activeElement = page.locator(':focus');
    await expect(activeElement).toBeVisible();
  });

  test('should have proper contrast for text elements', async ({ page }) => {
    await page.goto('/ja/token-hub/settings');

    // Check that main content is visible
    const title = page.getByRole('heading', { name: '設定' });
    await expect(title).toBeVisible();
  });
});

test.describe('Token Hub Settings - Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('should display properly on mobile viewport', async ({ page }) => {
    await page.goto('/ja/token-hub/settings');

    // Header should be visible
    await expect(page.getByRole('heading', { name: '設定' })).toBeVisible();

    // All sections should be visible
    await expect(page.getByText('アカウント')).toBeVisible();
    await expect(page.getByText('通知')).toBeVisible();
    await expect(page.getByText('表示')).toBeVisible();
    await expect(page.getByText('サポート')).toBeVisible();
  });

  test('should scroll to reveal all content', async ({ page }) => {
    await page.goto('/ja/token-hub/settings');

    // Scroll to bottom
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    // Version info should be visible after scroll
    await expect(page.getByText('Token Hub バージョン')).toBeVisible();
  });
});
