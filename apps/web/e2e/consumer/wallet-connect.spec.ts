import { test, expect } from '@playwright/test';

/**
 * Consumer App Wallet Connect E2E Tests
 * Tests for Screen 19: wallet_connect
 */

test.describe('Wallet Connect Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ja/consumer/wallet-connect');
  });

  test.describe('Page Structure', () => {
    test('should display page title', async ({ page }) => {
      await expect(page.locator('h1')).toContainText('ウォレット接続');
    });

    test('should display back button', async ({ page }) => {
      const backButton = page.locator('a[aria-label="戻る"]');
      await expect(backButton).toBeVisible();
      await expect(backButton).toHaveAttribute('href', '/consumer');
    });

    test('should have main landmark', async ({ page }) => {
      const main = page.locator('main[role="main"]');
      await expect(main).toBeVisible();
    });

    test('should display wallet icon', async ({ page }) => {
      await expect(page.locator('svg.lucide-wallet')).toBeVisible();
    });

    test('should display intro section', async ({ page }) => {
      await expect(page.locator('h2')).toContainText('ウォレットを接続');
    });
  });

  test.describe('Feature Cards', () => {
    test('should display self-custody feature', async ({ page }) => {
      await expect(page.getByText('セルフカストディ')).toBeVisible();
    });

    test('should display secure connection feature', async ({ page }) => {
      await expect(page.getByText('安全な接続')).toBeVisible();
    });

    test('should display quantum-resistant feature', async ({ page }) => {
      await expect(page.getByText('量子耐性')).toBeVisible();
    });
  });

  test.describe('Wallet Options', () => {
    test('should display wallet selection title', async ({ page }) => {
      await expect(page.getByText('ウォレットを選択')).toBeVisible();
    });

    test('should display MetaMask option', async ({ page }) => {
      await expect(page.getByText('MetaMask')).toBeVisible();
      await expect(page.getByText('人気')).toBeVisible();
    });

    test('should display WalletConnect option', async ({ page }) => {
      await expect(page.getByText('WalletConnect')).toBeVisible();
    });

    test('should display Coinbase Wallet option', async ({ page }) => {
      await expect(page.getByText('Coinbase Wallet')).toBeVisible();
    });

    test('wallet buttons should be clickable', async ({ page }) => {
      const metamaskButton = page.locator('button').filter({ hasText: 'MetaMask' });
      await expect(metamaskButton).toBeVisible();
      await expect(metamaskButton).toBeEnabled();
    });
  });

  test.describe('Help Section', () => {
    test('should display help toggle', async ({ page }) => {
      await expect(page.getByText('ウォレットとは？')).toBeVisible();
    });

    test('should expand help section when clicked', async ({ page }) => {
      const helpToggle = page.locator('button').filter({ hasText: 'ウォレットとは？' });
      await helpToggle.click();

      // Help content should be visible
      await expect(page.getByText('暗号資産ウォレットは')).toBeVisible();
      await expect(page.getByText('セキュリティのヒント')).toBeVisible();
    });

    test('should display security tips in help section', async ({ page }) => {
      const helpToggle = page.locator('button').filter({ hasText: 'ウォレットとは？' });
      await helpToggle.click();

      await expect(page.getByText('シードフレーズを他人に教えないでください')).toBeVisible();
      await expect(page.getByText('公式サイトからのみダウンロード')).toBeVisible();
      await expect(page.getByText('接続先URLを必ず確認')).toBeVisible();
    });

    test('should display external link to wallet guide', async ({ page }) => {
      const helpToggle = page.locator('button').filter({ hasText: 'ウォレットとは？' });
      await helpToggle.click();

      const link = page.locator('a[href*="metamask.io"]');
      await expect(link).toBeVisible();
      await expect(link).toHaveAttribute('target', '_blank');
    });
  });

  test.describe('Navigation', () => {
    test('should navigate back to consumer landing', async ({ page }) => {
      const backButton = page.locator('a[aria-label="戻る"]');
      await backButton.click();
      await expect(page).toHaveURL(/\/consumer$/);
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper heading hierarchy', async ({ page }) => {
      const h1 = page.locator('h1');
      await expect(h1).toHaveCount(1);

      const h2 = page.locator('h2');
      await expect(h2).toHaveCount(1);

      const h3 = page.locator('h3');
      const h3Count = await h3.count();
      expect(h3Count).toBeGreaterThan(0);
    });

    test('wallet buttons should have aria labels', async ({ page }) => {
      const buttons = page.locator('button[aria-label]');
      const count = await buttons.count();
      expect(count).toBeGreaterThan(0);
    });

    test('should be keyboard navigable', async ({ page }) => {
      // Tab to first wallet option
      await page.keyboard.press('Tab'); // Back button
      await page.keyboard.press('Tab'); // First wallet button

      const firstWallet = page.locator('button').filter({ hasText: 'MetaMask' });
      await expect(firstWallet).toBeFocused();
    });

    test('focus should be visible on wallet buttons', async ({ page }) => {
      const metamaskButton = page.locator('button').filter({ hasText: 'MetaMask' });
      await metamaskButton.focus();

      // Check that button has focus styling (ring)
      await expect(metamaskButton).toBeFocused();
    });
  });

  test.describe('Responsive Design', () => {
    test('should display properly on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      await expect(page.locator('h1')).toBeVisible();
      await expect(page.getByText('MetaMask')).toBeVisible();
      await expect(page.getByText('ウォレットとは？')).toBeVisible();
    });

    test('should display properly on tablet', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });

      await expect(page.locator('h1')).toBeVisible();
      await expect(page.getByText('セルフカストディ')).toBeVisible();
    });

    test('feature cards should be visible on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      await expect(page.getByText('セルフカストディ')).toBeVisible();
      await expect(page.getByText('安全な接続')).toBeVisible();
      await expect(page.getByText('量子耐性')).toBeVisible();
    });
  });
});

test.describe('Wallet Connect Page (English)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/en/consumer/wallet-connect');
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
    await expect(page.getByText('Quantum-Resistant')).toBeVisible();
  });

  test('should display help section in English', async ({ page }) => {
    await expect(page.getByText('What is a Wallet?')).toBeVisible();

    const helpToggle = page.locator('button').filter({ hasText: 'What is a Wallet?' });
    await helpToggle.click();

    await expect(page.getByText('Security Tips')).toBeVisible();
  });
});
