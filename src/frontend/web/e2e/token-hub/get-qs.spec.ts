import { test, expect } from '@playwright/test';

test.describe('Token Hub Get QS Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ja/token-hub/get-qs');
  });

  test('should display page title and header', async ({ page }) => {
    await expect(page).toHaveTitle(/QSトークンを入手/);
    await expect(page.getByRole('heading', { name: 'QSトークンの入手方法' })).toBeVisible();
    await expect(page.getByText('トークン取得')).toBeVisible();
  });

  test('should display breadcrumb navigation', async ({ page }) => {
    const breadcrumb = page.getByRole('navigation', { name: /パンくず/ });
    await expect(breadcrumb).toBeVisible();
    await expect(page.getByRole('link', { name: 'ダッシュボード' })).toBeVisible();
  });

  test('should display all acquisition methods', async ({ page }) => {
    // Check all 4 acquisition methods
    await expect(page.getByText('DEXで購入')).toBeVisible();
    await expect(page.getByText('プロトコル報酬を獲得')).toBeVisible();
    await expect(page.getByText('エアドロップ')).toBeVisible();
    await expect(page.getByText('ステーキング報酬')).toBeVisible();
  });

  test('should show recommended badge on DEX method', async ({ page }) => {
    await expect(page.getByText('おすすめ')).toBeVisible();
  });

  test('should display DEX section with exchanges', async ({ page }) => {
    await expect(page.getByRole('heading', { name: '分散型取引所で購入' })).toBeVisible();

    // Check DEX options
    await expect(page.getByText('Uniswap')).toBeVisible();
    await expect(page.getByText('SushiSwap')).toBeVisible();

    // Check trading pairs
    await expect(page.getByText('QS/ETH')).toBeVisible();
    await expect(page.getByText('QS/USDC')).toBeVisible();
  });

  test('should display how to buy steps', async ({ page }) => {
    await expect(page.getByText('QSの購入方法')).toBeVisible();

    // Check step numbers are visible
    await expect(page.getByText('ウォレットをDEXに接続')).toBeVisible();
    await expect(page.getByText('入力トークンとしてETHまたはUSDCを選択')).toBeVisible();
  });

  test('should display contract information', async ({ page }) => {
    await expect(page.getByRole('heading', { name: '公式トークンコントラクト' })).toBeVisible();
    await expect(page.getByText('Ethereum Mainnet')).toBeVisible();
  });

  test('should display security warning', async ({ page }) => {
    const warning = page.getByText('公式コントラクトアドレスのみを使用してください');
    await expect(warning).toBeVisible();
  });

  test('should have external links to DEX platforms', async ({ page }) => {
    const uniswapLink = page.getByRole('link', { name: /Uniswap/ });
    await expect(uniswapLink).toHaveAttribute('href', 'https://app.uniswap.org');
    await expect(uniswapLink).toHaveAttribute('target', '_blank');
    await expect(uniswapLink).toHaveAttribute('rel', 'noopener noreferrer');
  });

  test('should have working CTA buttons', async ({ page }) => {
    // Check CTA section
    await expect(page.getByRole('heading', { name: 'QSをロックする準備はできましたか？' })).toBeVisible();

    // Lock button
    const lockButton = page.getByRole('button', { name: '今すぐQSをロック' });
    await expect(lockButton).toBeVisible();
    await lockButton.click();
    await expect(page).toHaveURL(/\/token-hub\/lock/);
  });

  test('should navigate to onboarding from CTA', async ({ page }) => {
    const learnButton = page.getByRole('button', { name: /veQSについてもっと学ぶ/ });
    await expect(learnButton).toBeVisible();
    await learnButton.click();
    await expect(page).toHaveURL(/\/token-hub\/onboarding/);
  });

  test('should display footer with navigation links', async ({ page }) => {
    await expect(page.getByRole('link', { name: '利用規約' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'プライバシーポリシー' })).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    // Title should be visible
    await expect(page.getByRole('heading', { name: 'QSトークンの入手方法' })).toBeVisible();

    // Method cards should stack
    await expect(page.getByText('DEXで購入')).toBeVisible();
    await expect(page.getByText('エアドロップ')).toBeVisible();

    // CTA should be visible
    await expect(page.getByRole('button', { name: '今すぐQSをロック' })).toBeVisible();
  });

  test('should have proper accessibility', async ({ page }) => {
    // Check main landmark
    await expect(page.getByRole('main')).toBeVisible();

    // Check breadcrumb has aria-label
    const breadcrumb = page.getByRole('navigation', { name: /パンくず/ });
    await expect(breadcrumb).toBeVisible();

    // Check external links have proper attributes
    const externalLinks = page.locator('a[target="_blank"]');
    const count = await externalLinks.count();
    expect(count).toBeGreaterThanOrEqual(2); // At least Uniswap and SushiSwap
  });

  test('should support keyboard navigation', async ({ page }) => {
    // Tab through the page
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Verify focus is visible
    const activeElement = page.locator(':focus');
    await expect(activeElement).toBeVisible();
  });

  test('should work in English locale', async ({ page }) => {
    await page.goto('/en/token-hub/get-qs');

    await expect(page).toHaveTitle(/Get QS Tokens/);
    await expect(page.getByRole('heading', { name: 'How to Get QS Tokens' })).toBeVisible();
    await expect(page.getByText('Buy on DEX')).toBeVisible();
    await expect(page.getByText('Recommended')).toBeVisible();
  });
});
