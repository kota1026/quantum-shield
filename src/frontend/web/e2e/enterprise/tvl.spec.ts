import { test, expect } from '@playwright/test';

test.describe('Enterprise TVL Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ja/enterprise/tvl');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Page Structure', () => {
    test('should display the page title', async ({ page }) => {
      await expect(page.getByRole('heading', { level: 1, name: 'TVLダッシュボード' })).toBeVisible();
    });

    test('should display the sidebar navigation', async ({ page }) => {
      await expect(page.getByRole('navigation', { name: 'エンタープライズ管理ナビゲーション' })).toBeVisible();
    });

    test('should highlight TVL in sidebar as active', async ({ page }) => {
      const tvlLink = page.locator('a[href="/enterprise/tvl"]');
      await expect(tvlLink).toHaveAttribute('aria-current', 'page');
    });

    test('should display main content area', async ({ page }) => {
      await expect(page.getByRole('main', { name: 'TVL分析ダッシュボード' })).toBeVisible();
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

    test('should display all time periods', async ({ page }) => {
      await expect(page.getByRole('button', { name: '24時間' })).toBeVisible();
      await expect(page.getByRole('button', { name: '7日' })).toBeVisible();
      await expect(page.getByRole('button', { name: '30日' })).toBeVisible();
      await expect(page.getByRole('button', { name: '90日' })).toBeVisible();
      await expect(page.getByRole('button', { name: '1年' })).toBeVisible();
    });
  });

  test.describe('Stats Cards', () => {
    test('should display Total Value Locked stat', async ({ page }) => {
      await expect(page.getByText('Total Value Locked').first()).toBeVisible();
      await expect(page.getByText('$124.5')).toBeVisible();
    });

    test('should display Your TVL stat', async ({ page }) => {
      await expect(page.getByText('組織のTVL')).toBeVisible();
      await expect(page.getByText('$8.2')).toBeVisible();
    });

    test('should display Market Share stat', async ({ page }) => {
      await expect(page.getByText('マーケットシェア')).toBeVisible();
      await expect(page.getByText('6.6')).toBeVisible();
    });

    test('should display Depositors stat', async ({ page }) => {
      await expect(page.getByText('預入者数')).toBeVisible();
      await expect(page.getByText('1,847')).toBeVisible();
    });

    test('should display change indicators', async ({ page }) => {
      await expect(page.getByText('12.4% vs last month')).toBeVisible();
      await expect(page.getByText('5.3% vs last month')).toBeVisible();
    });
  });

  test.describe('TVL Chart', () => {
    test('should display TVL chart section', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'TVL推移' })).toBeVisible();
    });

    test('should display chart with grid labels', async ({ page }) => {
      await expect(page.getByText('$150M')).toBeVisible();
      await expect(page.getByText('$100M')).toBeVisible();
      await expect(page.getByText('$50M')).toBeVisible();
      await expect(page.getByText('$0')).toBeVisible();
    });

    test('should have accessible chart', async ({ page }) => {
      const chart = page.getByRole('img', { name: '選択期間のTVL推移グラフ' });
      await expect(chart).toBeVisible();
    });
  });

  test.describe('Asset Breakdown', () => {
    test('should display asset breakdown section', async ({ page }) => {
      await expect(page.getByRole('heading', { name: '資産内訳' })).toBeVisible();
    });

    test('should display Ethereum asset', async ({ page }) => {
      await expect(page.getByText('Ethereum')).toBeVisible();
      await expect(page.getByText('$78.5M')).toBeVisible();
      await expect(page.getByText('全体の63.1%')).toBeVisible();
    });

    test('should display WBTC asset', async ({ page }) => {
      await expect(page.getByText('WBTC')).toBeVisible();
      await expect(page.getByText('$32.4M')).toBeVisible();
      await expect(page.getByText('全体の26.0%')).toBeVisible();
    });

    test('should display USDC asset', async ({ page }) => {
      await expect(page.getByText('USDC')).toBeVisible();
      await expect(page.getByText('$13.6M')).toBeVisible();
      await expect(page.getByText('全体の10.9%')).toBeVisible();
    });

    test('should have accessible asset list', async ({ page }) => {
      const assetList = page.getByRole('list', { name: 'ロック資産の内訳一覧' });
      await expect(assetList).toBeVisible();

      const items = assetList.getByRole('listitem');
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

      const statsSection = page.getByRole('region', { name: 'TVL統計情報' });
      await expect(statsSection).toBeVisible();
    });

    test('should adapt layout for mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      // Stats should stack
      await expect(page.getByText('Total Value Locked').first()).toBeVisible();
      await expect(page.getByText('組織のTVL')).toBeVisible();
    });
  });
});

test.describe('Enterprise TVL Dashboard - English', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/en/enterprise/tvl');
    await page.waitForLoadState('networkidle');
  });

  test('should display English content', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1, name: 'TVL Dashboard' })).toBeVisible();
    await expect(page.getByText('Total Value Locked').first()).toBeVisible();
    await expect(page.getByText('Your TVL')).toBeVisible();
    await expect(page.getByText('Market Share')).toBeVisible();
    await expect(page.getByText('Unique Depositors')).toBeVisible();
  });

  test('should display English time periods', async ({ page }) => {
    await expect(page.getByRole('button', { name: '24H' })).toBeVisible();
    await expect(page.getByRole('button', { name: '7D' })).toBeVisible();
    await expect(page.getByRole('button', { name: '30D' })).toBeVisible();
    await expect(page.getByRole('button', { name: '90D' })).toBeVisible();
    await expect(page.getByRole('button', { name: '1Y' })).toBeVisible();
  });
});
