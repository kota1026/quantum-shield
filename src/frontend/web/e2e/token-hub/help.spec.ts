import { test, expect } from '@playwright/test';

test.describe('Token Hub Help Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ja/token-hub/help');
  });

  test('should display help page with correct title', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'ヘルプ' })).toBeVisible();
  });

  test('should have search input', async ({ page }) => {
    const searchInput = page.getByRole('searchbox', { name: 'ヘルプトピックを検索' });
    await expect(searchInput).toBeVisible();
    await expect(searchInput).toHaveAttribute('placeholder', '質問を検索...');
  });

  test('should have quick links section', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'クイックリンク' })).toBeVisible();

    // Check quick link items
    await expect(page.getByText('トークノミクスを学ぶ')).toBeVisible();
    await expect(page.getByText('QSをロックする')).toBeVisible();
    await expect(page.getByText('ガバナンス参加')).toBeVisible();
    await expect(page.getByText('報酬を確認')).toBeVisible();
  });

  test('should have resources section', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'リソース' })).toBeVisible();

    // Check resource items
    await expect(page.getByText('FAQ')).toBeVisible();
    await expect(page.getByText('QSを入手')).toBeVisible();
    await expect(page.getByText('ドキュメント')).toBeVisible();
    await expect(page.getByText('システム状態')).toBeVisible();
  });

  test('should have tutorial CTA section', async ({ page }) => {
    await expect(page.getByText('はじめてのToken Hub')).toBeVisible();
    await expect(page.getByText('チュートリアルを見る')).toBeVisible();
  });

  test('should have Consumer App link section', async ({ page }) => {
    await expect(page.getByText('Consumer Appを探していますか？')).toBeVisible();
    await expect(page.getByText('Consumer Appへ')).toBeVisible();
  });

  test('should navigate back to settings when clicking back button', async ({ page }) => {
    const backButton = page.getByRole('link', { name: '設定に戻る' });
    await expect(backButton).toBeVisible();
    await backButton.click();
    await expect(page).toHaveURL(/\/token-hub\/settings/);
  });

  test('should navigate to onboarding from tokenomics quick link', async ({ page }) => {
    const tokenomicsLink = page.getByRole('link', { name: /トークノミクスを学ぶ/ });
    await tokenomicsLink.click();
    await expect(page).toHaveURL(/\/token-hub\/onboarding/);
  });

  test('should navigate to lock from locking quick link', async ({ page }) => {
    const lockLink = page.getByRole('link', { name: /QSをロックする/ });
    await lockLink.click();
    await expect(page).toHaveURL(/\/token-hub\/lock/);
  });

  test('should navigate to delegate-list from governance quick link', async ({ page }) => {
    const governanceLink = page.getByRole('link', { name: /ガバナンス参加/ });
    await governanceLink.click();
    await expect(page).toHaveURL(/\/token-hub\/delegate-list/);
  });

  test('should navigate to rewards from rewards quick link', async ({ page }) => {
    const rewardsLink = page.getByRole('link', { name: /報酬を確認/ });
    await rewardsLink.click();
    await expect(page).toHaveURL(/\/token-hub\/rewards/);
  });

  test('should navigate to FAQ from resource link', async ({ page }) => {
    const faqLink = page.getByRole('link', { name: /FAQ.*よくある質問/ });
    await faqLink.click();
    await expect(page).toHaveURL(/\/token-hub\/faq/);
  });

  test('should navigate to get-qs from resource link', async ({ page }) => {
    const getQsLink = page.getByRole('link', { name: /QSを入手.*トークン取得方法/ });
    await getQsLink.click();
    await expect(page).toHaveURL(/\/token-hub\/get-qs/);
  });

  test('should navigate to Consumer App from CTA', async ({ page }) => {
    const consumerAppLink = page.getByRole('link', { name: 'Consumer Appへ' });
    await consumerAppLink.click();
    await expect(page).toHaveURL(/\/consumer\/dashboard/);
  });

  test('should navigate to onboarding from tutorial CTA', async ({ page }) => {
    const tutorialButton = page.getByRole('link', { name: 'チュートリアルを見る' });
    await tutorialButton.click();
    await expect(page).toHaveURL(/\/token-hub\/onboarding/);
  });

  test('should accept search input', async ({ page }) => {
    const searchInput = page.getByRole('searchbox');
    await searchInput.fill('veQS');
    await expect(searchInput).toHaveValue('veQS');
  });
});

test.describe('Token Hub Help Page - English', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/en/token-hub/help');
  });

  test('should display help page in English', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Help' })).toBeVisible();
  });

  test('should have all sections in English', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Quick Links' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Resources' })).toBeVisible();
    await expect(page.getByText('New to Token Hub?')).toBeVisible();
    await expect(page.getByText('Looking for Consumer App?')).toBeVisible();
  });
});

test.describe('Token Hub Help - Accessibility', () => {
  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/ja/token-hub/help');

    // Main heading
    const h1 = page.getByRole('heading', { level: 1 });
    await expect(h1).toHaveText('ヘルプ');

    // Section headings
    const h2s = page.getByRole('heading', { level: 2 });
    await expect(h2s).toHaveCount(2); // Quick Links, Resources
  });

  test('should have accessible search input', async ({ page }) => {
    await page.goto('/ja/token-hub/help');

    const searchInput = page.getByRole('searchbox');
    await expect(searchInput).toHaveAttribute('aria-label', 'ヘルプトピックを検索');
  });

  test('should have accessible back link', async ({ page }) => {
    await page.goto('/ja/token-hub/help');

    const backLink = page.getByRole('link', { name: '設定に戻る' });
    await expect(backLink).toBeVisible();
    await expect(backLink).toHaveAttribute('href', /\/token-hub\/settings/);
  });

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto('/ja/token-hub/help');

    // Tab through focusable elements
    await page.keyboard.press('Tab'); // Focus back button
    await page.keyboard.press('Tab'); // Focus search input
    await page.keyboard.press('Tab'); // Focus first quick link

    // Should be able to navigate
    const activeElement = page.locator(':focus');
    await expect(activeElement).toBeVisible();
  });
});

test.describe('Token Hub Help - Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('should display properly on mobile viewport', async ({ page }) => {
    await page.goto('/ja/token-hub/help');

    // Header should be visible
    await expect(page.getByRole('heading', { name: 'ヘルプ' })).toBeVisible();

    // Search should be visible
    await expect(page.getByRole('searchbox')).toBeVisible();

    // Quick links should be visible
    await expect(page.getByText('トークノミクスを学ぶ')).toBeVisible();
  });

  test('should scroll to reveal all content', async ({ page }) => {
    await page.goto('/ja/token-hub/help');

    // Scroll to bottom
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    // Consumer App section should be visible after scroll
    await expect(page.getByText('Consumer Appを探していますか？')).toBeVisible();
  });
});
