import { test, expect } from '@playwright/test';

test.describe('Token Hub Consumer Link Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ja/token-hub/consumer-link');
  });

  test('should display page with correct title', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'アプリ連携' })).toBeVisible();
  });

  test('should display subtitle', async ({ page }) => {
    await expect(page.getByText('Consumer AppとToken Hubの使い分け')).toBeVisible();
  });

  test('should have Consumer App card', async ({ page }) => {
    // Consumer App heading
    await expect(page.getByRole('heading', { name: 'Consumer App' })).toBeVisible();
    await expect(page.getByText('資産保護アプリ')).toBeVisible();

    // Features
    await expect(page.getByText('資産をロック')).toBeVisible();
    await expect(page.getByText('アンロック')).toBeVisible();
    await expect(page.getByText('緊急アンロック')).toBeVisible();
    await expect(page.getByText('取引履歴')).toBeVisible();

    // CTA button
    await expect(page.getByRole('link', { name: 'Consumer Appを開く' })).toBeVisible();
  });

  test('should have Token Hub card with current badge', async ({ page }) => {
    // Token Hub heading
    await expect(page.getByRole('heading', { name: 'Token Hub' })).toBeVisible();
    await expect(page.getByText('ガバナンスアプリ')).toBeVisible();

    // Current badge
    await expect(page.getByText('現在のアプリ')).toBeVisible();

    // Features
    await expect(page.getByText('veQSを獲得')).toBeVisible();
    await expect(page.getByText('ガバナンス投票')).toBeVisible();
    await expect(page.getByText('投票権の委任')).toBeVisible();
    await expect(page.getByText('報酬を請求')).toBeVisible();

    // CTA button
    await expect(page.getByRole('link', { name: 'Token Hubダッシュボード' })).toBeVisible();
  });

  test('should have connection explanation section', async ({ page }) => {
    await expect(page.getByText('2つのアプリは連携しています')).toBeVisible();
    await expect(page.getByText(/Consumer Appでロックした資産の一部を使って/)).toBeVisible();
  });

  test('should navigate back to dashboard when clicking back button', async ({ page }) => {
    const backButton = page.getByRole('link', { name: 'ダッシュボードに戻る' });
    await expect(backButton).toBeVisible();
    await backButton.click();
    await expect(page).toHaveURL(/\/token-hub\/dashboard/);
  });

  test('should navigate to Consumer App when clicking CTA', async ({ page }) => {
    const consumerAppLink = page.getByRole('link', { name: 'Consumer Appを開く' });
    await consumerAppLink.click();
    await expect(page).toHaveURL(/\/consumer\/dashboard/);
  });

  test('should navigate to Token Hub dashboard when clicking CTA', async ({ page }) => {
    const tokenHubLink = page.getByRole('link', { name: 'Token Hubダッシュボード' });
    await tokenHubLink.click();
    await expect(page).toHaveURL(/\/token-hub\/dashboard/);
  });
});

test.describe('Token Hub Consumer Link Page - English', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/en/token-hub/consumer-link');
  });

  test('should display page in English', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'App Integration' })).toBeVisible();
  });

  test('should have all sections in English', async ({ page }) => {
    // Consumer App section
    await expect(page.getByRole('heading', { name: 'Consumer App' })).toBeVisible();
    await expect(page.getByText('Asset Protection')).toBeVisible();

    // Token Hub section
    await expect(page.getByRole('heading', { name: 'Token Hub' })).toBeVisible();
    await expect(page.getByText('Governance App')).toBeVisible();
    await expect(page.getByText('Current App')).toBeVisible();

    // Connection section
    await expect(page.getByText('The Two Apps Work Together')).toBeVisible();
  });
});

test.describe('Token Hub Consumer Link - Accessibility', () => {
  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/ja/token-hub/consumer-link');

    // Main heading
    const h1 = page.getByRole('heading', { level: 1 });
    await expect(h1).toHaveText('アプリ連携');

    // Section headings (Consumer App, Token Hub, connection)
    const h2s = page.getByRole('heading', { level: 2 });
    await expect(h2s).toHaveCount(2); // Consumer App, Token Hub

    const h3 = page.getByRole('heading', { level: 3 });
    await expect(h3).toHaveText('2つのアプリは連携しています');
  });

  test('should have accessible feature lists', async ({ page }) => {
    await page.goto('/ja/token-hub/consumer-link');

    // Check for feature lists with proper aria-label
    const consumerFeaturesList = page.getByRole('list', { name: 'Consumer Appの機能一覧' });
    await expect(consumerFeaturesList).toBeVisible();

    const tokenHubFeaturesList = page.getByRole('list', { name: 'Token Hubの機能一覧' });
    await expect(tokenHubFeaturesList).toBeVisible();
  });

  test('should have accessible back link', async ({ page }) => {
    await page.goto('/ja/token-hub/consumer-link');

    const backLink = page.getByRole('link', { name: 'ダッシュボードに戻る' });
    await expect(backLink).toBeVisible();
    await expect(backLink).toHaveAttribute('href', /\/token-hub\/dashboard/);
  });

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto('/ja/token-hub/consumer-link');

    // Tab through focusable elements
    await page.keyboard.press('Tab'); // Focus back button
    await page.keyboard.press('Tab'); // Focus Consumer App CTA
    await page.keyboard.press('Tab'); // Focus Token Hub CTA

    // Should be able to navigate
    const activeElement = page.locator(':focus');
    await expect(activeElement).toBeVisible();
  });
});

test.describe('Token Hub Consumer Link - Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('should display properly on mobile viewport', async ({ page }) => {
    await page.goto('/ja/token-hub/consumer-link');

    // Header should be visible
    await expect(page.getByRole('heading', { name: 'アプリ連携' })).toBeVisible();

    // Both app cards should be visible (stacked vertically)
    await expect(page.getByRole('heading', { name: 'Consumer App' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Token Hub' })).toBeVisible();
  });

  test('should scroll to reveal all content', async ({ page }) => {
    await page.goto('/ja/token-hub/consumer-link');

    // Scroll to bottom
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    // Connection section should be visible after scroll
    await expect(page.getByText('2つのアプリは連携しています')).toBeVisible();
  });

  test('should have full-width buttons on mobile', async ({ page }) => {
    await page.goto('/ja/token-hub/consumer-link');

    // CTA buttons should be visible and accessible
    const consumerAppButton = page.getByRole('link', { name: 'Consumer Appを開く' });
    await expect(consumerAppButton).toBeVisible();

    const tokenHubButton = page.getByRole('link', { name: 'Token Hubダッシュボード' });
    await expect(tokenHubButton).toBeVisible();
  });
});
