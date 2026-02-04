import { test, expect } from '@playwright/test';

test.describe('Enterprise Dashboard Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ja/enterprise/landing');
    // Wait for the page to be fully loaded
    await page.waitForLoadState('networkidle');
  });

  test.describe('Page Structure', () => {
    test('should display the page title', async ({ page }) => {
      await expect(page.getByRole('heading', { level: 1, name: '概要ダッシュボード' })).toBeVisible();
    });

    test('should display the sidebar navigation', async ({ page }) => {
      await expect(page.getByRole('navigation', { name: 'エンタープライズ管理ナビゲーション' })).toBeVisible();
    });

    test('should display all main sections', async ({ page }) => {
      // Stats section
      await expect(page.getByRole('region', { name: '主要統計情報' })).toBeVisible();

      // Main content
      await expect(page.getByRole('main', { name: 'エンタープライズ概要ダッシュボード' })).toBeVisible();
    });
  });

  test.describe('Sidebar Navigation', () => {
    test('should highlight the Overview menu item as active', async ({ page }) => {
      const overviewLink = page.locator('a[href="/enterprise/landing"]');
      await expect(overviewLink).toHaveAttribute('aria-current', 'page');
    });

    test('should display the organization info in footer', async ({ page }) => {
      await expect(page.getByText('Acme Corp')).toBeVisible();
      await expect(page.getByText('Enterprise Plan')).toBeVisible();
    });

    test('should display the ENTERPRISE EDITION badge', async ({ page }) => {
      await expect(page.getByText('ENTERPRISE EDITION')).toBeVisible();
    });

    test('should have working navigation links', async ({ page }) => {
      // Check TVL link exists
      const tvlLink = page.locator('a[href="/enterprise/tvl"]');
      await expect(tvlLink).toBeVisible();

      // Check Volume link exists
      const volumeLink = page.locator('a[href="/enterprise/volume"]');
      await expect(volumeLink).toBeVisible();

      // Check Transactions link with badge
      const transactionsLink = page.locator('a[href="/enterprise/transactions"]');
      await expect(transactionsLink).toBeVisible();
      await expect(transactionsLink.locator('span').filter({ hasText: '247' })).toBeVisible();
    });
  });

  test.describe('Stats Cards', () => {
    test('should display Total Value Locked', async ({ page }) => {
      await expect(page.getByText('Total Value Locked')).toBeVisible();
      await expect(page.getByText('$124.5')).toBeVisible();
    });

    test('should display Monthly Volume', async ({ page }) => {
      await expect(page.getByText('月間ボリューム')).toBeVisible();
      await expect(page.getByText('$47.2')).toBeVisible();
    });

    test('should display Total Transactions', async ({ page }) => {
      await expect(page.getByText('総トランザクション数')).toBeVisible();
      await expect(page.getByText('12,847')).toBeVisible();
    });

    test('should display Active Users', async ({ page }) => {
      await expect(page.getByText('アクティブユーザー')).toBeVisible();
      await expect(page.getByText('1,234')).toBeVisible();
    });
  });

  test.describe('Recent Transactions Table', () => {
    test('should display the table with headers', async ({ page }) => {
      const table = page.getByRole('table');
      await expect(table).toBeVisible();

      await expect(page.getByText('TX ハッシュ')).toBeVisible();
      await expect(page.getByText('種別')).toBeVisible();
      await expect(page.getByText('金額')).toBeVisible();
      await expect(page.getByText('ステータス')).toBeVisible();
      await expect(page.getByText('時間')).toBeVisible();
    });

    test('should display transaction rows', async ({ page }) => {
      // Check for at least one transaction hash
      await expect(page.getByText('0x7a3f...9c2d')).toBeVisible();

      // Check for transaction types
      await expect(page.getByText('ロック').first()).toBeVisible();
    });

    test('should have clickable transaction hashes', async ({ page }) => {
      const txLink = page.locator('a').filter({ hasText: '0x7a3f...9c2d' });
      await expect(txLink).toHaveAttribute('href', /\/enterprise\/transactions\/\d+/);
    });

    test('should display Export and View All buttons', async ({ page }) => {
      await expect(page.getByRole('link', { name: /エクスポート/ })).toBeVisible();
      await expect(page.getByRole('link', { name: /すべて表示/ })).toBeVisible();
    });
  });

  test.describe('Recent Activity List', () => {
    test('should display activity items', async ({ page }) => {
      await expect(page.getByText('最近のアクティビティ')).toBeVisible();

      // Check for activity items
      await expect(page.getByText('New lock transaction')).toBeVisible();
      await expect(page.getByText('User invited: tanaka@acme.co')).toBeVisible();
      await expect(page.getByText('API key created')).toBeVisible();
    });
  });

  test.describe('System Status List', () => {
    test('should display system status items', async ({ page }) => {
      await expect(page.getByText('システムステータス')).toBeVisible();

      // Check for system status items
      await expect(page.getByText('API Gateway')).toBeVisible();
      await expect(page.getByText('Prover Network')).toBeVisible();
      await expect(page.getByText('Ethereum RPC')).toBeVisible();
      await expect(page.getByText('Webhooks')).toBeVisible();
    });
  });

  test.describe('Top Bar', () => {
    test('should display search input', async ({ page }) => {
      const searchInput = page.getByRole('searchbox');
      await expect(searchInput).toBeVisible();
      await expect(searchInput).toHaveAttribute('placeholder', 'トランザクション、ユーザーを検索...');
    });

    test('should display notification button with indicator', async ({ page }) => {
      const notificationBtn = page.getByRole('button', { name: '通知を表示' });
      await expect(notificationBtn).toBeVisible();
    });

    test('should display user menu', async ({ page }) => {
      const userMenu = page.getByRole('button', { name: 'ユーザーメニューを開く' });
      await expect(userMenu).toBeVisible();
      await expect(page.getByText('佐藤')).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper heading hierarchy', async ({ page }) => {
      const h1 = await page.locator('h1').count();
      expect(h1).toBe(1);

      const h2s = page.locator('h2');
      await expect(h2s.first()).toBeVisible();
    });

    test('should have accessible navigation landmarks', async ({ page }) => {
      await expect(page.getByRole('navigation')).toBeVisible();
      await expect(page.getByRole('main')).toBeVisible();
      await expect(page.getByRole('banner')).toBeVisible();
    });

    test('should have keyboard accessible interactive elements', async ({ page }) => {
      // Tab to first interactive element
      await page.keyboard.press('Tab');

      // Check that focus is visible on an interactive element
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
    });
  });

  test.describe('Responsive Design', () => {
    test('should adapt layout for tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });

      // Stats grid should adapt
      const statsSection = page.getByRole('region', { name: '主要統計情報' });
      await expect(statsSection).toBeVisible();
    });

    test('should adapt layout for desktop viewport', async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });

      // Full layout should be visible
      await expect(page.getByRole('navigation', { name: 'エンタープライズ管理ナビゲーション' })).toBeVisible();
      await expect(page.getByRole('main')).toBeVisible();
    });
  });
});

test.describe('Enterprise Dashboard - English', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/en/enterprise/landing');
    await page.waitForLoadState('networkidle');
  });

  test('should display English content', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1, name: 'Overview Dashboard' })).toBeVisible();
    await expect(page.getByText('Total Value Locked')).toBeVisible();
    await expect(page.getByText('Monthly Volume')).toBeVisible();
    await expect(page.getByText('Total Transactions')).toBeVisible();
    await expect(page.getByText('Active Users')).toBeVisible();
  });
});
