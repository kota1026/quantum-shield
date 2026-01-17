import { test, expect } from '@playwright/test';

test.describe('Enterprise Volume Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ja/enterprise/volume');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Page Structure', () => {
    test('should display the page title', async ({ page }) => {
      await expect(page.getByRole('heading', { level: 1, name: 'ボリュームダッシュボード' })).toBeVisible();
    });

    test('should display the sidebar navigation', async ({ page }) => {
      await expect(page.getByRole('navigation', { name: 'エンタープライズ管理ナビゲーション' })).toBeVisible();
    });

    test('should highlight Volume in sidebar as active', async ({ page }) => {
      const volumeLink = page.locator('a[href="/enterprise/volume"]');
      await expect(volumeLink).toHaveAttribute('aria-current', 'page');
    });

    test('should display main content area', async ({ page }) => {
      await expect(page.getByRole('main', { name: 'ボリューム分析ダッシュボード' })).toBeVisible();
    });
  });

  test.describe('Time Filter', () => {
    test('should display time period filter', async ({ page }) => {
      await expect(page.getByRole('group', { name: '期間を選択' })).toBeVisible();
    });

    test('should have 30D selected by default', async ({ page }) => {
      const button30d = page.getByRole('button', { name: '30日' });
      await expect(button30d).toHaveAttribute('aria-pressed', 'true');
    });

    test('should allow changing time period', async ({ page }) => {
      const button7d = page.getByRole('button', { name: '7日' });
      await button7d.click();
      await expect(button7d).toHaveAttribute('aria-pressed', 'true');

      const button30d = page.getByRole('button', { name: '30日' });
      await expect(button30d).toHaveAttribute('aria-pressed', 'false');
    });
  });

  test.describe('Stats Cards', () => {
    test('should display 24H Volume stat', async ({ page }) => {
      await expect(page.getByText('24時間ボリューム')).toBeVisible();
      await expect(page.getByText('$4.2')).toBeVisible();
    });

    test('should display 7D Volume stat', async ({ page }) => {
      await expect(page.getByText('7日間ボリューム')).toBeVisible();
      await expect(page.getByText('$28.7')).toBeVisible();
    });

    test('should display 30D Volume stat', async ({ page }) => {
      await expect(page.getByText('30日間ボリューム')).toBeVisible();
      await expect(page.getByText('$124.5')).toBeVisible();
    });

    test('should display Transactions stat', async ({ page }) => {
      await expect(page.getByText('トランザクション数')).toBeVisible();
      await expect(page.getByText('12,847')).toBeVisible();
    });

    test('should display change indicators', async ({ page }) => {
      await expect(page.getByText('15.3% vs yesterday')).toBeVisible();
      await expect(page.getByText('8.2% vs last week')).toBeVisible();
    });
  });

  test.describe('Volume Chart', () => {
    test('should display volume chart section', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'ボリューム推移' })).toBeVisible();
    });

    test('should have accessible chart', async ({ page }) => {
      const chart = page.getByRole('img', { name: '選択期間のボリューム推移グラフ' });
      await expect(chart).toBeVisible();
    });
  });

  test.describe('Token Breakdown', () => {
    test('should display token breakdown section', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'トークン別ボリューム' })).toBeVisible();
    });

    test('should display Ethereum token', async ({ page }) => {
      await expect(page.getByText('ETH')).toBeVisible();
      await expect(page.getByText('Ethereum')).toBeVisible();
      await expect(page.getByText('$67.2M')).toBeVisible();
    });

    test('should display WBTC token', async ({ page }) => {
      await expect(page.getByText('WBTC')).toBeVisible();
      await expect(page.getByText('Wrapped Bitcoin')).toBeVisible();
      await expect(page.getByText('$35.8M')).toBeVisible();
    });

    test('should display USDC token', async ({ page }) => {
      await expect(page.getByText('USDC')).toBeVisible();
      await expect(page.getByText('USD Coin')).toBeVisible();
      await expect(page.getByText('$21.5M')).toBeVisible();
    });

    test('should have accessible token list', async ({ page }) => {
      const tokenList = page.getByRole('list', { name: 'トークン別取引ボリューム内訳' });
      await expect(tokenList).toBeVisible();

      const items = tokenList.getByRole('listitem');
      await expect(items).toHaveCount(3);
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper heading hierarchy', async ({ page }) => {
      const h1 = await page.locator('h1').count();
      expect(h1).toBe(1);

      const h2s = page.locator('h2');
      await expect(h2s).toHaveCount(2);
    });

    test('should have accessible navigation landmarks', async ({ page }) => {
      await expect(page.getByRole('navigation')).toBeVisible();
      await expect(page.getByRole('main')).toBeVisible();
      await expect(page.getByRole('banner')).toBeVisible();
    });

    test('should have keyboard accessible time filter', async ({ page }) => {
      const firstButton = page.getByRole('button', { name: '24時間' });
      await firstButton.focus();
      await expect(firstButton).toBeFocused();

      await page.keyboard.press('Tab');
      const secondButton = page.getByRole('button', { name: '7日' });
      await expect(secondButton).toBeFocused();
    });
  });

  test.describe('Responsive Design', () => {
    test('should adapt stats grid for tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });

      const statsSection = page.getByRole('region', { name: 'ボリューム統計情報' });
      await expect(statsSection).toBeVisible();
    });

    test('should adapt layout for mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      await expect(page.getByText('24時間ボリューム')).toBeVisible();
      await expect(page.getByText('7日間ボリューム')).toBeVisible();
    });
  });
});

test.describe('Enterprise Volume Dashboard - English', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/en/enterprise/volume');
    await page.waitForLoadState('networkidle');
  });

  test('should display English content', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1, name: 'Volume Dashboard' })).toBeVisible();
    await expect(page.getByText('24H Volume')).toBeVisible();
    await expect(page.getByText('7D Volume')).toBeVisible();
    await expect(page.getByText('30D Volume')).toBeVisible();
    await expect(page.getByText('Transactions')).toBeVisible();
  });

  test('should display English time periods', async ({ page }) => {
    await expect(page.getByRole('button', { name: '24H' })).toBeVisible();
    await expect(page.getByRole('button', { name: '7D' })).toBeVisible();
    await expect(page.getByRole('button', { name: '30D' })).toBeVisible();
    await expect(page.getByRole('button', { name: '90D' })).toBeVisible();
    await expect(page.getByRole('button', { name: '1Y' })).toBeVisible();
  });
});
