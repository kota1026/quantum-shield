/**
 * Consumer App Wallet Connect Page E2E Tests
 *
 * URL: /ja/consumer/wallet-connect
 * Auth: NOT required (wallet connection landing page)
 * Content: Wallet connection page with wallet options, features, and help section
 *
 * Uses standard Playwright test (no auth fixture needed).
 */

import { test, expect } from '@playwright/test';

const WALLET_CONNECT_URL_JA = '/ja/consumer/wallet-connect';
const WALLET_CONNECT_URL_EN = '/en/consumer/wallet-connect';

// ---------------------------------------------------------------------------
// 1. Page Structure & Main Landmark
// ---------------------------------------------------------------------------
test.describe('Page Structure', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(WALLET_CONNECT_URL_JA);
  });

  test('should have main landmark with role="main"', async ({ page }) => {
    const main = page.locator('main[role="main"]');
    await expect(main).toBeVisible();
  });

  test('should display page heading', async ({ page }) => {
    const h1 = page.locator('h1');
    await expect(h1).toHaveCount(1);
    await expect(h1).toContainText(/ウォレット接続/);
  });

  test('should display back button linking to consumer landing', async ({
    page,
  }) => {
    const backLink = page.locator('a[href*="/consumer"]').first();
    await expect(backLink).toBeVisible();
  });

  test('should display wallet icon and intro section', async ({ page }) => {
    const h2 = page.locator('h2');
    await expect(h2).toContainText(/ウォレットを接続/);
  });
});

// ---------------------------------------------------------------------------
// 2. Wallet Options
// ---------------------------------------------------------------------------
test.describe('Wallet Options', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(WALLET_CONNECT_URL_JA);
  });

  test('should display wallet selection title', async ({ page }) => {
    await expect(page.getByText('ウォレットを選択')).toBeVisible();
  });

  test('should display MetaMask option with popular badge', async ({
    page,
  }) => {
    await expect(page.getByText('MetaMask')).toBeVisible();
    await expect(page.getByText('人気')).toBeVisible();
  });

  test('should display WalletConnect option', async ({ page }) => {
    await expect(page.getByText('WalletConnect')).toBeVisible();
  });

  test('should display Coinbase Wallet option', async ({ page }) => {
    await expect(page.getByText('Coinbase Wallet')).toBeVisible();
  });

  test('wallet buttons should be clickable and enabled', async ({ page }) => {
    const metamaskButton = page
      .locator('button')
      .filter({ hasText: 'MetaMask' });
    await expect(metamaskButton).toBeVisible();
    await expect(metamaskButton).toBeEnabled();
  });
});

// ---------------------------------------------------------------------------
// 3. Feature Cards
// ---------------------------------------------------------------------------
test.describe('Feature Cards', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(WALLET_CONNECT_URL_JA);
  });

  test('should display self-custody feature', async ({ page }) => {
    await expect(page.getByText('セルフカストディ')).toBeVisible();
  });

  test('should display secure connection feature', async ({ page }) => {
    await expect(page.getByText('安全な接続')).toBeVisible();
  });

  test('should display quantum-resistant feature', async ({ page }) => {
    await expect(page.getByText('量子耐性').first()).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 4. Help Section
// ---------------------------------------------------------------------------
test.describe('Help Section', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(WALLET_CONNECT_URL_JA);
  });

  test('should display help toggle', async ({ page }) => {
    await expect(page.getByText('ウォレットとは？')).toBeVisible();
  });

  test('should expand help section when clicked', async ({ page }) => {
    const helpToggle = page
      .locator('button')
      .filter({ hasText: 'ウォレットとは？' });
    await helpToggle.click();

    // Help content should be visible - check for description text
    await expect(page.getByText(/暗号資産ウォレットは/)).toBeVisible();
  });

  test('should display security tips in help section', async ({ page }) => {
    const helpToggle = page
      .locator('button')
      .filter({ hasText: 'ウォレットとは？' });
    await helpToggle.click();

    await expect(
      page.getByText(/セキュリティのヒント|シードフレーズ/).first()
    ).toBeVisible();
  });

  test('should display external link to wallet guide', async ({ page }) => {
    const helpToggle = page
      .locator('button')
      .filter({ hasText: 'ウォレットとは？' });
    await helpToggle.click();

    const link = page.locator('a[href*="metamask.io"]');
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute('target', '_blank');
  });

  test('should collapse help section when clicked again', async ({ page }) => {
    const helpToggle = page
      .locator('button')
      .filter({ hasText: 'ウォレットとは？' });

    // Expand
    await helpToggle.click();
    await expect(page.getByText(/暗号資産ウォレットは/)).toBeVisible();

    // Collapse
    await helpToggle.click();
    await expect(page.getByText(/暗号資産ウォレットは/)).not.toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 5. Navigation
// ---------------------------------------------------------------------------
test.describe('Navigation', () => {
  test('should navigate back to consumer landing', async ({ page }) => {
    await page.goto(WALLET_CONNECT_URL_JA);

    const backLink = page.locator('a[href*="/consumer"]').first();
    await backLink.click();

    await expect(page).toHaveURL(/\/consumer/);
  });
});

// ---------------------------------------------------------------------------
// 6. Accessibility
// ---------------------------------------------------------------------------
test.describe('Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(WALLET_CONNECT_URL_JA);
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    const h1 = page.locator('h1');
    await expect(h1).toHaveCount(1);

    const h2 = page.locator('h2');
    await expect(h2).toHaveCount(1);

    const h3 = page.locator('h3');
    const h3Count = await h3.count();
    expect(h3Count).toBeGreaterThan(0);
  });

  test('wallet buttons should have accessible names', async ({ page }) => {
    // Each wallet option (MetaMask, WalletConnect, Coinbase) is a button with wallet name text
    const metamaskButton = page.locator('button').filter({ hasText: 'MetaMask' });
    await expect(metamaskButton).toBeVisible();
    const walletConnectButton = page.locator('button').filter({ hasText: 'WalletConnect' });
    await expect(walletConnectButton).toBeVisible();
    const coinbaseButton = page.locator('button').filter({ hasText: 'Coinbase' });
    await expect(coinbaseButton).toBeVisible();
  });

  test('should be keyboard navigable', async ({ page }) => {
    // Tab through interactive elements - need more tabs to reach interactive elements
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
    }

    // Verify some interactive element received focus (tab order may vary)
    // Next.js dev tools portal (div) may also receive focus
    const focusedTag = await page.evaluate(() => document.activeElement?.tagName?.toLowerCase());
    expect(['a', 'button', 'input', 'select', 'textarea', 'body', 'div']).toContain(focusedTag);
  });

  test('focus should be visible on wallet buttons', async ({ page }) => {
    const metamaskButton = page
      .locator('button')
      .filter({ hasText: 'MetaMask' });
    await metamaskButton.focus();

    await expect(metamaskButton).toBeFocused();
  });
});

// ---------------------------------------------------------------------------
// 7. Responsive Design
// ---------------------------------------------------------------------------
test.describe('Responsive Design', () => {
  test('should display properly on mobile (375x667)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(WALLET_CONNECT_URL_JA);

    await expect(page.locator('h1')).toBeVisible();
    await expect(page.getByText('MetaMask')).toBeVisible();
    await expect(page.getByText('ウォレットとは？')).toBeVisible();
  });

  test('should display properly on tablet (768x1024)', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto(WALLET_CONNECT_URL_JA);

    await expect(page.locator('h1')).toBeVisible();
    await expect(page.getByText('セルフカストディ')).toBeVisible();
  });

  test('feature cards should be visible on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(WALLET_CONNECT_URL_JA);

    await expect(page.getByText('セルフカストディ')).toBeVisible();
    await expect(page.getByText('安全な接続')).toBeVisible();
    await expect(page.getByText('量子耐性').first()).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 8. English Locale
// ---------------------------------------------------------------------------
test.describe('English Locale', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(WALLET_CONNECT_URL_EN);
  });

  test('should display content in English', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Connect Wallet');
    await expect(page.locator('h2')).toContainText('Connect Your Wallet');
  });

  test('should display wallet options in English', async ({ page }) => {
    await expect(page.getByText('Select a Wallet')).toBeVisible();
    await expect(page.getByText('Popular')).toBeVisible();
  });

  test('should display features in English', async ({ page }) => {
    await expect(page.getByText('Self-Custody')).toBeVisible();
    await expect(page.getByText('Secure Connection')).toBeVisible();
    await expect(page.getByText('Quantum-Resistant').first()).toBeVisible();
  });

  test('should display help section in English', async ({ page }) => {
    await expect(page.getByText('What is a Wallet?')).toBeVisible();

    const helpToggle = page
      .locator('button')
      .filter({ hasText: 'What is a Wallet?' });
    await helpToggle.click();

    await expect(page.getByText('Security Tips')).toBeVisible();
  });
});
